"use client";

import { useState } from "react";

export default function WhatsAppTest() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function test() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/whatsapp-status");
      const d = await res.json();
      if (d.configured === false) {
        setOk(false);
        setMsg(d.message);
      } else if (d.error) {
        setOk(false);
        setMsg("Erro de conexao: " + d.error);
      } else {
        const raw = d.raw;
        const connected =
          raw && typeof raw === "object" && (raw.connected === true || raw.smartphoneConnected === true);
        const detail = typeof raw === "object" ? JSON.stringify(raw) : String(raw);
        setOk(!!connected);
        setMsg(connected ? "Conectado! Pode enviar mensagens." : "Nao conectado. Resposta da Z-API: " + detail);
      }
    } catch {
      setOk(false);
      setMsg("Nao consegui chamar o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        onClick={test}
        disabled={loading}
        className="text-[12px] text-brand bg-brand/10 border border-brand/30 rounded-lg px-3 py-2 disabled:opacity-50"
      >
        {loading ? "Testando..." : "Testar conexao do WhatsApp"}
      </button>
      {msg && (
        <div className={`text-[11.5px] mt-2 px-2.5 py-2 rounded-lg break-all ${ok ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
          {msg}
        </div>
      )}
    </div>
  );
}
