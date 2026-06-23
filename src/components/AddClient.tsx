"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddClient() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", company: "", debt: "", dueDate: "" });

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.name.trim() || !form.phone.trim()) {
      setStatus("Preencha nome e telefone");
      return;
    }
    setSaving(true);
    setStatus(null);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, debt: parseFloat(form.debt) || 0 }),
    });
    setSaving(false);
    if (res.ok) {
      setStatus("Cliente adicionado!");
      setForm({ name: "", phone: "", company: "", debt: "", dueDate: "" });
      router.refresh();
      setTimeout(() => setOpen(false), 800);
    } else {
      const d = await res.json();
      setStatus(d.error || "Erro");
    }
  }

  const field = "w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-[14px] text-ink placeholder:text-faint outline-none focus:border-brand/50";

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-[13px] text-white bg-brand rounded-lg px-3 py-2 active:bg-brand/80 transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
        Adicionar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative w-full sm:max-w-md bg-surface border-t sm:border border-border rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="text-[15px] font-medium mb-1">Adicionar cliente</div>
            <p className="text-[11px] text-muted mb-4">Adicione um numero para a IA cobrar. O telefone com DDD e pais (ex: +55 49 99999-9999).</p>
            <div className="space-y-3">
              <div>
                <label className="text-[12px] text-muted mb-1 block">Nome *</label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Joao Silva" className={field} />
              </div>
              <div>
                <label className="text-[12px] text-muted mb-1 block">WhatsApp *</label>
                <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+55 49 99999-9999" className={field} />
              </div>
              <div>
                <label className="text-[12px] text-muted mb-1 block">Contrato / servico</label>
                <input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Tratamento de canal" className={field} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] text-muted mb-1 block">Valor (R$)</label>
                  <input value={form.debt} onChange={(e) => set("debt", e.target.value)} inputMode="decimal" placeholder="850" className={field} />
                </div>
                <div>
                  <label className="text-[12px] text-muted mb-1 block">Vencimento</label>
                  <input value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} type="date" className={field} />
                </div>
              </div>
            </div>
            {status && <div className={`text-[12px] mt-3 ${status.includes("adicionado") ? "text-success" : "text-warning"}`}>{status}</div>}
            <div className="flex gap-2 mt-5">
              <button onClick={() => setOpen(false)} className="flex-1 text-[13px] text-muted border border-border rounded-lg py-2.5">Cancelar</button>
              <button onClick={save} disabled={saving} className="flex-1 text-[13px] text-white bg-brand rounded-lg py-2.5 disabled:opacity-50">{saving ? "Salvando..." : "Adicionar"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
