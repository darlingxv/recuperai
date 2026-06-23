import { Client, CompanyRules } from "./types";

// Regras padrao da empresa (clinica odontologica — nicho inicial)
export const defaultRules: CompanyRules = {
  companyName: "Clinica OdontoVida",
  maxInstallments: 3,
  maxDiscountPercent: 8,
  allowDueDateChange: true,
  minAmountForDiscount: 500,
  tone: "amigavel",
  contactHourStart: 8,
  contactHourEnd: 20,
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

// Carteira de inadimplentes de exemplo. Cada cliente tem historico real
// de pagamento, o que alimenta a estimativa de risco da IA.
export const seedClients: Client[] = [
  {
    id: "c1",
    name: "Joao Silva",
    company: "Tratamento ortodontico — parcela 4/12",
    phone: "+55 49 99101-2233",
    debt: 380,
    dueDate: daysAgo(5),
    daysOverdue: 5,
    status: "negociando",
    risk: "medio",
    paymentProbability: 74,
    history: [
      { dueDate: daysAgo(95), paidDate: daysAgo(88), amount: 380, daysLate: 7 },
      { dueDate: daysAgo(65), paidDate: daysAgo(58), amount: 380, daysLate: 7 },
      { dueDate: daysAgo(35), paidDate: daysAgo(31), amount: 380, daysLate: 4 },
    ],
    messages: [
      { id: "m1", sender: "ai", text: "Oi Joao! Passando para lembrar que a parcela do seu tratamento vence dia 10. Se quiser ja deixo o Pix pronto pra voce. 😊", at: daysAgo(8), channel: "whatsapp" },
      { id: "m2", sender: "cliente", text: "Valeu! Pago essa semana", at: daysAgo(8), channel: "whatsapp" },
      { id: "m3", sender: "ai", text: "Joao, a parcela venceu hoje. Segue o link pra evitar atraso no tratamento. Qualquer coisa estou aqui!", at: daysAgo(5), channel: "whatsapp" },
      { id: "m4", sender: "cliente", text: "Esse mes apertou aqui, nao vou conseguir agora", at: daysAgo(1), channel: "whatsapp" },
    ],
    lastOffer: null,
  },
  {
    id: "c2",
    name: "Construtora Marcondes",
    company: "Convenio odontologico empresarial",
    phone: "+55 49 99812-7766",
    debt: 8400,
    dueDate: daysAgo(42),
    daysOverdue: 42,
    status: "em_aberto",
    risk: "alto",
    paymentProbability: 28,
    history: [
      { dueDate: daysAgo(160), paidDate: daysAgo(120), amount: 8400, daysLate: 40 },
      { dueDate: daysAgo(130), paidDate: daysAgo(95), amount: 8400, daysLate: 35 },
      { dueDate: daysAgo(72), paidDate: null, amount: 8400, daysLate: 72 },
    ],
    messages: [
      { id: "m1", sender: "ai", text: "Ola! O convenio odontologico da Construtora Marcondes esta com fatura em aberto ha 42 dias. Podemos regularizar com uma condicao especial?", at: daysAgo(20), channel: "whatsapp" },
    ],
    lastOffer: null,
  },
  {
    id: "c3",
    name: "Maria Oliveira",
    company: "Clareamento + limpeza — a vista parcelado",
    phone: "+55 49 99233-4411",
    debt: 640,
    dueDate: daysAgo(12),
    daysOverdue: 12,
    status: "em_aberto",
    risk: "medio",
    paymentProbability: 61,
    history: [
      { dueDate: daysAgo(70), paidDate: daysAgo(58), amount: 320, daysLate: 12 },
      { dueDate: daysAgo(40), paidDate: daysAgo(29), amount: 320, daysLate: 11 },
    ],
    messages: [],
    lastOffer: null,
  },
  {
    id: "c4",
    name: "Pedro Santos",
    company: "Implante dentario — entrada + 2x",
    phone: "+55 49 99655-8822",
    debt: 2800,
    dueDate: daysAgo(60),
    daysOverdue: 60,
    status: "em_aberto",
    risk: "alto",
    paymentProbability: 19,
    history: [
      { dueDate: daysAgo(120), paidDate: daysAgo(118), amount: 2800, daysLate: 2 },
      { dueDate: daysAgo(90), paidDate: daysAgo(60), amount: 2800, daysLate: 30 },
    ],
    messages: [],
    lastOffer: null,
  },
  {
    id: "c5",
    name: "Ana Costa",
    company: "Manutencao ortodontica — mensal",
    phone: "+55 49 99477-1290",
    debt: 190,
    dueDate: daysFromNow(2),
    daysOverdue: 0,
    status: "em_aberto",
    risk: "baixo",
    paymentProbability: 92,
    history: [
      { dueDate: daysAgo(58), paidDate: daysAgo(59), amount: 190, daysLate: -1 },
      { dueDate: daysAgo(28), paidDate: daysAgo(28), amount: 190, daysLate: 0 },
    ],
    messages: [],
    lastOffer: null,
  },
  {
    id: "c6",
    name: "Lucas Ferreira",
    company: "Canal + restauracao — 3x",
    phone: "+55 49 99388-5567",
    debt: 1200,
    dueDate: daysAgo(18),
    daysOverdue: 18,
    status: "acordo",
    risk: "medio",
    paymentProbability: 70,
    history: [
      { dueDate: daysAgo(80), paidDate: daysAgo(70), amount: 1200, daysLate: 10 },
    ],
    messages: [
      { id: "m1", sender: "ai", text: "Oi Lucas! Sua parcela esta ha 18 dias pendente. Posso dividir em 2x ou ajustar o vencimento. O que fica melhor?", at: daysAgo(3), channel: "whatsapp" },
      { id: "m2", sender: "cliente", text: "Pode dividir em 2x sim", at: daysAgo(3), channel: "whatsapp" },
      { id: "m3", sender: "ai", text: "Fechado! Dividi em 2x de R$600. Primeira parcela cai sexta. Te mando o Pix agora. 🙌", at: daysAgo(3), channel: "whatsapp" },
    ],
    lastOffer: {
      type: "parcelamento",
      installments: 2,
      description: "Parcelado em 2x de R$600",
    },
  },
];
