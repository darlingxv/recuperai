// Tipos centrais do dominio do Recuper.ai

export type RiskLevel = "baixo" | "medio" | "alto";
export type ClientStatus = "em_aberto" | "negociando" | "acordo" | "pago";
export type MessageSender = "ai" | "cliente" | "sistema";

// Um pagamento no historico do cliente (usado para estimar risco/probabilidade)
export interface PaymentRecord {
  dueDate: string; // ISO date
  paidDate: string | null; // ISO date ou null se nao pago
  amount: number;
  daysLate: number; // 0 = em dia, negativo = adiantado
}

// Uma mensagem trocada na negociacao
export interface Message {
  id: string;
  sender: MessageSender;
  text: string;
  at: string; // ISO datetime
  channel: "whatsapp" | "sistema";
}

// Oferta que a IA pode propor, sempre dentro das regras da empresa
export interface NegotiationOffer {
  type: "parcelamento" | "desconto" | "novo_vencimento" | "pix_imediato" | "nenhuma";
  installments?: number;
  discountPercent?: number;
  newDueDate?: string;
  description: string;
}

export interface Client {
  id: string;
  name: string;
  company: string; // nome do negocio/contrato
  phone: string;
  debt: number;
  dueDate: string; // ISO date
  daysOverdue: number;
  status: ClientStatus;
  risk: RiskLevel;
  paymentProbability: number; // 0-100, estimada pela IA
  history: PaymentRecord[];
  messages: Message[];
  lastOffer: NegotiationOffer | null;
}

// Regras configuraveis por empresa — limites que a IA NUNCA ultrapassa
export interface CompanyRules {
  companyName: string;
  maxInstallments: number;
  maxDiscountPercent: number;
  allowDueDateChange: boolean;
  minAmountForDiscount: number; // desconto so liberado acima deste valor
  tone: "amigavel" | "neutro" | "firme";
  contactHourStart: number; // 8 = 08h (CDC: cobranca em horario comercial)
  contactHourEnd: number; // 20 = 20h
}

// Resposta estruturada do motor de negociacao
export interface NegotiationResult {
  reply: string; // o que sera enviado ao cliente
  offer: NegotiationOffer;
  reasoning: ReasoningStep[]; // por que a IA decidiu assim (transparencia)
  paymentProbability: number; // 0-100
  mode: "claude" | "demo"; // de onde veio a resposta
}

export interface ReasoningStep {
  icon: string; // nome do icone (apenas referencia)
  text: string;
}

export interface DashboardStats {
  totalOutstanding: number;
  recoveredThisMonth: number;
  recoveryRate: number;
  overdueCount: number;
  activeNegotiations: number;
}
