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
// (sempre dentro das regras), o raciocinio, a probabilidade de
// pagamento, e o controle de fluxo (aceitou? recusou tudo? escalar?).
//
// - Com ANTHROPIC_API_KEY definida -> usa o Claude de verdade.
// - Sem a chave -> "modo demo": negociacao simulada por regras,
//   agora com deteccao de recusa, escalacao e fallback inteligente.
// ============================================================

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

// Remove acentos e baixa caixa para casar palavras com robustez
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function has(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

export function estimateProbability(client: Client): number {
  const h = client.history;
  if (h.length === 0) {
    return Math.max(10, 90 - client.daysOverdue * 2);
  }
  const avgLate = h.reduce((s, p) => s + Math.max(0, p.daysLate), 0) / h.length;
  const neverPaid = h.filter((p) => p.paidDate === null).length;
  let score = 95;
  score -= avgLate * 1.5;
  score -= client.daysOverdue * 1.2;
  score -= neverPaid * 25;
  if (client.debt > 3000) score -= 8;
  return Math.max(5, Math.min(97, Math.round(score)));
}

export function predictAction(client: Client): string | null {
  const prob = estimateProbability(client);
  if (client.daysOverdue > 0) return null;
  if (prob < 70) {
    return `${client.name} tem alto risco de atrasar (${100 - prob}% de chance). Enviar lembrete antecipado com Pix programado.`;
  }
  return null;
}

// Mensagem inicial de cobranca (primeiro contato), por template
export function firstReminderMessage(client: Client, rules: CompanyRules): string {
  const nome = client.name.split(" ")[0];
  if (client.daysOverdue <= 0) {
    return `Oi ${nome}! Aqui e da ${rules.companyName}. Passando para lembrar que voce tem um valor de R$ ${client.debt.toFixed(2)} a vencer. Se quiser, ja te mando o Pix para deixar pago. 😊`;
  }
  return `Oi ${nome}! Aqui e da ${rules.companyName}. Notamos que ficou pendente um valor de R$ ${client.debt.toFixed(2)} (${client.daysOverdue} dias). Esta tudo bem? Posso te ajudar a regularizar hoje. 😊`;
}

function firstName(client: Client): string {
  return client.name.split(" ")[0];
}

// Define a proxima oferta ainda nao tentada, escalando a concessao
function nextOffer(client: Client, rules: CompanyRules): NegotiationOffer {
  const tried = client.triedOffers;
  const canDiscount = client.debt >= rules.minAmountForDiscount && rules.maxDiscountPercent > 0;

  // 1) parcelamento
  if (!tried.includes("parcelamento")) {
    const n = Math.min(2, rules.maxInstallments);
    return { type: "parcelamento", installments: n, description: `Parcelado em ${n}x sem juros` };
  }
  // 2) novo vencimento
  if (!tried.includes("novo_vencimento") && rules.allowDueDateChange) {
    return { type: "novo_vencimento", newDueDate: "proxima sexta-feira", description: "Vencimento adiado para sexta-feira" };
  }
  // 3) desconto (se elegivel)
  if (!tried.includes("desconto") && canDiscount) {
    return { type: "desconto", discountPercent: rules.maxDiscountPercent, description: `Desconto de ${rules.maxDiscountPercent}% a vista` };
  }
  // 4) mais parcelas (limite)
  if (!tried.includes("parcelamento_max") && rules.maxInstallments > 2) {
    return { type: "parcelamento", installments: rules.maxInstallments, description: `Parcelado em ${rules.maxInstallments}x sem juros` };
  }
  // esgotou
  return { type: "nenhuma", description: "Sem mais opcoes dentro das regras" };
}

function offerKey(o: NegotiationOffer): string {
  if (o.type === "parcelamento" && o.installments && o.installments >= 3) return "parcelamento_max";
  return o.type;
}

function offerSentence(o: NegotiationOffer, client: Client, rules: CompanyRules): string {
  switch (o.type) {
    case "parcelamento":
      return `posso dividir em ${o.installments}x sem juros`;
    case "novo_vencimento":
      return `posso adiar o vencimento para ${o.newDueDate}`;
    case "desconto": {
      const v = (client.debt * (1 - (o.discountPercent || 0) / 100)).toFixed(2);
      return `pagando a vista hoje, libero ${o.discountPercent}% de desconto (fica R$ ${v})`;
    }
    case "pix_imediato":
      return `te mando o Pix agora mesmo`;
    default:
      return "";
  }
}

// ---- Modo demo: negociacao simulada por regras, com estado ----
function negotiateDemo(
  client: Client,
  rules: CompanyRules,
  incomingMessage: string
): NegotiationResult {
  const msg = norm(incomingMessage);
  const nome = firstName(client);
  const prob = estimateProbability(client);
  const reasoning: ReasoningStep[] = [];
  let rejectionCount = client.rejectionCount;
  const triedOffers = [...client.triedOffers];

  const avgLate = Math.round(
    client.history.reduce((s, p) => s + Math.max(0, p.daysLate), 0) /
      Math.max(1, client.history.length)
  );

  // --- deteccao de intencao (negacao tem prioridade) ---
  const hasOffer = !!(client.lastOffer && client.lastOffer.type !== "nenhuma");
  // qualquer marca de negacao na frase
  const negation = has(msg, ["nao", "nunca", "nem ", "jamais", "nada", "de jeito nenhum"]);

  // pedidos especificos (checados antes de tratar como recusa pura)
  const noMoney = has(msg, ["sem dinheiro", "sem grana", "apertou", "apertado", "to duro", "desempregad", "sem condic", "to liso", "to quebrad", "nao tenho dinheiro", "nao tenho grana", "to sem", "sem caixa"]);
  const wantDiscount = has(msg, ["caro", "desconto", "abatimento", "muito alto", "mais barato", "abate", "tira um pouco"]);
  const wantPay = has(msg, ["pagar", "pix", "boleto", "como faco", "como pago", "link", "segunda via", "quitar", "manda o", "manda ai", "qr code", "codigo"]);
  const wantDate = has(msg, ["vencimento", "outra data", "mudar a data", "adiar", "semana que vem", "mes que vem", "depois do dia", "muda pro dia", "so consigo dia", "mudar pra"]);

  // recusa dura: ameaca ou recusa definitiva de pagar
  const isHardNo = has(msg, ["nunca vou pagar", "nunca pago", "nao pago", "nao vou pagar", "processa", "processo", "advogad", "procon", "me processa"]);

  // ACEITE: so vale se NAO houver negacao na frase (evita "nao aceito" virar aceite)
  const isAccept = !negation && has(msg, ["aceito", "pode ser", "fechado", "topo", "concordo", "ta bom", "tudo bem", "ta otimo", "ta certo", "beleza", "vamos", "perfeito", "isso mesmo", "combinado", "pode dividir", "pode parcelar", "quero sim", "ok", "fechou", "aceitar", "ta certo"]);

  // RECUSA: frases explicitas OU negacao "pura" (sem pedir desconto/prazo/pagar e sem falar de aperto)
  const explicitReject = has(msg, ["nao quero", "nao posso", "nao aceito", "nao concordo", "nao consigo pagar", "nada disso", "esquece", "deixa pra la", "nem assim", "impossivel", "de jeito nenhum", "nao da", "nao rola", "cancela", "nao serve", "nao adianta"]);
  const isReject =
    explicitReject ||
    (negation && hasOffer && !isAccept && !noMoney && !wantPay && !wantDiscount && !wantDate && !isHardNo);

  let offer: NegotiationOffer = client.lastOffer || { type: "nenhuma", description: "" };
  let reply = "";
  let escalate = false;
  let escalationReason: string | undefined;
  let agreementReached = false;

  // 1) Cliente ACEITOU uma oferta existente (negacao ja foi descartada em isAccept)
  if (isAccept && hasOffer) {
    agreementReached = true;
    rejectionCount = 0;
    offer = client.lastOffer as NegotiationOffer;
    reasoning.push({ icon: "shield-check", text: `Cliente aceitou: ${offer.description}.` });
    reasoning.push({ icon: "target", text: "Fechar acordo e enviar o Pix imediatamente." });
    reply = `Combinado, ${nome}! ${cap(offerSentence(offer, client, rules))}. Ja te mando o Pix da primeira parte. Assim que cair, te confirmo por aqui. 🙌`;
    return done(reply, offer, reasoning, prob, escalate, escalationReason, agreementReached, rejectionCount, triedOffers);
  }

  // 2) Recusa dura (ameaca / "nunca pago") => escala na hora
  if (isHardNo) {
    escalate = true;
    escalationReason = `Cliente recusou-se firmemente a pagar ("${incomingMessage.slice(0, 60)}").`;
    reasoning.push({ icon: "alert", text: "Recusa explicita de pagamento detectada." });
    reasoning.push({ icon: "user", text: `Acionar ${rules.responsibleName} para conduzir o caso.` });
    reply = `Entendo, ${nome}. Nesse caso vou encaminhar para ${rules.responsibleName} da ${rules.companyName} dar sequencia diretamente com voce. Obrigado pela sinceridade.`;
    return done(reply, { type: "nenhuma", description: "Escalado" }, reasoning, prob, escalate, escalationReason, agreementReached, rejectionCount, triedOffers);
  }

  // 3) Recusa de uma oferta (isReject ja considerou os outros pedidos)
  if (isReject) {
    rejectionCount += 1;
    reasoning.push({ icon: "history", text: `Cliente recusou a oferta (recusa ${rejectionCount} de ${rules.maxRejectionsBeforeEscalation}).` });

    if (rejectionCount >= rules.maxRejectionsBeforeEscalation) {
      escalate = true;
      escalationReason = `Cliente recusou ${rejectionCount} ofertas seguidas (parcelamento, vencimento e/ou desconto).`;
      reasoning.push({ icon: "user", text: `Limite de tentativas atingido: acionar ${rules.responsibleName}.` });
      reply = `Sem problemas, ${nome}. Como nao consegui encontrar uma opcao que funcione pra voce, vou pedir para ${rules.responsibleName} entrar em contato e resolver isso junto com voce, tudo bem?`;
      return done(reply, { type: "nenhuma", description: "Escalado" }, reasoning, prob, escalate, escalationReason, agreementReached, rejectionCount, triedOffers);
    }

    // ainda ha tentativas: oferece alternativa nova
    const alt = nextOffer(client, rules);
    if (alt.type === "nenhuma") {
      escalate = true;
      escalationReason = "Esgotaram-se as opcoes dentro das regras da empresa.";
      reasoning.push({ icon: "user", text: `Sem mais opcoes nas regras: acionar ${rules.responsibleName}.` });
      reply = `Entendo, ${nome}. Vou pedir para ${rules.responsibleName} falar diretamente com voce para encontrarmos uma saida, tudo bem?`;
      return done(reply, alt, reasoning, prob, escalate, escalationReason, agreementReached, rejectionCount, triedOffers);
    }
    triedOffers.push(offerKey(alt));
    offer = alt;
    reasoning.push({ icon: "shield-check", text: `Nova alternativa dentro das regras: ${alt.description}.` });
    reasoning.push({ icon: "target", text: "Insistir com flexibilidade, sem pressionar." });
    reply = `Tudo bem, ${nome}. E se a gente fizer diferente: ${offerSentence(alt, client, rules)}? Qualquer uma dessas eu consigo agora.`;
    return done(reply, offer, reasoning, prob, escalate, escalationReason, agreementReached, rejectionCount, triedOffers);
  }

  // 4) Cliente sem dinheiro
  if (noMoney) {
    rejectionCount = 0;
    const o = !triedOffers.includes("parcelamento")
      ? { type: "parcelamento" as const, installments: Math.min(2, rules.maxInstallments), description: `Parcelado em ${Math.min(2, rules.maxInstallments)}x sem juros` }
      : nextOffer(client, rules);
    triedOffers.push(offerKey(o));
    offer = o;
    reasoning.push({ icon: "history", text: `${nome} costuma atrasar ~${avgLate} dias; sinalizou aperto agora.` });
    reasoning.push({ icon: "shield-check", text: `Regra aplicada: ${o.description}.` });
    reasoning.push({ icon: "target", text: "Cliente sem caixa: facilitar, nunca pressionar." });
    reply = `Sem problemas, ${nome}! Pra aliviar, ${offerSentence(o, client, rules)}${rules.allowDueDateChange ? " ou mudo o vencimento para sexta" : ""}. Qual fica melhor pra voce?`;
    return done(reply, offer, reasoning, prob, escalate, escalationReason, agreementReached, rejectionCount, triedOffers);
  }

  // 5) Quer desconto
  if (wantDiscount) {
    rejectionCount = 0;
    if (client.debt >= rules.minAmountForDiscount && rules.maxDiscountPercent > 0) {
      offer = { type: "desconto", discountPercent: rules.maxDiscountPercent, description: `Desconto de ${rules.maxDiscountPercent}% a vista` };
      triedOffers.push("desconto");
      reasoning.push({ icon: "shield-check", text: `Desconto liberado: ${rules.maxDiscountPercent}% (divida acima de R$ ${rules.minAmountForDiscount}).` });
      reasoning.push({ icon: "target", text: "Desconto a vista acelera a entrada de caixa." });
      reply = `Posso te ajudar, ${nome}! ${cap(offerSentence(offer, client, rules))}. Quer que eu gere o Pix?`;
    } else {
      const o = !triedOffers.includes("parcelamento")
        ? { type: "parcelamento" as const, installments: Math.min(2, rules.maxInstallments), description: "Parcelamento no lugar de desconto" }
        : nextOffer(client, rules);
      triedOffers.push(offerKey(o));
      offer = o;
      reasoning.push({ icon: "ban", text: `Desconto negado: valor abaixo do minimo de R$ ${rules.minAmountForDiscount}.` });
      reasoning.push({ icon: "target", text: "Oferece parcelamento como alternativa." });
      reply = `Entendo, ${nome}. Desconto nesse valor eu nao consigo, mas ${offerSentence(o, client, rules)} pra aliviar. Topa?`;
    }
    return done(reply, offer, reasoning, prob, escalate, escalationReason, agreementReached, rejectionCount, triedOffers);
  }

  // 6) Quer mudar vencimento
  if (wantDate) {
    rejectionCount = 0;
    if (rules.allowDueDateChange) {
      offer = { type: "novo_vencimento", newDueDate: "a data que ficar melhor pra voce", description: "Mudanca de vencimento" };
      triedOffers.push("novo_vencimento");
      reasoning.push({ icon: "shield-check", text: "Mudanca de vencimento permitida pelas regras." });
      reasoning.push({ icon: "target", text: "Ajustar a data destrava o pagamento." });
      reply = `Claro, ${nome}! Me diz qual dia fica bom que eu ja reprogramo o vencimento e te mando o Pix com a nova data.`;
    } else {
      const o = nextOffer(client, rules);
      triedOffers.push(offerKey(o));
      offer = o;
      reasoning.push({ icon: "ban", text: "Mudanca de vencimento nao permitida pelas regras." });
      reply = `Mudar a data eu nao consigo agora, ${nome}, mas ${offerSentence(o, client, rules)}. Ajuda?`;
    }
    return done(reply, offer, reasoning, prob, escalate, escalationReason, agreementReached, rejectionCount, triedOffers);
  }

  // 7) Quer pagar
  if (wantPay) {
    rejectionCount = 0;
    offer = { type: "pix_imediato", description: "Pix gerado para pagamento imediato" };
    reasoning.push({ icon: "shield-check", text: "Cliente quer pagar: apenas facilitar o Pix." });
    reasoning.push({ icon: "target", text: "Reduzir o atrito ao maximo." });
    reply = `Perfeito, ${nome}! Aqui esta o Pix pra quitar agora. Assim que cair, te confirmo por aqui. 🙌`;
    return done(reply, offer, reasoning, prob, escalate, escalationReason, agreementReached, rejectionCount, triedOffers);
  }

  // 8) FALLBACK INTELIGENTE (corrige o bug do "so cumprimenta")
  // Qualquer outra coisa: NAO repete saudacao. Reconhece e avanca com uma proposta concreta.
  rejectionCount = 0;
  const o = nextOffer(client, rules);
  if (o.type === "nenhuma") {
    offer = { type: "pix_imediato", description: "Pix para pagamento" };
    reasoning.push({ icon: "history", text: "Mensagem fora dos padroes; ja tentamos as opcoes disponiveis." });
    reasoning.push({ icon: "target", text: "Mantem o pagamento facil via Pix." });
    reply = `Entendi, ${nome}. Pra facilitar, posso te mandar o Pix do valor de R$ ${client.debt.toFixed(2)} agora. Se preferir conversar sobre prazo, e so me dizer o que ajuda.`;
  } else {
    triedOffers.push(offerKey(o));
    offer = o;
    reasoning.push({ icon: "history", text: "Mensagem fora dos padroes; interpretar como duvida e avancar." });
    reasoning.push({ icon: "shield-check", text: `Proposta dentro das regras: ${o.description}.` });
    reasoning.push({ icon: "target", text: "Avancar a negociacao em vez de repetir saudacao." });
    reply = `Entendi, ${nome}! Sobre o valor de R$ ${client.debt.toFixed(2)}, pra te ajudar ${offerSentence(o, client, rules)}. Pode ser? Se preferir pagar a vista, te mando o Pix na hora.`;
  }
  return done(reply, offer, reasoning, prob, escalate, escalationReason, agreementReached, rejectionCount, triedOffers);
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function done(
  reply: string,
  offer: NegotiationOffer,
  reasoning: ReasoningStep[],
  prob: number,
  escalate: boolean,
  escalationReason: string | undefined,
  agreementReached: boolean,
  rejectionCount: number,
  triedOffers: string[]
): NegotiationResult {
  return {
    reply,
    offer,
    reasoning,
    paymentProbability: prob,
    mode: "demo",
    escalate,
    escalationReason,
    agreementReached,
    rejectionCount,
    triedOffers,
  };
}

// ---- Modo Claude (real) ----
function buildSystemPrompt(client: Client, rules: CompanyRules): string {
  const toneMap = {
    amigavel: "amigavel, caloroso e empatico",
    neutro: "profissional, cordial e objetivo",
    firme: "respeitoso porem firme, sem ameacar",
  };
  return `Voce e um assistente de cobranca da empresa "${rules.companyName}", negociando por WhatsApp com um cliente que esta em atraso. Seu objetivo e recuperar o valor SEM perder o cliente.

CLIENTE:
- Nome: ${client.name}
- Contrato: ${client.company}
- Valor devido: R$ ${client.debt.toFixed(2)}
- Dias em atraso: ${client.daysOverdue}
- Recusas ja feitas nesta conversa: ${client.rejectionCount}
- Ofertas ja tentadas: ${client.triedOffers.join(", ") || "nenhuma"}

REGRAS DA EMPRESA (NUNCA ultrapasse):
- Parcelamento: ate ${rules.maxInstallments}x sem juros.
- Desconto: ate ${rules.maxDiscountPercent}%, SOMENTE para dividas acima de R$ ${rules.minAmountForDiscount.toFixed(2)}.
- Mudanca de vencimento: ${rules.allowDueDateChange ? "permitida" : "NAO permitida"}.
- Tom: ${toneMap[rules.tone]}.

ESCALACAO (importante):
- Se o cliente recusar as opcoes ${rules.maxRejectionsBeforeEscalation} vezes, OU se recusar pagar de forma definitiva (ex.: "nunca vou pagar", ameacar processo), pare de negociar e acione o responsavel "${rules.responsibleName}".
- Ao escalar, defina "escalate": true e diga ao cliente, com gentileza, que ${rules.responsibleName} entrara em contato. Nao escale cedo demais.

CODIGO DE DEFESA DO CONSUMIDOR:
- Nunca ameace, constranja ou humilhe. Seja sempre respeitoso, mesmo se o cliente for grosseiro. Ofereca sempre uma saida.

COMO RESPONDER:
- Mensagens curtas e naturais (estilo WhatsApp), no maximo 1 emoji.
- Se o cliente disser algo fora do roteiro (duvida, desabafo, pergunta), NUNCA apenas cumprimente de novo: reconheca o que ele disse e avance com uma proposta concreta.
- Proponha UMA opcao clara por vez (no maximo duas).
- Se o cliente aceitar uma oferta, defina "agreementReached": true e confirme o acordo enviando o Pix.

Responda APENAS com um JSON valido, sem markdown, neste formato:
{
  "reply": "mensagem ao cliente",
  "offer": {"type": "parcelamento|desconto|novo_vencimento|pix_imediato|nenhuma", "installments": numero|null, "discountPercent": numero|null, "newDueDate": "texto|null", "description": "resumo curto"},
  "reasoning": [{"icon": "history|shield-check|target|ban|user|alert", "text": "..."}],
  "paymentProbability": 0-100,
  "agreementReached": true|false,
  "escalate": true|false,
  "escalationReason": "texto ou null"
}`;
}

function normalizeOffer(
  offer: Partial<NegotiationOffer> | undefined,
  rules: CompanyRules,
  client: Client
): NegotiationOffer {
  if (!offer || !offer.type) return { type: "nenhuma", description: "Sem oferta" };
  const o: NegotiationOffer = { type: offer.type, description: offer.description || "" };
  if (offer.installments) o.installments = Math.min(offer.installments, rules.maxInstallments);
  if (offer.discountPercent) {
    o.discountPercent =
      client.debt >= rules.minAmountForDiscount
        ? Math.min(offer.discountPercent, rules.maxDiscountPercent)
        : 0;
  }
  if (offer.newDueDate && rules.allowDueDateChange) o.newDueDate = offer.newDueDate;
  return o;
}

// ============================================================
// PROVEDORES DE IA
// O sistema escolhe automaticamente conforme a chave configurada:
//   1) ANTHROPIC_API_KEY  -> Claude (melhor qualidade, pago barato)
//   2) GEMINI_API_KEY     -> Google Gemini (gratis)
//   3) GROQ_API_KEY       -> Groq / Llama (gratis, sem cartao)
//   nenhuma               -> modo demo (respostas por regras)
// ============================================================

type AIProvider = "anthropic" | "gemini" | "groq";

// Ordem de preferencia: Anthropic (melhor) > Groq (gratis, confiavel) > Gemini.
// Retorna TODAS as IAs configuradas, para tentar uma e cair na proxima se falhar.
function configuredProviders(): AIProvider[] {
  const list: AIProvider[] = [];
  if (process.env.ANTHROPIC_API_KEY) list.push("anthropic");
  if (process.env.GROQ_API_KEY) list.push("groq");
  if (process.env.GEMINI_API_KEY) list.push("gemini");
  return list;
}

export function aiIsConfigured(): boolean {
  return configuredProviders().length > 0;
}

type ConvoMsg = { role: "user" | "assistant"; content: string };

function buildConvo(client: Client, incomingMessage: string): ConvoMsg[] {
  const history: ConvoMsg[] = client.messages
    .filter((m) => m.sender !== "sistema")
    .map((m) => ({ role: m.sender === "ai" ? "assistant" : "user", content: m.text }));
  history.push({ role: "user", content: incomingMessage });
  return history;
}

// Cada chamada devolve o texto cru do modelo (que deve ser um JSON)
async function callAnthropic(system: string, convo: ConvoMsg[]): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await anthropic.messages.create({ model: MODEL, max_tokens: 1024, system, messages: convo });
  const block = response.content.find((b) => b.type === "text");
  return block && "text" in block ? block.text : "";
}

async function callGroq(system: string, convo: ConvoMsg[]): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: system }, ...convo],
      temperature: 0.6,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

async function callGemini(system: string, convo: ConvoMsg[]): Promise<string> {
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const contents = convo.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { responseMimeType: "application/json", temperature: 0.6 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

function parseAIResponse(
  raw: string,
  client: Client,
  rules: CompanyRules,
  mode: NegotiationResult["mode"]
): NegotiationResult {
  const cleaned = (raw || "").replace(/```json/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleaned);

  const offer = normalizeOffer(parsed.offer, rules, client);
  const agreementReached = !!parsed.agreementReached;
  const escalate = !!parsed.escalate;
  const triedOffers = [...client.triedOffers];
  if (offer.type !== "nenhuma" && !triedOffers.includes(offer.type)) triedOffers.push(offer.type);

  let rejectionCount = client.rejectionCount;
  if (escalate) rejectionCount = Math.max(rejectionCount, rules.maxRejectionsBeforeEscalation);
  else if (agreementReached) rejectionCount = 0;

  return {
    reply: parsed.reply,
    offer,
    reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning : [],
    paymentProbability: clamp(parsed.paymentProbability ?? estimateProbability(client)),
    mode,
    escalate,
    escalationReason: parsed.escalationReason || undefined,
    agreementReached,
    rejectionCount,
    triedOffers,
  };
}

async function negotiateWithAI(
  provider: AIProvider,
  client: Client,
  rules: CompanyRules,
  incomingMessage: string
): Promise<NegotiationResult> {
  const system = buildSystemPrompt(client, rules);
  const convo = buildConvo(client, incomingMessage);
  let raw = "";
  if (provider === "anthropic") raw = await callAnthropic(system, convo);
  else if (provider === "gemini") raw = await callGemini(system, convo);
  else raw = await callGroq(system, convo);
  const mode: NegotiationResult["mode"] = provider === "anthropic" ? "claude" : provider;
  return parseAIResponse(raw, client, rules, mode);
}

export async function negotiate(
  client: Client,
  rules: CompanyRules,
  incomingMessage: string
): Promise<NegotiationResult> {
  const providers = configuredProviders();
  for (const provider of providers) {
    try {
      return await negotiateWithAI(provider, client, rules, incomingMessage);
    } catch (err) {
      console.error(`Falha na IA (${provider}), tentando a proxima opcao...`, err);
      // tenta o proximo provedor; se acabarem, cai no modo demo
    }
  }
  return negotiateDemo(client, rules, incomingMessage);
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
