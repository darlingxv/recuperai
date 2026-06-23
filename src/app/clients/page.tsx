import { getClients } from "@/lib/db";
import { brl } from "@/lib/format";
import ClientTable from "@/components/ClientTable";
import ImportCsv from "@/components/ImportCsv";
import AddClient from "@/components/AddClient";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await getClients();
  const totalDebt = clients.filter((c) => c.status !== "pago").reduce((s, c) => s + c.debt, 0);

  return (
    <div className="px-4 sm:px-8 py-5 sm:py-7">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h1 className="text-lg sm:text-[22px] font-medium">Clientes</h1>
        <div className="flex items-center gap-2">
          <ImportCsv />
          <AddClient />
        </div>
      </div>
      <p className="text-xs sm:text-[13px] text-muted mb-5 sm:mb-6">{clients.length} clientes · {brl(totalDebt)} em aberto</p>

      <div className="card overflow-hidden">
        <ClientTable clients={clients} />
      </div>
    </div>
  );
}
