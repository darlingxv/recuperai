import { NextRequest, NextResponse } from "next/server";
import { sendWhatsApp } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

// POST /api/whatsapp-test-send  { phone }
// Envia uma mensagem fixa de teste e devolve o resultado CRU da Z-API.
export async function POST(req: NextRequest) {
  const { phone } = await req.json().catch(() => ({ phone: "" }));
  if (!phone || !String(phone).trim()) {
    return NextResponse.json({ sent: false, detail: "Informe um numero." }, { status: 400 });
  }
  const result = await sendWhatsApp(
    String(phone),
    "Mensagem de teste do Recuper.ai ✅ Se voce recebeu isto, o envio esta funcionando!"
  );
  return NextResponse.json(result);
}
