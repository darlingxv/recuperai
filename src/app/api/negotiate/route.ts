import { NextRequest, NextResponse } from "next/server";
import { getClient, getRules, updateClient } from "@/lib/db";
import { negotiate } from "@/lib/claude";
import { sendWhatsApp } from "@/lib/whatsapp";
import { Message } from "@/lib/types";

// POST /api/negotiate
// Body: { clientId: string, message: string }
// Registra a mensagem do cliente, roda a IA, registra e "envia" a resposta.
export async function POST(req: NextRequest) {
  try {
    const { clientId, message } = await req.json();
    if (!clientId || !message) {
      return NextResponse.json({ error: "clientId e message sao obrigatorios" }, { status: 400 });
    }

    const client = await getClient(clientId);
    if (!client) {
      return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 });
    }
    const rules = await getRules();

    // 1) registra a mensagem recebida do cliente
    const incoming: Message = {
      id: "m" + Date.now(),
      sender: "cliente",
      text: message,
      at: new Date().toISOString(),
      channel: "whatsapp",
    };
    client.messages.push(incoming);

    // 2) roda o motor de negociacao
    const result = await negotiate(client, rules, message);

    // 3) registra a resposta da IA
    const aiMessage: Message = {
      id: "m" + (Date.now() + 1),
      sender: "ai",
      text: result.reply,
      at: new Date().toISOString(),
      channel: "whatsapp",
    };
    client.messages.push(aiMessage);

    // 4) atualiza estado do cliente
    client.lastOffer = result.offer;
    client.paymentProbability = result.paymentProbability;
    if (result.offer.type !== "nenhuma" && result.offer.type !== "pix_imediato") {
      client.status = "negociando";
    }
    await updateClient(client);

    // 5) envia pelo WhatsApp (ou apenas registra, se sem credenciais)
    const delivery = await sendWhatsApp(client.phone, result.reply);

    return NextResponse.json({ result, delivery, client });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao processar negociacao" }, { status: 500 });
  }
}
