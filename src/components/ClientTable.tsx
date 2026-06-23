import Link from "next/link";
import { Client } from "@/lib/types";
import { brl, riskLabel, riskColor, statusLabel } from "@/lib/format";

export default function ClientTable({ clients }: { clients: Client[] }) {
  return (
    <div>
      <div className="grid grid-cols-[1fr_100px_70px_90px_90px] gap-2 px-4 py-2 border-b border-border text-[10px] text-faint uppercase tracking-wide">
        <span>Cliente</span>
        <span className="text-right">Valor</span>
        <span className="text-center">Atraso</span>
        <span className="text-center">Status</span>
        <span className="text-right">Risco</span>
      </div>
      {clients.map((c) => (
        <Link
          key={c.id}
          href={`/negotiations?client=${c.id}`}
          className="grid grid-cols-[1fr_100px_70px_90px_90px] gap-2 px-4 py-3 border-b border-border items-center hover:bg-surface2/60 transition-colors"
        >
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-ink truncate">{c.name}</div>
            <div className="text-[11px] text-muted truncate">{c.company}</div>
          </div>
          <div className="text-[12px] font-medium text-right font-mono">{brl(c.debt)}</div>
          <div className="text-[11px] text-center text-faint">
            {c.daysOverdue > 0 ? `${c.daysOverdue}d` : "—"}
          </div>
          <div className="text-center">
            <span className="text-[10px] text-muted">{statusLabel[c.status]}</span>
          </div>
          <div className="text-right">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${riskColor[c.risk]}`}>
              {riskLabel[c.risk]}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
