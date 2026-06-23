import Anthropic from "@anthropic-ai/sdk";
import {
  Client,
  CompanyRules,
  NegotiationResult,
  NegotiationOffer,
  ReasoningStep,
} from "./types";

// ============================================================
// MOTOR DE NEGOCIACAO — o coracao do Recuper.ai
//
// negotiate() recebe o cliente, as regras da empresa e a ultima
// mensagem do devedor, e devolve: a resposta a ser enviada, a oferta
// (sempre dentro das regras), o raciocinio (transparencia) e a
// probabilidade de pagamento.
//
// - Com ANTHROPIC_API_KEY definida -> usa o Claude de verdade.
// - Sem a chave -> "modo demo": negociacao simulada por regras,
//   pra voce ver o produto rodando antes de configurar nada.
// ============================================================

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

// ---- Estimativa de probabilidade a partir do historico (prior) ----
// Usado no modo demo e tambem oferecido ao Claude como ponto de partida.
export function estimateProbability(client: Client): number {
  const h = client.history;
  if (h.length === 0) {
    // Sem historico: usa apenas dias de atraso atual
    return Math.max(10, 90 - client.daysOverdue * 2);
  }
  const avgLate = h.reduce((s, p) => s + Math.max(0, p.daysLate), 0) / h.length;
  const neverPaid = h.filter((p) => p.paidDate === null).length;
  let score = 95;
  score -= avgLate * 1.5; // quanto mais costuma atrasar, menor a chance
  score -= client.daysOverdue * 1.2; // atraso atual pesa
  score -= neverPaid * 25; // calotes anteriores pesam muito
  if (client.debt > 3000) score -= 8; // valores altos sao mais dificeis
  return Math.max(5, Math.min(97, Math.round(score)));
}

// Sugere acao preventiva ANTES do vencimento (previsao de inadimplencia)
export function predictAction(client: Client): string | null {
  const prob = estimateProbability(client);
  if (client.daysOverdue > 0) return null; // ja venceu, nao e mais previsao
  if (prob < 70) {
    return `${client.name} tem alto risco de atrasar (${100 - prob}% de chance). Enviar lembrete antecipado com Pix programado.`;
  }
  return null;
}

function buildSystemPrompt(client: Client, rules: CompanyRules): string {
  const toneMap = {
    amigavel: "amigavel, caloroso e empatico, usando linguagem proxima",
    neutro: "profissional e direto, cordial mas objetivo",
    firme: "respeitoso porem firme, deixando claro a urgencia sem ameacar",
  };
  return `Voce e um assistente de cobranca da empresa "${rules.companyName}". Sua funcao e negociar pagamentos em atraso com clientes, por WhatsApp, recuperando o valor devido SEM perder o cliente.

PERFIL DO CLIENTE:
- Nome: ${client.name}
- Contrato: ${client.company}
- Valor devido: R$ ${client.debt.toFixed(2)}
- Dias em atraso: ${client.daysOverdue}
- Historico: ${client.history.length} pagamentos anteriores, atraso medio de ${Math.round(client.history.reduce((s, p) => s + Math.max(0, p.daysLate), 0) / Math.max(1, client.history.length))} dias.

REGRAS DA EMPRESA (voce NUNCA pode ultrapassar):
- Parcelamento: ate ${rules.maxInstallments}x sem juros.
- Desconto: ate ${rules.maxDiscountPercent}%, e SOMENTE para dividas acima de R$ ${rules.minAmountForDiscount.toFixed(2)}.
- Mudanca de vencimento: ${rules.allowDueDateChange ? "permitida" : "NAO permitida"}.
- Tom de voz: ${toneMap[rules.tone]}.

REGRAS LEGAIS (Codigo de Defesa do Consumidor — obrigatorias):
- Nunca ameace, constranja ou exponha o cliente.
- Nunca cobre em tom agressivo ou humilhante.
- Seja sempre respeitoso, mesmo que o cliente seja grosseiro.
- Ofereca sempre uma saida (forma de regularizar).

COMO RESPONDER:
- Mensagens curtas, naturais, como WhatsApp real. Pode usar no maximo 1 emoji.
- Se o cliente disser que esta sem dinheiro/apertado: ofereca parcelamento ou novo vencimento.
- Se o cliente achar caro e a divida permitir desconto: ofereca o desconto dentro do limite.
- Se o cliente so quiser pagar: facilite com o Pix.
- Proponha UMA opcao clara por vez, no maximo duas.

Responda APENAS com um objeto JSON valido, sem markdown, sem texto antes ou depois, neste formato exato:
{
  "reply": "a mensagem que sera enviada ao cliente",
  "offer": {
    "type": "parcelamento | desconto | novo_vencimento | pix_imediato | nenhuma",
    "installments": numero ou null,
    "discountPercent": numero ou null,
    "newDueDate": "texto da nova data ou null",
    "description": "resumo curto da oferta"
  },
  "reasoning": [
    {"icon": "history", "text": "observacao sobre o historico/contexto"},
    {"icon": "shield-check", "text": "qual regra da empresa foi aplicada"},
    {"icon": "target", "text": "estrategia escolhida e por que"}
  ],
  "paymentProbability": numero de 0 a 100
}`;
}

// ---- Chamada real ao Claude ----
async function negotiateWithClaude(
  client: Client,
  rules: CompanyRules,
  incomingMessage: string
): Promise<NegotiationResult> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const history = client.messages
    .filter((m) => m.sender !== "sistema")
    .map((m) => ({
      role: (m.sender === "ai" ? "assistant" : "user") as "assistant" | "user",
      content: m.text,
    }));

  const messages = [
    ...history,
    { role: "user" as const, content: incomingMessage },
  ];

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(client, rules),
    messages,
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const raw = textBlock && "text" in textBlock ? textBlock.text : "";
  const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

  const parsed = JSON.parse(cleaned);
  return {
    reply: parsed.reply,
    offer: normalizeOffer(parsed.offer, rules, client),
    reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning : [],
    paymentProbability: clamp(parsed.paymentProbability ?? estimateProbability(client)),
    mode: "claude",
  };
}

// Garante que a oferta da IA respeita as regras (camada de seguranca)
function normalizeOffer(
  offer: Partial<NegotiationOffer> | undefined,
  rules: CompanyRules,
  client: Client
): NegotiationOffer {
  if (!offer || !offer.type) {
    return { type: "nenhuma", description: "Sem oferta" };
  }
  const o: NegotiationOffer = {
    type: offer.type,
    description: offer.description || "",
  };
  if (offer.installments) {
    o.installments = Math.min(offer.installments, rules.maxInstallments);
  }
  if (offer.discountPercent) {
    // Desconto so vale acima do valor minimo e dentro do limite
    o.discountPercent =
      client.debt >= rules.minAmountForDiscount
        ? Math.min(offer.discountPercent, rules.maxDiscountPercent)
        : 0;
  }
  if (offer.newDueDate && rules.allowDueDateChange) {
    o.newDueDate = offer.newDueDate;
  }
  return o;
}

// ---- Modo demo: negociacao simulada por regras ----
function negotiateDemo(
  client: Client,
  rules: CompanyRules,
  incomingMessage: string
): NegotiationResult {
  const msg = incomingMessage.toLowerCase();
  const prob = estimateProbability(client);
  const reasoning: ReasoningStep[] = [];

  const avgLate = Math.round(
    client.history.reduce((s, p) => s + Math.max(0, p.daysLate), 0) /
      Math.max(1, client.history.length)
  );
  reasoning.push({
    icon: "history",
    text: `Historico: ${client.name.split(" ")[0]} costuma atrasar ~${avgLate} dias.`,
  });

  let reply: string;
  let offer: NegotiationOffer;

  const semGrana = ["sem dinheiro", "sem grana", "apertou", "apertado", "nao consigo", "não consigo", "dificil", "difícil", "desempregad", "sem condic"].some((k) => msg.includes(k));
  const achouCaro = ["caro", "desconto", "abatimento", "muito alto"].some((k) => msg.includes(k));
  const querPagar = ["pagar", "pix", "boleto", "como faco", "como faço", "link", "segunda via"].some((k) => msg.includes(k));

  if (semGrana) {
    if (rules.allowDueDateChange && client.debt < rules.minAmountForDiscount) {
      offer = {
        type: "parcelamento",
        installments: Math.min(2, rules.maxInstallments),
        description: `Parcelado em ${Math.min(2, rules.maxInstallments)}x sem juros`,
      };
      reply = `Sem problemas, ${client.name.split(" ")[0]}! Posso dividir em ${Math.min(2, rules.maxInstallments)}x sem juros ou mudar o vencimento pra proxima sexta. Qual fica melhor pra voce? 😊`;
      reasoning.push({ icon: "shield-check", text: `Regra aplicada: parcelamento ate ${rules.maxInstallments}x sem juros.` });
      reasoning.push({ icon: "target", text: "Cliente sinalizou aperto: prioriza facilitar, nao pressionar." });
    } else {
      offer = {
        type: "parcelamento",
        installments: rules.maxInstallments,
        description: `Parcelado em ate ${rules.maxInstallments}x`,
      };
      reply = `Entendo, ${client.name.split(" ")[0]}. Pra facilitar, posso dividir em ate ${rules.maxInstallments}x sem juros. Consegue assim?`;
      reasoning.push({ icon: "shield-check", text: `Regra aplicada: parcelamento ate ${rules.maxInstallments}x.` });
      reasoning.push({ icon: "target", text: "Mantem o cliente e recupera o valor ao longo do tempo." });
    }
  } else if (achouCaro && client.debt >= rules.minAmountForDiscount) {
    offer = {
      type: "desconto",
      discountPercent: rules.maxDiscountPercent,
      description: `Desconto de ${rules.maxDiscountPercent}% para pagamento a vista`,
    };
    const comDesc = (client.debt * (1 - rules.maxDiscountPercent / 100)).toFixed(2);
    reply = `Posso te ajudar! Pagando a vista hoje, libero ${rules.maxDiscountPercent}% de desconto — fica R$ ${comDesc}. Quer que eu gere o Pix?`;
    reasoning.push({ icon: "shield-check", text: `Desconto liberado: ${rules.maxDiscountPercent}% (divida acima de R$ ${rules.minAmountForDiscount}).` });
    reasoning.push({ icon: "target", text: "Desconto a vista acelera a recuperacao do caixa." });
  } else if (achouCaro && client.debt < rules.minAmountForDiscount) {
    offer = {
      type: "parcelamento",
      installments: Math.min(2, rules.maxInstallments),
      description: "Parcelamento em vez de desconto",
    };
    reply = `Entendo, ${client.name.split(" ")[0]}. Desconto nesse valor nao consigo, mas posso parcelar em ${Math.min(2, rules.maxInstallments)}x sem juros pra aliviar. Topa?`;
    reasoning.push({ icon: "ban", text: `Desconto negado: valor abaixo do minimo de R$ ${rules.minAmountForDiscount}.` });
    reasoning.push({ icon: "target", text: "Oferece parcelamento como alternativa ao desconto." });
  } else if (querPagar) {
    offer = { type: "pix_imediato", description: "Pix gerado para pagamento imediato" };
    reply = `Perfeito, ${client.name.split(" ")[0]}! Aqui esta o Pix pra quitar agora. Assim que cair, te confirmo por aqui. 🙌`;
    reasoning.push({ icon: "shield-check", text: "Cliente quer pagar: apenas facilitar o acesso ao Pix." });
    reasoning.push({ icon: "target", text: "Sem necessidade de negociar — reduzir atrito ao maximo." });
  } else {
    offer = { type: "pix_imediato", description: "Lembrete amigavel com Pix" };
    reply = `Oi ${client.name.split(" ")[0]}! Passando pra ver se esta tudo bem. Sua pendencia de R$ ${client.debt.toFixed(2)} segue em aberto — posso te ajudar a regularizar hoje?`;
    reasoning.push({ icon: "shield-check", text: `Tom ${rules.tone} aplicado conforme configuracao da empresa.` });
    reasoning.push({ icon: "target", text: "Reabre o dialogo de forma leve para destravar o pagamento." });
  }

  return { reply, offer, reasoning, paymentProbability: prob, mode: "demo" };
}

// ---- Entrada principal ----
export async function negotiate(
  client: Client,
  rules: CompanyRules,
  incomingMessage: string
): Promise<NegotiationResult> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await negotiateWithClaude(client, rules, incomingMessage);
    } catch (err) {
      console.error("Falha na chamada ao Claude, usando modo demo:", err);
      return negotiateDemo(client, rules, incomingMessage);
    }
  }
  return negotiateDemo(client, rules, incomingMessage);
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
