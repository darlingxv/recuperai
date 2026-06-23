import { RiskLevel, ClientStatus } from "./types";

export function brl(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export const riskLabel: Record<RiskLevel, string> = { baixo: "Baixo", medio: "Medio", alto: "Alto" };

export const riskColor: Record<RiskLevel, string> = {
  baixo: "text-success bg-success/10",
  medio: "text-warning bg-warning/10",
  alto: "text-danger bg-danger/10",
};

export const statusLabel: Record<ClientStatus, string> = {
  em_aberto: "Em aberto",
  negociando: "Negociando",
  acordo: "Acordo",
  pago: "Pago",
  escalado: "Escalado",
};

export const statusColor: Record<ClientStatus, string> = {
  em_aberto: "text-muted bg-surface2",
  negociando: "text-brand bg-brand/10",
  acordo: "text-success bg-success/10",
  pago: "text-success bg-success/10",
  escalado: "text-warning bg-warning/10",
};
