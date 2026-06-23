import { getClients, getRules } from "@/lib/db";
import NegotiationWorkspace from "@/components/NegotiationWorkspace";

export const dynamic = "force-dynamic";

export default async function NegotiationsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client } = await searchParams;
  const [clients, rules] = await Promise.all([getClients(), getRules()]);
  const selectedId = client && clients.some((c) => c.id === client) ? client : clients[0]?.id;
  const whatsappConnected = !!(process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN);

  return (
    <div className="px-4 sm:px-8 py-5 sm:py-7">
      <h1 className="text-lg sm:text-[22px] font-medium mb-1">IA negociando</h1>
      <p className="text-xs sm:text-[13px] text-muted mb-4 sm:mb-6">Simule respostas do cliente e veja o raciocinio da IA. Se o cliente recusar tudo, ela aciona o responsavel.</p>
      <NegotiationWorkspace
        initialClients={clients}
        initialSelectedId={selectedId}
        responsibleName={rules.responsibleName}
        whatsappConnected={whatsappConnected}
      />
    </div>
  );
}
