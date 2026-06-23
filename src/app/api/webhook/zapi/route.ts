import { NextRequest, NextResponse } from "next/server";
import { getClientByPhone, getRules, updateClient, addClient } from "@/lib/db";
import { negotiate } from "@/lib/claude";
import { sendWhatsApp } from "@/lib/whatsapp";
import { prettyPhoneBR } from "@/lib/phone";
import { Client, Message } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET: so para testar no navegador e para a Z-API validar a URL
export async function GET() {
  return NextResponse.json({
    ok: true,
    hint: "Webhook do Recuper.ai ativo. Cole esta URL na Z-API em 'Ao receber mensagem'.",
  });
}

// Extrai o texto da mensagem em qualquer formato que a Z-API mandar
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pickText(body: any): string {
  const candidates = [
    body?.text?.message,
    typeof body?.text === "string" ? body.text : undefined,
    body?.message?.text,
    typeof body?.message === "string" ? body.message : undefined,
    body?.body,
  ];
  for (const c of candidates) if (typeof c === "string" && c.trim()) return c.trim();
  return "";
}

// POST: a Z-API chama aqui quando chega mensagem do cliente
export async function POST(req: NextRequest) {
  try {
    // seguranca opcional: se WEBHOOK_TOKEN existir, exige ?token=... na URL
    const expected = process.env.WEBHOOK_TOKEN;
    if (expected && req.nextUrl.searchParams.get("token") !== expected) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await req.json().catch(() => ({}));

    // ignora o que nao for mensagem de texto recebida de uma pessoa
    if (body?.fromMe === true) return NextResponse.json({ ok: true, ignored: "fromMe" });
    if (body?.isGroup === true) return NextResponse.json({ ok: true, ignored: "grupo" });

    const phone = String(body?.phone || body?.participantPhone || "");
    const text = pickText(body);
    const name = body?.senderName || body?.chatName || "Cliente WhatsApp";

    if (!phone || !text) return NextResponse.json({ ok: true, ignored: "sem texto" });

    const rules = await getRules();

    // acha o cliente pelo telefone; se nao existir, cria (lead novo via WhatsApp)
    let client = await getClientByPhone(phone);
    let isNew = false;
    if (!client) {
      isNew = true;
      const novo: Client = {
        id: "wa_" + Date.now(),
        name,
        company: "Contato via WhatsApp",
        phone: prettyPhoneBR(phone),
        debt: 0,
        dueDate: new Date().toISOString(),
        daysOverdue: 0,
        status: "negociando",
        risk: "medio",
        paymentProbability: 50,
        history: [],
        messages: [],
        lastOffer: null,
        rejectionCount: 0,
        triedOffers: [],
      };
      await addClient(novo);
      client = novo;
    }

    // 1) registra a mensagem que o cliente enviou
    const inbound: Message = {
      id: "m" + Date.now(),
      sender: "cliente",
      text,
      at: new Date().toISOString(),
      channel: "whatsapp",
    };
    client.messages.push(inbound);

    // 2) decide a resposta
    let replyText: string;
    if (isNew || client.debt <= 0) {
      // numero desconhecido ou sem divida cadastrada -> apresenta-se
      replyText = `Oi! Aqui e da ${rules.companyName}. Recebi sua mensagem e ja estou verificando seu cadastro. Posso te ajudar com pagamentos e negociacoes. 😊`;
    } else {
      const result = await negotiate(client, rules, text);
      replyText = result.reply;
      client.lastOffer = result.offer;
      client.paymentProbability = result.paymentProbability;
      client.rejectionCount = result.rejectionCount;
      client.triedOffers = result.triedOffers;
      client.status = result.agreementReached ? "acordo" : result.escalate ? "escalado" : "negociando";

      // escalacao: avisa o responsavel
      if (result.escalate) {
        client.messages.push({
          id: "m" + (Date.now() + 2),
          sender: "sistema",
          text: `Negociacao encaminhada para ${rules.responsibleName}.`,
          at: new Date().toISOString(),
          channel: "sistema",
        });
        if (rules.responsiblePhone) {
          const resumo =
            `🔔 Cobranca escalada — ${rules.companyName}\n\n` +
            `Cliente: ${client.name}\nValor: R$ ${client.debt.toFixed(2)}\n` +
            `Telefone: ${client.phone}\n\nMotivo: ${result.escalationReason || "Cliente nao aceitou as opcoes."}`;
          await sendWhatsApp(rules.responsiblePhone, resumo);
        }
      }
    }

    // 3) registra a resposta da IA e envia de volta pro cliente
    client.messages.push({
      id: "m" + (Date.now() + 1),
      sender: "ai",
      text: replyText,
      at: new Date().toISOString(),
      channel: "whatsapp",
    });
    await updateClient(client);

    const delivery = await sendWhatsApp(phone, replyText);
    return NextResponse.json({ ok: true, replied: true, delivery });
  } catch (err) {
    console.error("Erro no webhook:", err);
    // responde 200 mesmo com erro, pra Z-API nao ficar reenviando
    return NextResponse.json({ ok: false, error: String(err) });
  }
}
