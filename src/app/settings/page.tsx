import { getRules } from "@/lib/db";
import RulesForm from "@/components/RulesForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const rules = await getRules();
  return (
    <div className="px-4 sm:px-8 py-5 sm:py-7">
      <h1 className="text-lg sm:text-[22px] font-medium mb-1">Regras da empresa</h1>
      <p className="text-xs sm:text-[13px] text-muted mb-5 sm:mb-6">Configure o responsavel e os limites que a IA respeita ao negociar.</p>
      <RulesForm initial={rules} />
    </div>
  );
}
