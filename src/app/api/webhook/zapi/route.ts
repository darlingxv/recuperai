import { NextRequest, NextResponse } from "next/server";
import { handleIncomingMessage } from "@/lib/incoming";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    hint: "Webhook Z-API do Recuper.ai ativo. Cole esta URL na Z-API em 'Ao receber'.",
  });
}

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

export async function POST(req: NextRequest) {
  try {
    const expected = process.env.WEBHOOK_TOKEN;
    if (expected && req.nextUrl.searchParams.get("token") !== expected) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await req.json().catch(() => ({}));

    if (body?.fromMe === true) return NextResponse.json({ ok: true, ignored: "fromMe" });
    if (body?.isGroup === true) return NextResponse.json({ ok: true, ignored: "grupo" });

    const phone = String(body?.phone || body?.participantPhone || "");
    const text = pickText(body);
    const name = body?.senderName || body?.chatName || "Cliente WhatsApp";

    const result = await handleIncomingMessage(phone, text, name);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Erro no webhook Z-API:", err);
    return NextResponse.json({ ok: false, error: String(err) });
  }
}
