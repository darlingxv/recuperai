import { getClients } from "@/lib/db";
import { brl } from "@/lib/format";
import ClientTable from "@/components/ClientTable";
import ImportCsv from "@/components/ImportCsv";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await getClients();
  const totalDebt = clients
    .filter((c) => c.status !== "pago")
    .reduce((s, c) => s + c.debt, 0);

  return (
    <div className="px-8 py-7">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-[22px] font-medium">Clientes</h1>
        <ImportCsv />
      </div>
      <p className="text-[13px] text-muted mb-6">
        {clients.length} clientes · {brl(totalDebt)} em aberto
      </p>

      <div className="card overflow-hidden">
        <ClientTable clients={clients} />
      </div>
    </div>
  );
}
