import { NextRequest, NextResponse } from "next/server";
import { handleIncomingMessage } from "@/lib/incoming";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    hint: "Webhook Evolution do Recuper.ai ativo. Configure esta URL na Evolution (evento MESSAGES_UPSERT, webhook_by_events DESLIGADO).",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractText(message: any): string {
  if (!message) return "";
  if (typeof message.conversation === "string") return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  if (message.imageMessage?.caption) return message.imageMessage.caption;
  if (message.ephemeralMessage?.message) return extractText(message.ephemeralMessage.message);
  return "";
}

export async function POST(req: NextRequest) {
  try {
    const expected = process.env.WEBHOOK_TOKEN;
    if (expected && req.nextUrl.searchParams.get("token") !== expected) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await req.json().catch(() => ({}));

    const event = String(body?.event || "").toLowerCase().replace(/_/g, ".");
    console.log(`[Webhook Evolution] recebido | evento=${event || "?"}`);

    if (event && event !== "messages.upsert") {
      return NextResponse.json({ ok: true, ignored: `evento ${event}` });
    }

    const data = body?.data;
    if (!data) return NextResponse.json({ ok: true, ignored: "sem data" });
    if (data?.key?.fromMe === true) return NextResponse.json({ ok: true, ignored: "fromMe" });

    const remoteJid: string = data?.key?.remoteJid || "";
    if (remoteJid.includes("@g.us")) return NextResponse.json({ ok: true, ignored: "grupo" });

    const phone = remoteJid.split("@")[0];
    const text = extractText(data?.message);
    const name = data?.pushName || "Cliente WhatsApp";
    console.log(`[Webhook Evolution] de ${phone} (${name}): "${text}"`);

    const result = await handleIncomingMessage(phone, text, name);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Erro no webhook Evolution:", err);
    return NextResponse.json({ ok: false, error: String(err) });
  }
}
