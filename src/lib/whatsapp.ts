// ============================================================
// Integracao com WhatsApp (Z-API)
//
// Sem as variaveis ZAPI_* no .env, esta funcao apenas registra a
// mensagem no console e segue (modo seguro pra desenvolver).
// Com as credenciais, envia de verdade pela Z-API.
//
// Alternativas: Evolution API (open source), WhatsApp Cloud API (Meta).
// A interface sendWhatsApp() abstrai o provedor.
// ============================================================

import { normalizePhoneBR } from "./phone";

interface SendResult {
  sent: boolean;
  mode: "zapi" | "log";
  detail: string;
}

export async function sendWhatsApp(phone: string, message: string): Promise<SendResult> {
  const instance = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;

  if (!instance || !token) {
    console.log(`[WhatsApp:log] -> ${phone}: ${message}`);
    return { sent: false, mode: "log", detail: "Credenciais Z-API ausentes (modo log)" };
  }

  const url = `https://api.z-api.io/instances/${instance}/token/${token}/send-text`;
  const onlyDigits = normalizePhoneBR(phone);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(clientToken ? { "Client-Token": clientToken } : {}),
      },
      body: JSON.stringify({ phone: onlyDigits, message }),
    });
    if (!res.ok) {
      const txt = await res.text();
      return { sent: false, mode: "zapi", detail: `Z-API erro ${res.status}: ${txt}` };
    }
    return { sent: true, mode: "zapi", detail: "Enviado via Z-API" };
  } catch (err) {
    return { sent: false, mode: "zapi", detail: `Falha de rede: ${String(err)}` };
  }
}
