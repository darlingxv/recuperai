"use client";

import { useState } from "react";

export default function WhatsAppTest() {
  const [loadingConn, setLoadingConn] = useState(false);
  const [connMsg, setConnMsg] = useState<string | null>(null);
  const [connOk, setConnOk] = useState(false);

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
      const prov = d.provider === "evolution" ? "Evolution" : d.provider === "zapi" ? "Z-API" : "WhatsApp";
      if (d.configured === false) {
        setConnOk(false);
        let extra = "";
        if (d.detected) {
          const e = d.detected;
          const faltam: string[] = [];
          if (!e.EVOLUTION_API_URL) faltam.push("EVOLUTION_API_URL");
          if (!e.EVOLUTION_API_KEY) faltam.push("EVOLUTION_API_KEY");
          if (!e.EVOLUTION_INSTANCE) faltam.push("EVOLUTION_INSTANCE");
          if (faltam.length === 3) {
            extra = " O servidor NAO leu NENHUMA variavel da Evolution. Quase sempre e porque o servidor nao foi reiniciado: FECHE a janela preta e rode o INICIAR-WINDOWS.bat de novo.";
          } else if (faltam.length > 0) {
            extra = " Lidas em parte. Faltando: " + faltam.join(", ") + ".";
          }
        }
        setConnMsg((d.message || "Nenhum provedor configurado.") + extra);
      } else if (d.error) {
        setConnOk(false);
        setConnMsg(`Erro ao falar com a ${prov}: ${d.error}`);
      } else if (d.connected) {
        setConnOk(true);
        const cfg = d.provider === "evolution" ? ` (URL: ${d.url}, instancia: ${d.instance})` : "";
        setConnMsg(`${prov} CONECTADO ✓${cfg} — pode enviar. Se ainda nao envia, teste abaixo.`);
      } else {
        setConnOk(false);
        const extra =
          d.provider === "evolution"
            ? `Usando URL ${d.url} e instancia "${d.instance}". Estado: "${d.state || "?"}". Confira se o nome da instancia bate com o do painel e se o EVOLUTION_API_URL e http://localhost:8080.`
            : `Resposta: ${typeof d.raw === "object" ? JSON.stringify(d.raw) : String(d.raw)}. Escaneie o QR ou confira o Client-Token.`;
        setConnMsg(`${prov} NAO conectado. ${extra}`);
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
        <div className="text-[12px] text-muted mb-1.5">2) Enviar uma mensagem de teste para um numero:</div>
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
