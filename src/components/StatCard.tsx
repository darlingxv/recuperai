export default function StatCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "success" | "danger";
}) {
  const subColor =
    tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-faint";
  return (
    <div className="bg-surface2 rounded-lg px-4 py-3.5">
      <div className="text-[11px] text-muted mb-1.5">{label}</div>
      <div className="text-xl font-medium text-ink">{value}</div>
      {sub && <div className={`text-[11px] mt-1 ${subColor}`}>{sub}</div>}
    </div>
  );
}
