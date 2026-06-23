import { promises as fs } from "fs";
import path from "path";
import { Client, CompanyRules, DashboardStats, Message } from "./types";
import { seedClients, defaultRules } from "./seed-data";

// ============================================================
// Camada de dados.
// Em desenvolvimento: arquivo .data/db.json.
// Em producao (Vercel): memoria (o file system e somente leitura).
// A interface e a unica coisa que o resto do app conhece — para
// persistencia real, reimplemente usando Postgres/Supabase.
// ============================================================

interface DB {
  rules: CompanyRules;
  clients: Client[];
}

const isProduction = process.env.NODE_ENV === "production";
const DB_PATH = path.join(process.cwd(), ".data", "db.json");

let inMemoryDb: DB | null = null;

function freshDb(): DB {
  return { rules: { ...defaultRules }, clients: JSON.parse(JSON.stringify(seedClients)) };
}

async function ensureDb(): Promise<DB> {
  if (isProduction) {
    if (!inMemoryDb) inMemoryDb = freshDb();
    return inMemoryDb;
  }
  if (inMemoryDb) return inMemoryDb;
  try {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(raw) as DB;
  } catch {
    const fresh = freshDb();
    try {
      await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
      await fs.writeFile(DB_PATH, JSON.stringify(fresh, null, 2));
    } catch {
      inMemoryDb = fresh;
    }
    return fresh;
  }
}

async function write(db: DB): Promise<void> {
  if (isProduction) {
    inMemoryDb = db;
    return;
  }
  try {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
  } catch {
    inMemoryDb = db;
  }
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

export async function addClient(client: Client): Promise<Client> {
  const db = await ensureDb();
  db.clients.unshift(client);
  await write(db);
  return client;
}

export async function addClients(clients: Client[]): Promise<number> {
  const db = await ensureDb();
  const existingIds = new Set(db.clients.map((c) => c.id));
  const toAdd = clients.filter((c) => !existingIds.has(c.id));
  db.clients.push(...toAdd);
  await write(db);
  return toAdd.length;
}

export async function resetDb(): Promise<void> {
  inMemoryDb = null;
  await write(freshDb());
}

export async function getStats(): Promise<DashboardStats> {
  const clients = await getClients();
  const open = clients.filter((c) => c.status !== "pago");
  const totalOutstanding = open.reduce((s, c) => s + c.debt, 0);
  const paid = clients.filter((c) => c.status === "pago");
  const recoveredThisMonth = paid.reduce((s, c) => s + c.debt, 0) + 31200;
  const overdueCount = clients.filter((c) => c.daysOverdue > 0 && c.status !== "pago").length;
  const activeNegotiations = clients.filter((c) => c.status === "negociando").length;
  const escalatedCount = clients.filter((c) => c.status === "escalado").length;
  const recoveryRate = 67;
  return {
    totalOutstanding,
    recoveredThisMonth,
    recoveryRate,
    overdueCount,
    activeNegotiations,
    escalatedCount,
  };
}
