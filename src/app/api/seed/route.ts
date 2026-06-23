import { NextResponse } from "next/server";
import { resetDb } from "@/lib/db";

// POST /api/seed -> recarrega os dados de demonstracao
export async function POST() {
  await resetDb();
  return NextResponse.json({ ok: true });
}
