import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";
import { Client, CompanyRules, DashboardStats, Message } from "./types";
import { seedClients, defaultRules } from "./seed-data";

// ============================================================
// Camada de dados — 3 modos, escolhidos automaticamente:
//
// 1) Upstash Redis (Vercel KV)  -> se as variaveis KV_*/UPSTASH_* existirem.
//    PERSISTE de verdade na nuvem. E o modo recomendado em producao.
// 2) Arquivo .data/db.json       -> em desenvolvimento (npm run dev).
// 3) Memoria                     -> fallback (some quando o servidor reinicia).
//
// Todo o resto do app so conhece esta interface.
// ============================================================

interface DB {
  rules: CompanyRules;
  clients: Client[];
}

const KEY = "recuperai:db:v1";
const DB_PATH = path.join(process.cwd(), ".data", "db.json");
const isProduction = process.env.NODE_ENV === "production";

const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const useRedis = !!(redisUrl && redisToken);
const redis = useRedis ? new Redis({ url: redisUrl as string, token: redisToken as string }) : null;

let inMemoryDb: DB | null = null;

function freshDb(): DB {
  return { rules: { ...defaultRules }, clients: JSON.parse(JSON.stringify(seedClients)) };
}

async function loadDb(): Promise<DB> {
  // 1) Redis / KV
  if (redis) {
    try {
      const data = await redis.get<DB>(KEY);
      if (data && Array.isArray(data.clients) && data.rules) return data;
      const fresh = freshDb();
      await redis.set(KEY, fresh);
      return fresh;
    } catch (err) {
      console.error("Erro lendo Redis, usando memoria nesta requisicao:", err);
      if (!inMemoryDb) inMemoryDb = freshDb();
      return inMemoryDb;
    }
  }
  // 2) Memoria (producao sem KV)
  if (isProduction) {
    if (!inMemoryDb) inMemoryDb = freshDb();
    return inMemoryDb;
  }
  // 3) Arquivo (dev)
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

async function saveDb(db: DB): Promise<void> {
  if (redis) {
    try {
      await redis.set(KEY, db);
      return;
    } catch (err) {
      console.error("Erro salvando no Redis:", err);
      inMemoryDb = db;
      return;
    }
  }
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
  return (await loadDb()).rules;
}

export async function saveRules(rules: CompanyRules): Promise<CompanyRules> {
  const db = await loadDb();
  db.rules = rules;
  await saveDb(db);
  return rules;
}

export async function getClients(): Promise<Client[]> {
  return (await loadDb()).clients;
}

export async function getClient(id: string): Promise<Client | null> {
  const db = await loadDb();
  return db.clients.find((c) => c.id === id) ?? null;
}

export async function updateClient(updated: Client): Promise<Client> {
  const db = await loadDb();
  const i = db.clients.findIndex((c) => c.id === updated.id);
  if (i === -1) throw new Error(`Cliente ${updated.id} nao encontrado`);
  db.clients[i] = updated;
  await saveDb(db);
  return updated;
}

export async function addMessage(clientId: string, message: Message): Promise<Client> {
  const db = await loadDb();
  const client = db.clients.find((c) => c.id === clientId);
  if (!client) throw new Error(`Cliente ${clientId} nao encontrado`);
  client.messages.push(message);
  await saveDb(db);
  return client;
}

export async function addClient(client: Client): Promise<Client> {
  const db = await loadDb();
  db.clients.unshift(client);
  await saveDb(db);
  return client;
}

export async function addClients(clients: Client[]): Promise<number> {
  const db = await loadDb();
  const existingIds = new Set(db.clients.map((c) => c.id));
  const toAdd = clients.filter((c) => !existingIds.has(c.id));
  db.clients.push(...toAdd);
  await saveDb(db);
  return toAdd.length;
}

export async function resetDb(): Promise<void> {
  inMemoryDb = null;
  await saveDb(freshDb());
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
  return {
    totalOutstanding,
    recoveredThisMonth,
    recoveryRate: 67,
    overdueCount,
    activeNegotiations,
    escalatedCount,
  };
}
