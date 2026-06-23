"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

export default function ImportCsv() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setStatus(null);
    const text = await file.text();
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: text }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setStatus(`${data.added} cliente(s) importado(s)`);
      router.refresh();
    } else {
      setStatus(data.error || "Erro ao importar");
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-[13px] text-ink border border-border rounded-lg px-3 py-2 hover:bg-surface2 active:bg-surface2 transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
        <span className="hidden sm:inline">Importar CSV</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative w-full sm:max-w-md bg-surface border-t sm:border border-border rounded-t-2xl sm:rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="text-[15px] font-medium mb-1">Importar inadimplentes</div>
            <p className="text-[11px] text-muted mb-3 leading-relaxed">CSV com colunas: <span className="text-ink font-mono">nome, contrato, telefone, valor, vencimento</span>. O sistema calcula risco e atraso automaticamente.</p>
            <input ref={fileRef} type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
            <button onClick={() => fileRef.current?.click()} disabled={loading} className="w-full text-[13px] bg-brand/15 text-brand border border-brand/30 rounded-lg py-2.5 hover:bg-brand/25 transition-colors disabled:opacity-50">{loading ? "Importando..." : "Selecionar arquivo"}</button>
            {status && <div className="text-[12px] text-success mt-2">{status}</div>}
            <div className="flex items-center justify-between mt-3">
              <a href="/exemplo-inadimplentes.csv" download className="text-[11px] text-muted hover:text-ink">Baixar CSV de exemplo</a>
              <button onClick={() => setOpen(false)} className="text-[11px] text-muted">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
