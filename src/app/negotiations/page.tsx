import { getClients } from "@/lib/db";
import NegotiationWorkspace from "@/components/NegotiationWorkspace";

export const dynamic = "force-dynamic";

export default async function NegotiationsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client } = await searchParams;
  const clients = await getClients();
  const selectedId = client && clients.some((c) => c.id === client) ? client : clients[0]?.id;

  return (
    <div className="px-8 py-7">
      <h1 className="text-[22px] font-medium mb-1">IA negociando</h1>
      <p className="text-[13px] text-muted mb-6">
        Acompanhe e teste as negociacoes automaticas. Simule respostas do cliente e veja o raciocinio da IA ao lado.
      </p>
      <NegotiationWorkspace initialClients={clients} initialSelectedId={selectedId} />
    </div>
  );
}
