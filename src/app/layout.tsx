import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Recuper.ai — Recuperacao de receita com IA",
  description: "Agente financeiro virtual que lembra, negocia e recupera pagamentos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="flex">
          <Sidebar />
          <main className="flex-1 min-h-screen max-w-[1100px]">{children}</main>
        </div>
      </body>
    </html>
  );
}
