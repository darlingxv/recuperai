import { NextRequest, NextResponse } from "next/server";
import { getClient, getRules, updateClient } from "@/lib/db";
import { negotiate } from "@/lib/claude";
import { sendWhatsApp } from "@/lib/whatsapp";
import { Message } from "@/lib/types";

// POST /api/negotiate
// Body: { clientId, message }
export async function POST(req: NextRequest) {
  try {
    const { clientId, message } = await req.json();
    if (!clientId || !message) {
      return NextResponse.json({ error: "clientId e message sao obrigatorios" }, { status: 400 });
    }

    const client = await getClient(clientId);
    if (!client) return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 });
    const rules = await getRules();

    // 1) registra a mensagem do cliente
    client.messages.push({
      id: "m" + Date.now(),
      sender: "cliente",
      text: message,
      at: new Date().toISOString(),
      channel: "whatsapp",
    });

    // 2) roda o motor de negociacao
    const result = await negotiate(client, rules, message);

    // 3) registra a resposta da IA
    client.messages.push({
      id: "m" + (Date.now() + 1),
      sender: "ai",
      text: result.reply,
      at: new Date().toISOString(),
      channel: "whatsapp",
    });

    // 4) atualiza o estado da negociacao
    client.lastOffer = result.offer;
    client.paymentProbability = result.paymentProbability;
    client.rejectionCount = result.rejectionCount;
    client.triedOffers = result.triedOffers;

    if (result.agreementReached) client.status = "acordo";
    else if (result.escalate) client.status = "escalado";
    else client.status = "negociando";

    // 5) envia a resposta ao cliente por WhatsApp (ou registra em log)
    const delivery = await sendWhatsApp(client.phone, result.reply);

    // 6) ESCALACAO: avisa o responsavel
    let escalation = null;
    if (result.escalate) {
      const resumo =
        `🔔 Cobranca escalada — ${rules.companyName}\n\n` +
        `Cliente: ${client.name}\n` +
        `Contrato: ${client.company}\n` +
        `Valor: R$ ${client.debt.toFixed(2)}\n` +
        `Atraso: ${client.daysOverdue} dias\n` +
        `Telefone: ${client.phone}\n\n` +
        `Motivo: ${result.escalationReason || "Cliente nao aceitou as opcoes oferecidas."}\n\n` +
        `A IA tentou negociar mas precisa de voce para conduzir este caso.`;

      const sysMsg: Message = {
        id: "m" + (Date.now() + 2),
        sender: "sistema",
        text: `Negociacao encaminhada para ${rules.responsibleName}.`,
        at: new Date().toISOString(),
        channel: "sistema",
      };
      client.messages.push(sysMsg);

      if (rules.responsiblePhone) {
        escalation = await sendWhatsApp(rules.responsiblePhone, resumo);
      } else {
        escalation = { sent: false, mode: "log" as const, detail: "Sem telefone do responsavel configurado (Regras)." };
        console.log("[Escalacao:log]", resumo);
      }
    }

    await updateClient(client);
    return NextResponse.json({ result, delivery, escalation, client });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao processar negociacao" }, { status: 500 });
  }
}
