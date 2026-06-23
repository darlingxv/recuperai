import { NextRequest, NextResponse } from "next/server";
import { getClient, getRules, updateClient } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";
import { firstReminderMessage } from "@/lib/claude";
import { createPixCharge } from "@/lib/pix";
import { Message } from "@/lib/types";

// POST /api/send-message
// Body: { clientId, text?, withPix? }
// Envia uma mensagem real pelo WhatsApp. Se "text" nao vier, usa o
// primeiro lembrete de cobranca (template). Registra na conversa.
export async function POST(req: NextRequest) {
  try {
    const { clientId, text, withPix } = await req.json();
    if (!clientId) return NextResponse.json({ error: "clientId obrigatorio" }, { status: 400 });

    const client = await getClient(clientId);
    if (!client) return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 });
    const rules = await getRules();

    let message = text && String(text).trim() ? String(text) : firstReminderMessage(client, rules);

    let pix = null;
    if (withPix) {
      pix = await createPixCharge(client.debt, `${rules.companyName} - ${client.company}`);
      message += `\n\nPix copia e cola:\n${pix.pixCopyPaste}`;
    }

    const delivery = await sendWhatsApp(client.phone, message);

    const msg: Message = {
      id: "m" + Date.now(),
      sender: "ai",
      text: message,
      at: new Date().toISOString(),
      channel: "whatsapp",
    };
    client.messages.push(msg);
    if (client.status === "em_aberto") client.status = "negociando";
    await updateClient(client);

    return NextResponse.json({ delivery, pix, client });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 });
  }
}
