import type { Metadata } from "next";
import "./tailwind.css";
import { NavMarketplace } from "@/components/marketplace/NavMarketplace";

export const metadata: Metadata = {
  title: "Helikon Drones — marketplace de servicios con dron agrícola",
  description:
    "Conecta productores con operadores de dron certificados. Cada transacción " +
    "pasa por el motor de cumplimiento normativo del país y la región.",
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mkt">
      <NavMarketplace />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-xs text-slate-400">
        MVP — sin pagos, notificaciones ni chat. Las transacciones sólo se
        habilitan donde la normativa fue verificada.
      </footer>
    </div>
  );
}
