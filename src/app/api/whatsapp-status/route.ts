import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/whatsapp-status -> pergunta para a Z-API se a instancia esta conectada
export async function GET() {
  const instance = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;

  if (!instance || !token) {
    return NextResponse.json({
      configured: false,
      message: "Credenciais Z-API ausentes. Configure ZAPI_INSTANCE_ID e ZAPI_TOKEN.",
    });
  }

  const url = `https://api.z-api.io/instances/${instance}/token/${token}/status`;
  try {
    const res = await fetch(url, {
      headers: { ...(clientToken ? { "Client-Token": clientToken } : {}) },
    });
    const text = await res.text();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return NextResponse.json({ configured: true, httpStatus: res.status, raw: data });
  } catch (err) {
    return NextResponse.json({ configured: true, error: String(err) });
  }
}
