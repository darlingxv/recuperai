import { getRules } from "@/lib/db";
import RulesForm from "@/components/RulesForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const rules = await getRules();
  return (
    <div className="px-8 py-7">
      <h1 className="text-[22px] font-medium mb-1">Regras da empresa</h1>
      <p className="text-[13px] text-muted mb-6">
        Configure os limites que a IA respeita ao negociar com seus clientes.
      </p>
      <RulesForm initial={rules} />
    </div>
  );
}
