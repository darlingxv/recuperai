"use client";

import { useState, useRef, useEffect } from "react";
import { Client, NegotiationResult } from "@/lib/types";
import { brl, riskColor, riskLabel } from "@/lib/format";

const quickReplies = [
  "Estou sem dinheiro esse mes",
  "Achei caro, tem desconto?",
  "Como faco pra pagar?",
  "Pode mudar o vencimento?",
];

function ReasonIcon({ name }: { name: string }) {
  const map: Record<string, string> = {
    history: "M3 3v5h5M3.05 13A9 9 0 106 5.3L3 8M12 7v5l4 2",
    "shield-check": "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4",
    target: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 18a6 6 0 100-12 6 6 0 000 12zM12 14a2 2 0 100-4 2 2 0 000 4z",
    ban: "M12 22a10 10 0 100-20 10 10 0 000 20zM4.9 4.9l14.2 14.2",
    clock: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",
    brain: "M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96.44 2.5 2.5 0 01-2.96-3.08 3 3 0 01-.34-5.58 2.5 2.5 0 011.32-4.24 2.5 2.5 0 014.94-.44z",
  };
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-muted shrink-0 mt-0.5">
      <path d={map[name] || map.target} />
    </svg>
  );
}

export default function NegotiationWorkspace({
  initialClients,
  initialSelectedId,
}: {
  initialClients: Client[];
  initialSelectedId: string;
}) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<NegotiationResult | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);

  const selected = clients.find((c) => c.id === selectedId) || clients[0];

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages.length, sending]);

  function switchClient(id: string) {
    setSelectedId(id);
    setResult(null);
    setInput("");
  }

  async function send(text: string) {
    if (!text.trim() || sending || !selected) return;
    setSending(true);
    setInput("");

    // adiciona a mensagem do cliente na hora (otimista)
    const optimistic: Client = {
      ...selected,
      messages: [
        ...selected.messages,
        { id: "tmp" + Date.now(), sender: "cliente", text, at: new Date().toISOString(), channel: "whatsapp" },
      ],
    };
    setClients((cs) => cs.map((c) => (c.id === selected.id ? optimistic : c)));

    try {
      const res = await fetch("/api/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: selected.id, message: text }),
      });
      const data = await res.json();
      if (res.ok) {
        setClients((cs) => cs.map((c) => (c.id === data.client.id ? data.client : c)));
        setResult(data.result);
        setMode(data.delivery?.mode === "zapi" ? "Enviado via WhatsApp" : data.result.mode === "demo" ? "IA simulada (modo demo)" : "Claude");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  if (!selected) return <div className="p-8 text-muted">Nenhum cliente.</div>;

  const prob = result?.paymentProbability ?? selected.paymentProbability;
  const probColor = prob >= 70 ? "#1d9e75" : prob >= 40 ? "#ef9f27" : "#e24b4a";

  return (
    <div className="grid grid-cols-[210px_1fr_240px] h-[calc(100vh-110px)] card overflow-hidden">
      {/* coluna 1: lista de clientes */}
      <div className="border-r border-border overflow-y-auto">
        <div className="px-3 py-2.5 text-[10px] text-faint uppercase tracking-wide border-b border-border">
          Conversas
        </div>
        {clients.map((c) => {
          const active = c.id === selected.id;
          const initials = c.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
          return (
            <button
              key={c.id}
              onClick={() => switchClient(c.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 border-b border-border text-left transition-colors ${
                active ? "bg-surface2" : "hover:bg-surface2/50"
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-brand/15 text-brand flex items-center justify-center text-[11px] font-medium shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium text-ink truncate">{c.name}</div>
                <div className="text-[10px] text-muted truncate">{brl(c.debt)} · {c.daysOverdue}d</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* coluna 2: chat */}
      <div className="flex flex-col min-w-0">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand/15 text-brand flex items-center justify-center text-[12px] font-medium">
            {selected.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate">{selected.name}</div>
            <div className="text-[11px] text-muted truncate">{selected.company}</div>
          </div>
          <div className="text-right">
            <div className="text-[12px] font-medium text-danger">{brl(selected.debt)}</div>
            <div className="text-[10px] text-faint">{selected.daysOverdue} dias em atraso</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {selected.messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.sender === "ai" ? "items-start" : "items-end"}`}>
              <div className="text-[10px] text-faint mb-1 px-1">
                {m.sender === "ai" ? "Recuper.ai" : selected.name.split(" ")[0]}
              </div>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-[12.5px] leading-relaxed ${
                  m.sender === "ai"
                    ? "bg-brand/15 text-ink rounded-bl-sm"
                    : "bg-surface2 text-ink rounded-br-sm"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex items-start">
              <div className="bg-brand/15 rounded-xl rounded-bl-sm px-3 py-2.5">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={msgEndRef} />
        </div>

        <div className="border-t border-border p-3">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {quickReplies.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                disabled={sending}
                className="text-[11px] text-muted border border-border rounded-full px-2.5 py-1 hover:text-ink hover:border-faint transition-colors disabled:opacity-40"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Simule a resposta do cliente..."
              className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-[12.5px] text-ink placeholder:text-faint outline-none focus:border-brand/50"
            />
            <button
              onClick={() => send(input)}
              disabled={sending || !input.trim()}
              className="bg-brand text-white rounded-lg px-4 text-[12.5px] font-medium disabled:opacity-40 hover:bg-brand/90 transition-colors"
            >
              Enviar
            </button>
          </div>
        </div>
      </div>

      {/* coluna 3: raciocinio da IA */}
      <div className="border-l border-border overflow-y-auto p-3.5">
        <div className="text-[10px] text-faint uppercase tracking-wide mb-3">Raciocinio da IA</div>

        {result ? (
          <>
            {result.reasoning.map((r, i) => (
              <div key={i} className="flex items-start gap-2 mb-3">
                <ReasonIcon name={r.icon} />
                <div className="text-[11px] text-muted leading-snug">{r.text}</div>
              </div>
            ))}

            {result.offer.type !== "nenhuma" && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-[10px] text-faint mb-1.5">Oferta proposta</div>
                <div className="text-[11px] text-ink bg-surface2 rounded-lg px-2.5 py-2">
                  {result.offer.description}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-[11px] text-faint leading-relaxed">
            Envie uma mensagem simulando o cliente para ver, em tempo real, qual regra a IA aplica, o que ela oferece e por que.
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-border">
          <div className="text-[10px] text-faint mb-1.5">Probabilidade de pagamento</div>
          <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${prob}%`, background: probColor }} />
          </div>
          <div className="text-base font-medium mt-1.5" style={{ color: probColor }}>{prob}%</div>
        </div>

        <div className="mt-4 pt-3 border-t border-border">
          <div className="text-[10px] text-faint mb-1.5">Risco</div>
          <span className={`text-[11px] px-2 py-0.5 rounded-full ${riskColor[selected.risk]}`}>
            {riskLabel[selected.risk]}
          </span>
        </div>

        {mode && (
          <div className="mt-4 text-[10px] text-faint flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            {mode}
          </div>
        )}
      </div>
    </div>
  );
}
