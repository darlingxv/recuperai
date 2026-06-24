// ============================================================
// Integracao com WhatsApp - multi-provedor
//
// Escolhe automaticamente conforme o que estiver configurado:
//   1) Evolution API  -> EVOLUTION_API_URL + EVOLUTION_API_KEY + EVOLUTION_INSTANCE
//   2) Z-API          -> ZAPI_INSTANCE_ID + ZAPI_TOKEN (+ ZAPI_CLIENT_TOKEN)
//   nenhum            -> modo log (so registra no console)
//
// A funcao sendWhatsApp() abstrai o provedor para o resto do app.
// ============================================================

import { normalizePhoneBR } from "./phone";

export type WhatsAppProvider = "evolution" | "zapi" | "none";

export interface SendResult {
  sent: boolean;
  mode: "evolution" | "zapi" | "log";
  detail: string;
}

export function whatsappProvider(): WhatsAppProvider {
  if (process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY && process.env.EVOLUTION_INSTANCE) {
    return "evolution";
  }
  if (process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN) return "zapi";
  return "none";
}

export async function sendWhatsApp(phone: string, message: string): Promise<SendResult> {
  const number = normalizePhoneBR(phone);
  const provider = whatsappProvider();
  if (provider === "evolution") return sendViaEvolution(number, message);
  if (provider === "zapi") return sendViaZapi(number, message);
  console.log(`[WhatsApp:log] -> ${number}: ${message}`);
  return { sent: false, mode: "log", detail: "Nenhum provedor configurado (modo log)" };
}

async function sendViaEvolution(number: string, message: string): Promise<SendResult> {
  const base = (process.env.EVOLUTION_API_URL as string).replace(/\/+$/, "");
  const instance = process.env.EVOLUTION_INSTANCE as string;
  const apikey = process.env.EVOLUTION_API_KEY as string;
  const url = `${base}/message/sendText/${instance}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey },
      body: JSON.stringify({ number, text: message }),
    });
    if (!res.ok) {
      const txt = await res.text();
      return { sent: false, mode: "evolution", detail: `Evolution erro ${res.status}: ${txt.slice(0, 300)}` };
    }
    return { sent: true, mode: "evolution", detail: "Enviado via Evolution API" };
  } catch (err) {
    return { sent: false, mode: "evolution", detail: `Falha de rede ao chamar a Evolution: ${String(err)}` };
  }
}

async function sendViaZapi(number: string, message: string): Promise<SendResult> {
  const instance = process.env.ZAPI_INSTANCE_ID as string;
  const token = process.env.ZAPI_TOKEN as string;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;
  const url = `https://api.z-api.io/instances/${instance}/token/${token}/send-text`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(clientToken ? { "Client-Token": clientToken } : {}),
      },
      body: JSON.stringify({ phone: number, message }),
    });
    if (!res.ok) {
      const txt = await res.text();
      return { sent: false, mode: "zapi", detail: `Z-API erro ${res.status}: ${txt.slice(0, 300)}` };
    }
    return { sent: true, mode: "zapi", detail: "Enviado via Z-API" };
  } catch (err) {
    return { sent: false, mode: "zapi", detail: `Falha de rede: ${String(err)}` };
  }
}
