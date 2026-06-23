import { NextRequest, NextResponse } from "next/server";
import { getRules, saveRules } from "@/lib/db";
import { CompanyRules } from "@/lib/types";

export async function GET() {
  const rules = await getRules();
  return NextResponse.json(rules);
}

export async function PUT(req: NextRequest) {
  const body = (await req.json()) as CompanyRules;
  const saved = await saveRules(body);
  return NextResponse.json(saved);
}
