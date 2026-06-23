// Tipos centrais do dominio do Recuper.ai

export type RiskLevel = "baixo" | "medio" | "alto";
export type ClientStatus = "em_aberto" | "negociando" | "acordo" | "pago" | "escalado";
export type MessageSender = "ai" | "cliente" | "sistema";

export interface PaymentRecord {
  dueDate: string;
  paidDate: string | null;
  amount: number;
  daysLate: number;
}

export interface Message {
  id: string;
  sender: MessageSender;
  text: string;
  at: string;
  channel: "whatsapp" | "sistema";
}

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
  company: string;
  phone: string;
  debt: number;
  dueDate: string;
  daysOverdue: number;
  status: ClientStatus;
  risk: RiskLevel;
  paymentProbability: number;
  history: PaymentRecord[];
  messages: Message[];
  lastOffer: NegotiationOffer | null;
  rejectionCount: number; // quantas ofertas o cliente recusou seguidas
  triedOffers: string[]; // tipos de oferta ja tentados nesta negociacao
}

export interface CompanyRules {
  companyName: string;
  maxInstallments: number;
  maxDiscountPercent: number;
  allowDueDateChange: boolean;
  minAmountForDiscount: number;
  tone: "amigavel" | "neutro" | "firme";
  contactHourStart: number;
  contactHourEnd: number;
  // Responsavel que a IA aciona quando o cliente recusa tudo
  responsibleName: string;
  responsiblePhone: string;
  maxRejectionsBeforeEscalation: number; // padrao 2
}

export interface NegotiationResult {
  reply: string;
  offer: NegotiationOffer;
  reasoning: ReasoningStep[];
  paymentProbability: number;
  mode: "claude" | "demo";
  // Controle de fluxo da negociacao
  escalate: boolean; // true => acionar o responsavel
  escalationReason?: string;
  agreementReached: boolean; // true => cliente aceitou uma oferta
  rejectionCount: number; // atualizado apos esta rodada
  triedOffers: string[];
}

export interface ReasoningStep {
  icon: string;
  text: string;
}

export interface DashboardStats {
  totalOutstanding: number;
  recoveredThisMonth: number;
  recoveryRate: number;
  overdueCount: number;
  activeNegotiations: number;
  escalatedCount: number;
}
