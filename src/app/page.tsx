import { getClients, getStats } from "@/lib/db";
import { brl, timeAgo } from "@/lib/format";
import StatCard from "@/components/StatCard";
import RecoveryChart from "@/components/RecoveryChart";
import ClientTable from "@/components/ClientTable";
import DemoControls from "@/components/DemoControls";

export const dynamic = "force-dynamic";

const activity = [
  { icon: "msg", text: "IA propos parcelamento em 2x para Joao Silva", at: 32 },
  { icon: "check", text: "Lucas Ferreira aceitou acordo de 2x", at: 48 },
  { icon: "brain", text: "Padrao detectado: Maria paga apos 2a mensagem", at: 75 },
  { icon: "send", text: "Lembrete enviado para 12 clientes a vencer amanha", at: 130 },
  { icon: "alert", text: "Construtora Marcondes escalada para risco alto", at: 180 },
];

function FeedIcon({ kind }: { kind: string }) {
  const map: Record<string, string> = {
    msg: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
    check: "M20 6L9 17l-5-5",
    brain: "M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96.44 2.5 2.5 0 01-2.96-3.08 3 3 0 01-.34-5.58 2.5 2.5 0 011.32-4.24 2.5 2.5 0 014.94-.44z",
    send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
    alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  };
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-muted shrink-0 mt-0.5">
      <path d={map[kind] || map.msg} />
    </svg>
  );
}

export default async function DashboardPage() {
  const [stats, clients] = await Promise.all([getStats(), getClients()]);
  const isDemo = !process.env.ANTHROPIC_API_KEY;
  const overdue = clients.filter((c) => c.status !== "pago").slice(0, 6);

  return (
    <div className="px-8 py-7">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-[22px] font-medium">Dashboard</h1>
        <DemoControls isDemo={isDemo} />
      </div>
      <p className="text-[13px] text-muted mb-6">
        Visao geral da recuperacao de receita da Clinica OdontoVida
      </p>

      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard label="Em aberto" value={brl(stats.totalOutstanding)} sub={`${stats.overdueCount} clientes`} />
        <StatCard label="Recuperado (mes)" value={brl(stats.recoveredThisMonth)} sub="+12% vs anterior" tone="success" />
        <StatCard label="Taxa de recuperacao" value={`${stats.recoveryRate}%`} sub="Meta: 60%" tone="success" />
        <StatCard label="Negociacoes ativas" value={String(stats.activeNegotiations)} sub="em andamento" />
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-4 mb-4">
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-[13px] font-medium">Clientes atrasados</span>
            <span className="text-[11px] text-muted bg-surface2 rounded-full px-2 py-0.5">
              {overdue.length} de {clients.length}
            </span>
          </div>
          <div className="px-4 py-2 text-[11px] text-faint italic border-b border-border">
            Clique em um cliente para abrir a negociacao da IA
          </div>
          <ClientTable clients={overdue} />
        </div>

        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <span className="text-[13px] font-medium">Atividade da IA</span>
          </div>
          <div className="divide-y divide-border">
            {activity.map((a, i) => (
              <div key={i} className="flex gap-2.5 px-4 py-2.5">
                <FeedIcon kind={a.icon} />
                <div className="min-w-0">
                  <div className="text-[12px] text-muted leading-snug">{a.text}</div>
                  <div className="text-[10px] text-faint mt-0.5">{timeAgo(new Date(Date.now() - a.at * 60000).toISOString())} atras</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-[13px] font-medium">Recuperacao esta semana</span>
          <div className="flex gap-4 text-[11px] text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-success inline-block rounded" />Recuperado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-danger inline-block rounded" />Em aberto
            </span>
          </div>
        </div>
        <div className="p-3">
          <RecoveryChart />
        </div>
      </div>
    </div>
  );
}
