import { promises as fs } from "fs";
import path from "path";
import { Client, CompanyRules, DashboardStats, Message } from "./types";
import { seedClients, defaultRules } from "./seed-data";

// ============================================================
// Camada de acesso a dados (MVP)
//
// Para rodar SEM configuracao, os dados ficam num arquivo JSON local.
// A interface abaixo (getClients, getClient, updateClient, addMessage...)
// e a unica coisa que o resto do app conhece. Para producao, basta
// reimplementar estas funcoes usando Prisma + Postgres/Supabase, sem
// tocar em nenhum componente ou rota.
// ============================================================

interface DB {
  rules: CompanyRules;
  clients: Client[];
}

const DB_PATH = path.join(process.cwd(), ".data", "db.json");

async function ensureDb(): Promise<DB> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(raw) as DB;
  } catch {
    const fresh: DB = { rules: defaultRules, clients: seedClients };
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(fresh, null, 2));
    return fresh;
  }
}

async function write(db: DB): Promise<void> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

export async function getRules(): Promise<CompanyRules> {
  const db = await ensureDb();
  return db.rules;
}

export async function saveRules(rules: CompanyRules): Promise<CompanyRules> {
  const db = await ensureDb();
  db.rules = rules;
  await write(db);
  return rules;
}

export async function getClients(): Promise<Client[]> {
  const db = await ensureDb();
  return db.clients;
}

export async function getClient(id: string): Promise<Client | null> {
  const db = await ensureDb();
  return db.clients.find((c) => c.id === id) ?? null;
}

export async function updateClient(updated: Client): Promise<Client> {
  const db = await ensureDb();
  const i = db.clients.findIndex((c) => c.id === updated.id);
  if (i === -1) throw new Error(`Cliente ${updated.id} nao encontrado`);
  db.clients[i] = updated;
  await write(db);
  return updated;
}

export async function addMessage(clientId: string, message: Message): Promise<Client> {
  const client = await getClient(clientId);
  if (!client) throw new Error(`Cliente ${clientId} nao encontrado`);
  client.messages.push(message);
  return updateClient(client);
}

export async function addClients(clients: Client[]): Promise<number> {
  const db = await ensureDb();
  const existingIds = new Set(db.clients.map((c) => c.id));
  const toAdd = clients.filter((c) => !existingIds.has(c.id));
  db.clients.push(...toAdd);
  await write(db);
  return toAdd.length;
}

// Reseta o banco para os dados de exemplo (botao "recarregar demo")
export async function resetDb(): Promise<void> {
  await write({ rules: defaultRules, clients: seedClients });
}

export async function getStats(): Promise<DashboardStats> {
  const clients = await getClients();
  const open = clients.filter((c) => c.status !== "pago");
  const totalOutstanding = open.reduce((s, c) => s + c.debt, 0);
  const paid = clients.filter((c) => c.status === "pago");
  const recoveredThisMonth = paid.reduce((s, c) => s + c.debt, 0) + 31200; // base demo
  const overdueCount = clients.filter((c) => c.daysOverdue > 0 && c.status !== "pago").length;
  const activeNegotiations = clients.filter((c) => c.status === "negociando").length;
  const recoveryRate = 67; // metrica demo; em producao = recuperado / (recuperado + perdido)
  return {
    totalOutstanding,
    recoveredThisMonth,
    recoveryRate,
    overdueCount,
    activeNegotiations,
  };
}
