"use client";

import { useState } from "react";

export default function WhatsAppTest() {
  // teste de conexao
  const [loadingConn, setLoadingConn] = useState(false);
  const [connMsg, setConnMsg] = useState<string | null>(null);
  const [connOk, setConnOk] = useState(false);

  // teste de envio
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState<string | null>(null);
  const [sendOk, setSendOk] = useState(false);

  async function testConn() {
    setLoadingConn(true);
    setConnMsg(null);
    try {
      const res = await fetch("/api/whatsapp-status");
      const d = await res.json();
      if (d.configured === false) {
        setConnOk(false);
        setConnMsg(d.message);
      } else if (d.error) {
        setConnOk(false);
        setConnMsg("Erro de conexao: " + d.error);
      } else {
        const raw = d.raw;
        const connected = raw && typeof raw === "object" && (raw.connected === true || raw.smartphoneConnected === true);
        if (connected) {
          setConnOk(true);
          setConnMsg("WhatsApp CONECTADO ✓ — pode enviar. Se ainda nao envia, teste abaixo.");
        } else if (d.httpStatus === 403 || (typeof raw === "string" && /token/i.test(raw))) {
          setConnOk(false);
          setConnMsg("Problema com o Client-Token. Confira o 'Token de seguranca da conta' na Z-API. Resposta: " + (typeof raw === "object" ? JSON.stringify(raw) : String(raw)));
        } else {
          setConnOk(false);
          setConnMsg("WhatsApp NAO conectado. Abra o painel da Z-API e escaneie o QR Code com o celular. Resposta: " + (typeof raw === "object" ? JSON.stringify(raw) : String(raw)));
        }
      }
    } catch {
      setConnOk(false);
      setConnMsg("Nao consegui chamar o servidor.");
    } finally {
      setLoadingConn(false);
    }
  }

  async function testSend() {
    if (!phone.trim()) {
      setSendOk(false);
      setSendMsg("Digite um numero (ex: 49 99999-9999).");
      return;
    }
    setSending(true);
    setSendMsg(null);
    try {
      const res = await fetch("/api/whatsapp-test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const d = await res.json();
      if (d.sent) {
        setSendOk(true);
        setSendMsg("Enviado ✓ — confira o WhatsApp desse numero agora!");
      } else {
        setSendOk(false);
        setSendMsg("NAO enviou → " + (d.detail || JSON.stringify(d)));
      }
    } catch {
      setSendOk(false);
      setSendMsg("Erro ao chamar o servidor.");
    } finally {
      setSending(false);
    }
  }

  const field = "flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-[14px] text-ink placeholder:text-faint outline-none focus:border-brand/50";

  return (
    <div className="mt-3 space-y-3">
      <div>
        <button onClick={testConn} disabled={loadingConn} className="text-[12px] text-brand bg-brand/10 border border-brand/30 rounded-lg px-3 py-2 disabled:opacity-50">
          {loadingConn ? "Testando..." : "1) Testar conexao do WhatsApp"}
        </button>
        {connMsg && (
          <div className={`text-[11.5px] mt-2 px-2.5 py-2 rounded-lg break-all ${connOk ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{connMsg}</div>
        )}
      </div>

      <div>
        <div className="text-[12px] text-muted mb-1.5">2) Enviar uma mensagem de teste para um numero seu:</div>
        <div className="flex gap-2">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="49 99999-9999" className={field} />
          <button onClick={testSend} disabled={sending} className="text-[13px] text-white bg-brand rounded-lg px-4 disabled:opacity-50">
            {sending ? "..." : "Enviar"}
          </button>
        </div>
        {sendMsg && (
          <div className={`text-[11.5px] mt-2 px-2.5 py-2 rounded-lg break-all ${sendOk ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{sendMsg}</div>
        )}
      </div>
    </div>
  );
}
