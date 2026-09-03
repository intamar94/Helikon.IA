import Link from "next/link";

const ENLACES = [
  { href: "/marketplace", texto: "Cobertura" },
  { href: "/marketplace/solicitar", texto: "Solicitar servicio" },
  { href: "/marketplace/operadores/alta", texto: "Soy operador" },
  { href: "/marketplace/demo", texto: "Demo" },
  { href: "/marketplace/admin", texto: "Admin" },
];

export function NavMarketplace() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/marketplace" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-campo-600 text-sm text-white">
            ◈
          </span>
          <span className="text-sm font-bold tracking-tight text-slate-900">
            Helikon Drones
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600">
          {ENLACES.map((e) => (
            <Link key={e.href} href={e.href} className="hover:text-campo-700">
              {e.texto}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
