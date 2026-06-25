import { NextResponse } from "next/server";
import { whatsappProvider } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET() {
  const provider = whatsappProvider();

  if (provider === "none") {
    return NextResponse.json({
      provider,
      configured: false,
      message: "Nenhum provedor configurado.",
      detected: {
        EVOLUTION_API_URL: !!process.env.EVOLUTION_API_URL,
        EVOLUTION_API_KEY: !!process.env.EVOLUTION_API_KEY,
        EVOLUTION_INSTANCE: !!process.env.EVOLUTION_INSTANCE,
        ZAPI_INSTANCE_ID: !!process.env.ZAPI_INSTANCE_ID,
        ZAPI_TOKEN: !!process.env.ZAPI_TOKEN,
      },
    });
  }

  try {
    if (provider === "evolution") {
      const base = (process.env.EVOLUTION_API_URL as string).replace(/\/+$/, "");
      const instance = process.env.EVOLUTION_INSTANCE as string;
      const apikey = process.env.EVOLUTION_API_KEY as string;
      const res = await fetch(`${base}/instance/connectionState/${instance}`, { headers: { apikey } });
      const text = await res.text();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let raw: any = text;
      try { raw = JSON.parse(text); } catch {}
      const state = raw?.instance?.state || raw?.state;
      return NextResponse.json({ provider, configured: true, httpStatus: res.status, connected: state === "open", state, url: base, instance, raw });
    }

    // zapi
    const instance = process.env.ZAPI_INSTANCE_ID as string;
    const token = process.env.ZAPI_TOKEN as string;
    const clientToken = process.env.ZAPI_CLIENT_TOKEN;
    const res = await fetch(`https://api.z-api.io/instances/${instance}/token/${token}/status`, {
      headers: { ...(clientToken ? { "Client-Token": clientToken } : {}) },
    });
    const text = await res.text();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let raw: any = text;
    try { raw = JSON.parse(text); } catch {}
    const connected = raw?.connected === true || raw?.smartphoneConnected === true;
    return NextResponse.json({ provider, configured: true, httpStatus: res.status, connected, raw });
  } catch (err) {
    return NextResponse.json({ provider, configured: true, error: String(err) });
  }
}
