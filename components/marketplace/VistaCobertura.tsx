"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EstadoBadge } from "./EstadoBadge";
import { FormularioListaEspera } from "./FormularioListaEspera";
import { ctaPorEstado, ETIQUETA_ESTADO } from "@/lib/marketplace/labels";
import type {
  EstadoGeografico,
  Pais,
  Region,
  ReglaCumplimiento,
} from "@/lib/marketplace/types";

interface Props {
  paises: Pais[];
  regiones: Region[];
  reglas: ReglaCumplimiento[];
}

const ORDEN: Record<EstadoGeografico, number> = {
  activo: 0,
  en_revision: 1,
  mapeado: 2,
};

export function VistaCobertura({ paises, regiones, reglas }: Props) {
  const [filtro, setFiltro] = useState<EstadoGeografico | "todos">("todos");
  const [listaEsperaPara, setListaEsperaPara] = useState<{
    paisId: string;
    regionId: string | null;
  } | null>(null);

  const ordenados = useMemo(
    () =>
      [...paises].sort(
        (a, b) =>
          ORDEN[a.estado] - ORDEN[b.estado] || a.nombre.localeCompare(b.nombre),
      ),
    [paises],
  );

  const visibles = ordenados.filter(
    (p) => filtro === "todos" || p.estado === filtro,
  );

  const conteo = (estado: EstadoGeografico) =>
    paises.filter((p) => p.estado === estado).length;

  return (
    <div>
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Cobertura normativa
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          Mapeamos todos los países desde el arranque, pero solo habilitamos
          transacciones donde la normativa de aplicación con dron ya fue
          verificada. Una región puede operar antes que su país si su normativa
          específica ya está confirmada.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {(["todos", "activo", "en_revision", "mapeado"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors ${
                filtro === f
                  ? "bg-slate-900 text-white ring-slate-900"
                  : "bg-white text-slate-600 ring-slate-300 hover:bg-slate-50"
              }`}
            >
              {f === "todos"
                ? `Todos (${paises.length})`
                : `${ETIQUETA_ESTADO[f]} (${conteo(f)})`}
            </button>
          ))}
        </div>
      </section>

      <ul className="grid gap-4 lg:grid-cols-2">
        {visibles.map((pais) => {
          const regionesPais = regiones.filter((r) => r.pais_id === pais.id);
          const reglasPais = reglas.filter((r) => r.pais_id === pais.id);
          const verificadas = reglasPais.filter(
            (r) => r.verificada && r.activa,
          ).length;
          const abierta = listaEsperaPara?.paisId === pais.id;

          return (
            <li key={pais.id} className="mkt-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {pais.nombre}{" "}
                    <span className="text-sm font-medium text-slate-400">
                      {pais.codigo_iso}
                    </span>
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {reglasPais.length} regla(s) cargadas · {verificadas}{" "}
                    verificada(s)
                    {pais.fecha_activacion
                      ? ` · activo desde ${pais.fecha_activacion}`
                      : ""}
                  </p>
                </div>
                <EstadoBadge estado={pais.estado} />
              </div>

              <ul className="mt-4 divide-y divide-slate-100 border-y border-slate-100">
                {regionesPais.map((region) => (
                  <li
                    key={region.id}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <span className="text-sm text-slate-700">
                      {region.nombre}
                    </span>
                    <div className="flex items-center gap-2">
                      <EstadoBadge estado={region.estado} />
                      {region.estado === "activo" && pais.estado !== "mapeado" ? (
                        <Link
                          href={`/marketplace/solicitar?pais=${pais.id}&region=${region.id}`}
                          className="text-xs font-semibold text-campo-700 underline underline-offset-2"
                        >
                          Solicitar
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setListaEsperaPara({
                              paisId: pais.id,
                              regionId: region.id,
                            })
                          }
                          className="text-xs font-semibold text-slate-500 underline underline-offset-2 hover:text-slate-800"
                        >
                          Notificarme
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-4">
                {pais.estado === "activo" ? (
                  <Link
                    href={`/marketplace/solicitar?pais=${pais.id}`}
                    className="mkt-btn-primario w-full"
                  >
                    {ctaPorEstado(pais.estado)}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setListaEsperaPara(
                        abierta ? null : { paisId: pais.id, regionId: null },
                      )
                    }
                    className="mkt-btn-secundario w-full"
                  >
                    {ctaPorEstado(pais.estado)}
                  </button>
                )}
              </div>

              {abierta && (
                <div className="mt-4">
                  <FormularioListaEspera
                    pais={pais}
                    regiones={regionesPais}
                    regionInicial={listaEsperaPara?.regionId ?? null}
                    onCerrar={() => setListaEsperaPara(null)}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
