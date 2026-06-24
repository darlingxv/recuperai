// ============================================================
// Processamento de mensagem recebida (qualquer provedor).
// Usado pelos webhooks (Evolution e Z-API).
// ============================================================

import { getClientByPhone, getRules, updateClient, addClient } from "./db";
import { negotiate } from "./claude";
import { sendWhatsApp } from "./whatsapp";
import { prettyPhoneBR } from "./phone";
import { Client, Message } from "./types";

export interface IncomingResult {
  ok: boolean;
  replied: boolean;
  reply?: string;
  delivery?: unknown;
  ignored?: string;
}

export async function handleIncomingMessage(
  phone: string,
  text: string,
  name: string
): Promise<IncomingResult> {
  if (!phone || !text) return { ok: true, replied: false, ignored: "sem telefone ou texto" };

  const rules = await getRules();

  // acha o cliente pelo telefone; se nao existir, cria (lead novo via WhatsApp)
  let client = await getClientByPhone(phone);
  let isNew = false;
  if (!client) {
    isNew = true;
    const novo: Client = {
      id: "wa_" + Date.now(),
      name,
      company: "Contato via WhatsApp",
      phone: prettyPhoneBR(phone),
      debt: 0,
      dueDate: new Date().toISOString(),
      daysOverdue: 0,
      status: "negociando",
      risk: "medio",
      paymentProbability: 50,
      history: [],
      messages: [],
      lastOffer: null,
      rejectionCount: 0,
      triedOffers: [],
    };
    await addClient(novo);
    client = novo;
  }

  // 1) registra a mensagem que o cliente enviou
  const inbound: Message = {
    id: "m" + Date.now(),
    sender: "cliente",
    text,
    at: new Date().toISOString(),
    channel: "whatsapp",
  };
  client.messages.push(inbound);

  // 2) decide a resposta
  let replyText: string;
  if (isNew || client.debt <= 0) {
    replyText = `Oi! Aqui e da ${rules.companyName}. Recebi sua mensagem e ja estou verificando seu cadastro. Posso te ajudar com pagamentos e negociacoes. 😊`;
  } else {
    const result = await negotiate(client, rules, text);
    replyText = result.reply;
    client.lastOffer = result.offer;
    client.paymentProbability = result.paymentProbability;
    client.rejectionCount = result.rejectionCount;
    client.triedOffers = result.triedOffers;
    client.status = result.agreementReached ? "acordo" : result.escalate ? "escalado" : "negociando";

    if (result.escalate) {
      client.messages.push({
        id: "m" + (Date.now() + 2),
        sender: "sistema",
        text: `Negociacao encaminhada para ${rules.responsibleName}.`,
        at: new Date().toISOString(),
        channel: "sistema",
      });
      if (rules.responsiblePhone) {
        const resumo =
          `🔔 Cobranca escalada — ${rules.companyName}\n\n` +
          `Cliente: ${client.name}\nValor: R$ ${client.debt.toFixed(2)}\n` +
          `Telefone: ${client.phone}\n\nMotivo: ${result.escalationReason || "Cliente nao aceitou as opcoes."}`;
        await sendWhatsApp(rules.responsiblePhone, resumo);
      }
    }
  }

  // 3) registra a resposta da IA e envia de volta pro cliente
  client.messages.push({
    id: "m" + (Date.now() + 1),
    sender: "ai",
    text: replyText,
    at: new Date().toISOString(),
    channel: "whatsapp",
  });
  await updateClient(client);

  const delivery = await sendWhatsApp(phone, replyText);
  return { ok: true, replied: true, reply: replyText, delivery };
}
