"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DemoControls({ isDemo }: { isDemo: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function reset() {
    setLoading(true);
    await fetch("/api/seed", { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      {isDemo ? (
        <span className="text-[11px] text-warning bg-warning/10 px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-warning" />
          Modo demo (IA simulada)
        </span>
      ) : (
        <span className="text-[11px] text-success bg-success/10 px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          Claude conectado
        </span>
      )}
      <button
        onClick={reset}
        disabled={loading}
        className="text-[11px] text-muted hover:text-ink border border-border rounded-lg px-2.5 py-1 transition-colors disabled:opacity-50"
      >
        {loading ? "..." : "Recarregar demo"}
      </button>
    </div>
  );
}
