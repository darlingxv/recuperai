"use client";

import { useState } from "react";
import { CompanyRules } from "@/lib/types";

export default function RulesForm({ initial }: { initial: CompanyRules }) {
  const [rules, setRules] = useState<CompanyRules>(initial);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof CompanyRules>(key: K, value: CompanyRules[K]) {
    setRules((r) => ({ ...r, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await fetch("/api/rules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rules),
    });
    setSaving(false);
    setSaved(true);
  }

  const field = "bg-surface2 border border-border rounded-lg px-3 py-2 text-[13px] text-ink outline-none focus:border-brand/50 w-full";
  const label = "text-[12px] text-muted mb-1.5 block";

  return (
    <div className="max-w-xl space-y-5">
      <div className="card p-5">
        <div className="text-[14px] font-medium mb-4">Limites de negociacao</div>
        <p className="text-[11px] text-faint mb-4 leading-relaxed">
          A IA nunca ultrapassa estes limites. Sao a margem de manobra que voce da pra ela negociar sozinha.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Maximo de parcelas</label>
            <input type="number" min={1} max={12} value={rules.maxInstallments}
              onChange={(e) => set("maxInstallments", Number(e.target.value))} className={field} />
          </div>
          <div>
            <label className={label}>Desconto maximo (%)</label>
            <input type="number" min={0} max={50} value={rules.maxDiscountPercent}
              onChange={(e) => set("maxDiscountPercent", Number(e.target.value))} className={field} />
          </div>
          <div>
            <label className={label}>Desconto so acima de (R$)</label>
            <input type="number" min={0} value={rules.minAmountForDiscount}
              onChange={(e) => set("minAmountForDiscount", Number(e.target.value))} className={field} />
          </div>
          <div>
            <label className={label}>Tom de voz</label>
            <select value={rules.tone} onChange={(e) => set("tone", e.target.value as CompanyRules["tone"])} className={field}>
              <option value="amigavel">Amigavel</option>
              <option value="neutro">Neutro</option>
              <option value="firme">Firme</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2.5 mt-4 cursor-pointer">
          <input type="checkbox" checked={rules.allowDueDateChange}
            onChange={(e) => set("allowDueDateChange", e.target.checked)} className="accent-brand w-4 h-4" />
          <span className="text-[13px] text-ink">Permitir mudanca de vencimento</span>
        </label>
      </div>

      <div className="card p-5">
        <div className="text-[14px] font-medium mb-4">Horario de contato</div>
        <p className="text-[11px] text-faint mb-4 leading-relaxed">
          O Codigo de Defesa do Consumidor exige cobranca em horario razoavel. A IA so envia mensagens dentro desta janela.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Inicio (h)</label>
            <input type="number" min={0} max={23} value={rules.contactHourStart}
              onChange={(e) => set("contactHourStart", Number(e.target.value))} className={field} />
          </div>
          <div>
            <label className={label}>Fim (h)</label>
            <input type="number" min={0} max={23} value={rules.contactHourEnd}
              onChange={(e) => set("contactHourEnd", Number(e.target.value))} className={field} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving}
          className="bg-brand text-white rounded-lg px-5 py-2 text-[13px] font-medium disabled:opacity-50 hover:bg-brand/90 transition-colors">
          {saving ? "Salvando..." : "Salvar regras"}
        </button>
        {saved && <span className="text-[12px] text-success">Salvo</span>}
      </div>
    </div>
  );
}
