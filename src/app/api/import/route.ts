import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { addClients } from "@/lib/db";
import { estimateProbability } from "@/lib/claude";
import { Client, RiskLevel } from "@/lib/types";

// POST /api/import
// Body: { csv: string }
// Colunas esperadas (flexivel): nome, contrato, telefone, valor, vencimento
// Aceita variacoes comuns de cabecalho em portugues.
export async function POST(req: NextRequest) {
  try {
    const { csv } = await req.json();
    if (!csv || typeof csv !== "string") {
      return NextResponse.json({ error: "Envie o conteudo CSV em 'csv'" }, { status: 400 });
    }

    const parsed = Papa.parse<Record<string, string>>(csv, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
    });

    const pick = (row: Record<string, string>, keys: string[]): string => {
      for (const k of keys) {
        if (row[k] != null && row[k] !== "") return row[k];
      }
      return "";
    };

    const now = Date.now();
    const clients: Client[] = parsed.data
      .map((row, i) => {
        const name = pick(row, ["nome", "cliente", "name"]);
        if (!name) return null;

        const rawValue = pick(row, ["valor", "divida", "debito", "amount", "valor_devido"]);
        const debt = parseFloat(
          rawValue.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".")
        ) || 0;

        const dueRaw = pick(row, ["vencimento", "data", "due", "data_vencimento"]);
        const due = parseDate(dueRaw);
        const daysOverdue = Math.max(0, Math.floor((now - due.getTime()) / 86400000));

        const risk: RiskLevel =
          daysOverdue > 30 ? "alto" : daysOverdue > 7 ? "medio" : "baixo";

        const client: Client = {
          id: `imp_${now}_${i}`,
          name,
          company: pick(row, ["contrato", "plano", "servico", "descricao"]) || "Importado via CSV",
          phone: pick(row, ["telefone", "celular", "whatsapp", "phone"]),
          debt,
          dueDate: due.toISOString(),
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
        return client;
      })
      .filter((c): c is Client => c !== null);

    const added = await addClients(clients);
    return NextResponse.json({ added, total: clients.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Falha ao importar CSV" }, { status: 500 });
  }
}

function parseDate(s: string): Date {
  if (!s) return new Date();
  // tenta dd/mm/yyyy
  const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (br) {
    const [, d, m, y] = br;
    const year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
    return new Date(year, parseInt(m) - 1, parseInt(d));
  }
  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}
