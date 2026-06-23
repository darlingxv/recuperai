// Recarrega o banco de dados local (.data/db.json) com os dados de demonstracao.
// Uso: npm run seed
import { promises as fs } from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), ".data", "db.json");

await fs.rm(DB_PATH, { force: true });
await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
console.log("Banco resetado. Os dados de demonstracao serao recriados no proximo acesso.");
