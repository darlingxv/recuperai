import { getClients, getRules } from "@/lib/db";
import NegotiationWorkspace from "@/components/NegotiationWorkspace";
import { aiIsConfigured } from "@/lib/claude";

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
  const aiOn = aiIsConfigured();

  return (
    <div className="px-4 sm:px-8 py-5 sm:py-7">
      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-lg sm:text-[22px] font-medium">IA negociando</h1>
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${aiOn ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
          {aiOn ? "IA real ativa" : "modo demo (sem chave de IA)"}
        </span>
      </div>
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
