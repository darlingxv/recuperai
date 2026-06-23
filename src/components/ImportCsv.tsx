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
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-[12px] text-ink border border-border rounded-lg px-3 py-1.5 hover:bg-surface2 transition-colors flex items-center gap-1.5"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
        Importar CSV
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 card p-4 z-10 shadow-xl">
          <div className="text-[13px] font-medium mb-1">Importar inadimplentes</div>
          <p className="text-[11px] text-muted mb-3 leading-relaxed">
            Envie um CSV com colunas: <span className="text-ink font-mono">nome, contrato, telefone, valor, vencimento</span>. O sistema calcula risco e atraso automaticamente.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            className="w-full text-[12px] bg-brand/15 text-brand border border-brand/30 rounded-lg py-2 hover:bg-brand/25 transition-colors disabled:opacity-50"
          >
            {loading ? "Importando..." : "Selecionar arquivo"}
          </button>
          {status && <div className="text-[11px] text-success mt-2">{status}</div>}
          <a
            href="/exemplo-inadimplentes.csv"
            download
            className="text-[11px] text-muted hover:text-ink mt-3 inline-block"
          >
            Baixar CSV de exemplo
          </a>
        </div>
      )}
    </div>
  );
}
