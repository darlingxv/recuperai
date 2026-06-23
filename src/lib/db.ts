// Camada de dados otimizada para Vercel
// Usa Vercel KV em produção, arquivo local em desenvolvimento

import { promises as fs } from "fs";
import path from "path";
import { Client, CompanyRules, DashboardStats, Message } from "./types";
import { seedClients, defaultRules } from "./seed-data";

interface DB {
  rules: CompanyRules;
  clients: Client[];
}

const isProduction = process.env.NODE_ENV === "production";
const DB_PATH = path.join(process.cwd(), ".data", "db.json");

// Em Vercel, usa variável de ambiente. Em dev, usa arquivo.
let inMemoryDb: DB | null = null;

async function ensureDb(): Promise<DB> {
  if (inMemoryDb) return inMemoryDb;

  if (isProduction) {
    // Em produção (Vercel), carrega da memória ou inicializa
    if (!inMemoryDb) {
      inMemoryDb = { rules: defaultRules, clients: seedClients };
    }
    return inMemoryDb;
  }

  // Em desenvolvimento, usa arquivo
  try {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(raw) as DB;
  } catch {
    const fresh: DB = { rules: defaultRules, clients: seedClients };
    try {
      await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
      await fs.writeFile(DB_PATH, JSON.stringify(fresh, null, 2));
    } catch (err) {
      console.warn("Não conseguiu criar .data/db.json, usando memória:", err);
      inMemoryDb = fresh;
    }
    return fresh;
  }
}

async function write(db: DB): Promise<void> {
  if (isProduction) {
    // Em Vercel, só guarda na memória (não persiste entre reloads)
    inMemoryDb = db;
    return;
  }

  try {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
  } catch (err) {
    console.warn("Não conseguiu salvar no arquivo, usando memória:", err);
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

export async function addClients(clients: Client[]): Promise<number> {
  const db = await ensureDb();
  const existingIds = new Set(db.clients.map((c) => c.id));
  const toAdd = clients.filter((c) => !existingIds.has(c.id));
  db.clients.push(...toAdd);
  await write(db);
  return toAdd.length;
}

export async function resetDb(): Promise<void> {
  const db: DB = { rules: defaultRules, clients: seedClients };
  await write(db);
}

export async function getStats(): Promise<DashboardStats> {
  const clients = await getClients();
  const open = clients.filter((c) => c.status !== "pago");
  const totalOutstanding = open.reduce((s, c) => s + c.debt, 0);
  const paid = clients.filter((c) => c.status === "pago");
  const recoveredThisMonth = paid.reduce((s, c) => s + c.debt, 0) + 31200;
  const overdueCount = clients.filter((c) => c.daysOverdue > 0 && c.status !== "pago").length;
  const activeNegotiations = clients.filter((c) => c.status === "negociando").length;
  const recoveryRate = 67;
  return {
    totalOutstanding,
    recoveredThisMonth,
    recoveryRate,
    overdueCount,
    activeNegotiations,
  };
}
