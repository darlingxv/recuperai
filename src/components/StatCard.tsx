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
  const subColor = tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-faint";
  return (
    <div className="bg-surface2 rounded-lg px-3.5 py-3">
      <div className="text-[11px] text-muted mb-1.5 truncate">{label}</div>
      <div className="text-lg sm:text-xl font-medium text-ink truncate">{value}</div>
      {sub && <div className={`text-[11px] mt-1 ${subColor} truncate`}>{sub}</div>}
    </div>
  );
}
