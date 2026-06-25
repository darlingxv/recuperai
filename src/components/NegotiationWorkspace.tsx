"use client";

import { useState, useRef, useEffect, type RefObject } from "react";
import { Client, NegotiationResult } from "@/lib/types";
import { brl, riskColor, riskLabel, statusColor, statusLabel } from "@/lib/format";

const quickReplies = [
  "Estou sem dinheiro esse mes",
  "Achei caro, tem desconto?",
  "Como faco pra pagar?",
  "Nao quero, nao da",
];

function Icon({ name, className = "" }: { name: string; className?: string }) {
  const map: Record<string, string> = {
    history: "M3 3v5h5M3.05 13A9 9 0 106 5.3L3 8M12 7v5l4 2",
    "shield-check": "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4",
    target: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 18a6 6 0 100-12 6 6 0 000 12zM12 14a2 2 0 100-4 2 2 0 000 4z",
    ban: "M12 22a10 10 0 100-20 10 10 0 000 20zM4.9 4.9l14.2 14.2",
    user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
    alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
    back: "M19 12H5M12 19l-7-7 7-7",
    info: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 16v-4M12 8h.01",
    send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
    close: "M18 6L6 18M6 6l12 12",
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={map[name] || map.info} />
    </svg>
  );
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2);
}

export default function NegotiationWorkspace({
  initialClients,
  initialSelectedId,
  responsibleName,
  whatsappConnected,
}: {
  initialClients: Client[];
  initialSelectedId: string;
  responsibleName: string;
  whatsappConnected: boolean;
}) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingReal, setSendingReal] = useState(false);
  const [result, setResult] = useState<NegotiationResult | null>(null);
  const [banner, setBanner] = useState<{ text: string; ok: boolean } | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("chat");
  const [showReasoning, setShowReasoning] = useState(false);
  const desktopBodyRef = useRef<HTMLDivElement>(null);
  const mobileBodyRef = useRef<HTMLDivElement>(null);

  const selected = clients.find((c) => c.id === selectedId) || clients[0];

  useEffect(() => {
    [desktopBodyRef, mobileBodyRef].forEach((r) => {
      if (r.current) r.current.scrollTop = r.current.scrollHeight;
    });
  }, [selected?.messages.length, sending]);

  // Atualiza as conversas a cada 5s para mostrar respostas reais que chegam pelo WhatsApp
  useEffect(() => {
    const id = setInterval(async () => {
      if (sending || sendingReal) return;
      try {
        const res = await fetch("/api/clients");
        const data = await res.json();
        if (data?.clients) setClients(data.clients);
      } catch {
        /* ignora falhas de rede momentaneas */
      }
    }, 5000);
    return () => clearInterval(id);
  }, [sending, sendingReal]);

  function switchClient(id: string) {
    setSelectedId(id);
    setResult(null);
    setInput("");
    setBanner(null);
    setMobileView("chat");
  }

  async function send(text: string) {
    if (!text.trim() || sending || !selected) return;
    setSending(true);
    setInput("");
    const optimistic: Client = {
      ...selected,
      messages: [...selected.messages, { id: "tmp" + Date.now(), sender: "cliente", text, at: new Date().toISOString(), channel: "whatsapp" }],
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
        const dv = data.delivery;
        if (dv && dv.mode === "zapi" && !dv.sent) {
          setBanner({ text: "WhatsApp NAO enviou → " + (dv.detail || "erro desconhecido"), ok: false });
        } else if (data.result.escalate) {
          setBanner({
            text: data.escalation?.mode === "zapi" ? `Responsavel (${responsibleName}) avisado pelo WhatsApp` : `Escalado para ${responsibleName} (configure o WhatsApp do responsavel nas Regras)`,
            ok: data.escalation?.mode === "zapi",
          });
        } else if (dv && dv.sent) {
          setBanner({ text: "Resposta enviada no WhatsApp ✓", ok: true });
        } else if (dv && dv.mode === "log") {
          setBanner({ text: "Modo log: credenciais Z-API ausentes (nao enviou de verdade)", ok: false });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  async function sendReal() {
    if (!selected || sendingReal) return;
    setSendingReal(true);
    setBanner(null);
    try {
      const res = await fetch("/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: selected.id, withPix: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setClients((cs) => cs.map((c) => (c.id === data.client.id ? data.client : c)));
        const dv = data.delivery;
        if (dv?.mode === "zapi" && dv?.sent) {
          setBanner({ text: "1a cobranca enviada pelo WhatsApp ✓", ok: true });
        } else if (dv?.mode === "zapi") {
          setBanner({ text: "WhatsApp nao enviou: " + (dv.detail || "verifique se a instancia esta conectada na Z-API"), ok: false });
        } else {
          setBanner({ text: "Modo log (mensagem so registrada). Configure as variaveis ZAPI_* na Vercel para enviar de verdade.", ok: false });
        }
      } else {
        setBanner({ text: data.error || "Erro ao enviar", ok: false });
      }
    } catch {
      setBanner({ text: "Erro de conexao", ok: false });
    } finally {
      setSendingReal(false);
    }
  }

  if (!selected) return <div className="p-8 text-muted">Nenhum cliente. Adicione um numero na aba Clientes.</div>;

  const prob = result?.paymentProbability ?? selected.paymentProbability;
  const probColor = prob >= 70 ? "#1d9e75" : prob >= 40 ? "#ef9f27" : "#e24b4a";
  const escalated = selected.status === "escalado";

  // ---- sub-views ----
  const ClientList = (
    <div className="overflow-y-auto h-full">
      <div className="px-3 py-2.5 text-[10px] text-faint uppercase tracking-wide border-b border-border">Conversas</div>
      {clients.map((c) => {
        const active = c.id === selected.id;
        return (
          <button key={c.id} onClick={() => switchClient(c.id)} className={`w-full flex items-center gap-2.5 px-3 py-3 border-b border-border text-left transition-colors ${active ? "bg-surface2" : "hover:bg-surface2/50 active:bg-surface2"}`}>
            <div className="w-8 h-8 rounded-full bg-brand/15 text-brand flex items-center justify-center text-[11px] font-medium shrink-0">{initials(c.name)}</div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-ink truncate">{c.name}</div>
              <div className="text-[11px] text-muted truncate">{brl(c.debt)} · {c.daysOverdue}d</div>
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${statusColor[c.status]}`}>{statusLabel[c.status]}</span>
          </button>
        );
      })}
    </div>
  );

  const ChatHeader = (
    <div className="px-3 sm:px-4 py-2.5 border-b border-border flex items-center gap-2.5 shrink-0">
      <button onClick={() => setMobileView("list")} className="md:hidden p-1 -ml-1 text-muted"><Icon name="back" className="w-5 h-5" /></button>
      <div className="w-8 h-8 rounded-full bg-brand/15 text-brand flex items-center justify-center text-[12px] font-medium shrink-0">{initials(selected.name)}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium truncate">{selected.name}</div>
        <div className="text-[11px] text-muted truncate">{selected.phone}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[12px] font-medium text-danger">{brl(selected.debt)}</div>
        <div className="text-[10px] text-faint">{selected.daysOverdue}d atraso</div>
      </div>
      <button onClick={() => setShowReasoning(true)} className="lg:hidden p-1.5 rounded-lg bg-surface2 text-muted ml-1" title="Raciocinio da IA"><Icon name="info" className="w-4 h-4" /></button>
    </div>
  );

  const renderChatBody = (bodyRef: RefObject<HTMLDivElement | null>) => (
    <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-4 space-y-3">
      {escalated && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg px-3 py-2 flex items-start gap-2">
          <Icon name="user" className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <div className="text-[11.5px] text-warning leading-snug">Negociacao encaminhada para <b>{responsibleName}</b>. A IA tentou as opcoes e nao houve acordo.</div>
        </div>
      )}
      {selected.messages.map((m) => {
        if (m.sender === "sistema") {
          return <div key={m.id} className="text-center text-[10px] text-faint py-1">{m.text}</div>;
        }
        return (
          <div key={m.id} className={`flex flex-col ${m.sender === "ai" ? "items-start" : "items-end"}`}>
            <div className="text-[10px] text-faint mb-1 px-1">{m.sender === "ai" ? "Recuper.ai" : selected.name.split(" ")[0]}</div>
            <div className={`max-w-[88%] sm:max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-line ${m.sender === "ai" ? "bg-brand/15 text-ink rounded-bl-sm" : "bg-surface2 text-ink rounded-br-sm"}`}>{m.text}</div>
          </div>
        );
      })}
      {sending && (
        <div className="flex items-start">
          <div className="bg-brand/15 rounded-2xl rounded-bl-sm px-3 py-2.5">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const ChatFooter = (
    <div className="border-t border-border p-3 shrink-0">
      {banner && (
        <div className={`mb-2 text-[11px] px-2.5 py-1.5 rounded-lg ${banner.ok ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{banner.text}</div>
      )}
      <div className="flex items-center gap-2 mb-2">
        <button onClick={sendReal} disabled={sendingReal} className="flex items-center gap-1.5 text-[11px] text-brand bg-brand/10 border border-brand/30 rounded-full px-2.5 py-1 disabled:opacity-50">
          <Icon name="send" className="w-3.5 h-3.5" />
          {sendingReal ? "Enviando..." : "Enviar 1a cobranca real"}
        </button>
        <span className={`text-[10px] flex items-center gap-1 ${whatsappConnected ? "text-success" : "text-faint"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${whatsappConnected ? "bg-success" : "bg-faint"}`} />
          {whatsappConnected ? "WhatsApp on" : "log"}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {quickReplies.map((q) => (
          <button key={q} onClick={() => send(q)} disabled={sending} className="text-[11px] text-muted border border-border rounded-full px-2.5 py-1 hover:text-ink hover:border-faint active:bg-surface2 transition-colors disabled:opacity-40">{q}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(input)} placeholder="Simule a resposta do cliente..." className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2.5 text-[14px] text-ink placeholder:text-faint outline-none focus:border-brand/50" />
        <button onClick={() => send(input)} disabled={sending || !input.trim()} className="bg-brand text-white rounded-lg px-4 text-[14px] font-medium disabled:opacity-40 active:bg-brand/80 transition-colors">Enviar</button>
      </div>
    </div>
  );

  const ReasoningInner = (
    <>
      <div className="text-[10px] text-faint uppercase tracking-wide mb-3">Raciocinio da IA</div>
      {result ? (
        <>
          {result.reasoning.map((r, i) => (
            <div key={i} className="flex items-start gap-2 mb-3">
              <Icon name={r.icon} className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" />
              <div className="text-[11.5px] text-muted leading-snug">{r.text}</div>
            </div>
          ))}
          {result.offer.type !== "nenhuma" && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-[10px] text-faint mb-1.5">Oferta proposta</div>
              <div className="text-[11.5px] text-ink bg-surface2 rounded-lg px-2.5 py-2">{result.offer.description}</div>
            </div>
          )}
          {result.escalate && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-[10px] text-warning mb-1.5">Escalado</div>
              <div className="text-[11.5px] text-warning bg-warning/10 rounded-lg px-2.5 py-2">{result.escalationReason}</div>
            </div>
          )}
        </>
      ) : (
        <div className="text-[11.5px] text-faint leading-relaxed">Envie uma mensagem simulando o cliente para ver, em tempo real, qual regra a IA aplica, o que ela oferece e por que.</div>
      )}
      <div className="mt-4 pt-3 border-t border-border">
        <div className="text-[10px] text-faint mb-1.5">Probabilidade de pagamento</div>
        <div className="h-1.5 bg-surface2 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${prob}%`, background: probColor }} /></div>
        <div className="text-base font-medium mt-1.5" style={{ color: probColor }}>{prob}%</div>
      </div>
      <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
        <span className={`text-[11px] px-2 py-0.5 rounded-full ${riskColor[selected.risk]}`}>{riskLabel[selected.risk]}</span>
        <span className={`text-[11px] px-2 py-0.5 rounded-full ${statusColor[selected.status]}`}>{statusLabel[selected.status]}</span>
      </div>
    </>
  );

  return (
    <>
      {/* DESKTOP: 3 colunas */}
      <div className="hidden md:grid md:grid-cols-[210px_1fr_260px] h-[78vh] card overflow-hidden">
        <div className="border-r border-border overflow-y-auto">{ClientList}</div>
        <div className="flex flex-col min-w-0 h-full">{ChatHeader}{renderChatBody(desktopBodyRef)}{ChatFooter}</div>
        <div className="border-l border-border overflow-y-auto p-3.5">{ReasoningInner}</div>
      </div>

      {/* MOBILE: lista OU chat */}
      <div className="md:hidden card overflow-hidden h-[72dvh]">
        {mobileView === "list" ? (
          <div className="h-full overflow-y-auto">{ClientList}</div>
        ) : (
          <div className="flex flex-col h-full">{ChatHeader}{renderChatBody(mobileBodyRef)}{ChatFooter}</div>
        )}
      </div>

      {/* MOBILE: bottom sheet do raciocinio */}
      {showReasoning && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end" onClick={() => setShowReasoning(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative w-full bg-surface border-t border-border rounded-t-2xl p-4 max-h-[75vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-1 bg-border rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
              <span className="text-[13px] font-medium mt-2">Detalhes da IA</span>
              <button onClick={() => setShowReasoning(false)} className="p-1 text-muted mt-2"><Icon name="close" className="w-5 h-5" /></button>
            </div>
            {ReasoningInner}
          </div>
        </div>
      )}
    </>
  );
}
