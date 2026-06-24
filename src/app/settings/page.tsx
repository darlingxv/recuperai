import { getRules } from "@/lib/db";
import { whatsappProvider } from "@/lib/whatsapp";
import RulesForm from "@/components/RulesForm";
import WhatsAppTest from "@/components/WhatsAppTest";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const rules = await getRules();
  const provider = whatsappProvider();
  const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
  const path = provider === "evolution" ? "/api/webhook/evolution" : "/api/webhook/zapi";
  const webhookUrl = base ? `${base}${path}` : `https://SEU-ENDERECO${path}`;
  const provLabel = provider === "evolution" ? "Evolution API" : provider === "zapi" ? "Z-API" : "nenhum (modo log)";

  return (
    <div className="px-4 sm:px-8 py-5 sm:py-7">
      <h1 className="text-lg sm:text-[22px] font-medium mb-1">Regras da empresa</h1>
      <p className="text-xs sm:text-[13px] text-muted mb-5 sm:mb-6">Configure o responsavel e os limites que a IA respeita ao negociar.</p>

      <div className="card p-4 sm:p-5 mb-5 max-w-xl">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="text-[14px] font-medium">Conectar o WhatsApp</div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface2 text-muted">Provedor: {provLabel}</span>
        </div>
        <p className="text-[11px] text-faint mb-3 leading-relaxed">
          Para os clientes reais conversarem com a IA, cole o endereco abaixo no painel do seu provedor
          {provider === "evolution" ? " (evento MESSAGES_UPSERT)" : " (opcao 'Ao receber')"}.
        </p>
        <code className="block text-[12px] bg-surface2 rounded-lg px-3 py-2 break-all text-brand select-all">{webhookUrl}</code>
        {!base && (
          <p className="text-[11px] text-warning mt-2 leading-relaxed">
            Rodando no seu PC? O localhost nao funciona como webhook de fora. Se a Evolution roda no mesmo
            PC/Docker, use <b>http://host.docker.internal:3000{path}</b>. Caso contrario, use o <b>ngrok</b>.
          </p>
        )}
        <WhatsAppTest />
      </div>

      <RulesForm initial={rules} />
    </div>
  );
}
