import { NextRequest, NextResponse } from "next/server";
import { getClients, getStats, addClient } from "@/lib/db";
import { estimateProbability } from "@/lib/claude";
import { prettyPhoneBR } from "@/lib/phone";
import { Client, RiskLevel } from "@/lib/types";

// GET /api/clients -> lista + estatisticas
export async function GET() {
  const [clients, stats] = await Promise.all([getClients(), getStats()]);
  return NextResponse.json({ clients, stats });
}

// POST /api/clients -> cria um cliente (adicionar numero manualmente)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    if (!name || !phone) {
      return NextResponse.json({ error: "Nome e telefone sao obrigatorios" }, { status: 400 });
    }

    const debt = Number(body.debt) || 0;
    const dueDate = body.dueDate ? new Date(body.dueDate) : new Date();
    const daysOverdue = Math.max(0, Math.floor((Date.now() - dueDate.getTime()) / 86400000));
    const risk: RiskLevel = daysOverdue > 30 ? "alto" : daysOverdue > 7 ? "medio" : "baixo";

    const client: Client = {
      id: "cli_" + Date.now(),
      name,
      company: String(body.company || "Cobranca avulsa"),
      phone: prettyPhoneBR(phone),
      debt,
      dueDate: dueDate.toISOString(),
      daysOverdue,
      status: "em_aberto",
      risk,
      paymentProbability: 50,
      history: [],
      messages: [],
      lastOffer: null,
      rejectionCount: 0,
      triedOffers: [],
    };
    client.paymentProbability = estimateProbability(client);
    await addClient(client);
    return NextResponse.json({ client });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 });
  }
}
