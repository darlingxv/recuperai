import Link from "next/link";
import { Client } from "@/lib/types";
import { brl, riskLabel, riskColor, statusLabel, statusColor } from "@/lib/format";

export default function ClientTable({ clients }: { clients: Client[] }) {
  return (
    <div>
      {clients.map((c) => (
        <Link
          key={c.id}
          href={`/negotiations?client=${c.id}`}
          className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-surface2/60 active:bg-surface2 transition-colors"
        >
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium text-ink truncate">{c.name}</div>
            <div className="text-[11px] text-muted truncate">{c.company}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[13px] font-medium font-mono">{brl(c.debt)}</div>
            <div className="text-[10px] text-faint">{c.daysOverdue > 0 ? `${c.daysOverdue} dias` : "no prazo"}</div>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1 w-[68px]">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColor[c.status]}`}>{statusLabel[c.status]}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${riskColor[c.risk]} hidden sm:inline`}>{riskLabel[c.risk]}</span>
          </div>
        </Link>
      ))}
      {clients.length === 0 && (
        <div className="px-4 py-8 text-center text-[12px] text-faint">Nenhum cliente ainda. Adicione um numero para comecar.</div>
      )}
    </div>
  );
}
