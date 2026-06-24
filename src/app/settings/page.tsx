import { getRules } from "@/lib/db";
import RulesForm from "@/components/RulesForm";
import WhatsAppTest from "@/components/WhatsAppTest";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const rules = await getRules();
  const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
  const webhookUrl = base ? `${base}/api/webhook/zapi` : "https://SEU-SITE/api/webhook/zapi";

  return (
    <div className="px-4 sm:px-8 py-5 sm:py-7">
      <h1 className="text-lg sm:text-[22px] font-medium mb-1">Regras da empresa</h1>
      <p className="text-xs sm:text-[13px] text-muted mb-5 sm:mb-6">Configure o responsavel e os limites que a IA respeita ao negociar.</p>

      <div className="card p-4 sm:p-5 mb-5 max-w-xl">
        <div className="text-[14px] font-medium mb-1">Conectar o WhatsApp (mensagens reais)</div>
        <p className="text-[11px] text-faint mb-3 leading-relaxed">
          Para os clientes reais conversarem com a IA, cole o endereco abaixo no painel da Z-API,
          na opcao <b>Ao receber</b> (webhook de mensagem recebida).
        </p>
        <code className="block text-[12px] bg-surface2 rounded-lg px-3 py-2 break-all text-brand select-all">{webhookUrl}</code>
        {!base && (
          <p className="text-[11px] text-warning mt-2 leading-relaxed">
            Rodando no seu PC? O localhost nao funciona como webhook. Use o <b>ngrok</b> para criar um
            endereco publico e troque &quot;SEU-SITE&quot; por ele (passo a passo no guia).
          </p>
        )}
        <WhatsAppTest />
      </div>

      <RulesForm initial={rules} />
    </div>
  );
}
