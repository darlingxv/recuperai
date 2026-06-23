import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Recuper.ai — Recuperacao de receita com IA",
  description: "Agente financeiro virtual que lembra, negocia e recupera pagamentos.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f1115",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 min-w-0 md:max-w-[1100px] flex flex-col">
            {/* Cabecalho mobile */}
            <header className="md:hidden sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand/15 flex items-center justify-center">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#378add" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
              <span className="font-medium text-[15px]">Recuper<span className="text-brand">.ai</span></span>
              <span className="ml-auto flex items-center gap-1.5 text-[10px] text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />IA ativa
              </span>
            </header>
            <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
          </div>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
