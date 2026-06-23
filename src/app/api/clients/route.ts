import { NextResponse } from "next/server";
import { getClients, getStats } from "@/lib/db";

// GET /api/clients -> lista de clientes + estatisticas do dashboard
export async function GET() {
  const [clients, stats] = await Promise.all([getClients(), getStats()]);
  return NextResponse.json({ clients, stats });
}
