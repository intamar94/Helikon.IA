"use client";

import { useState } from "react";
import { EstadoBadge } from "./EstadoBadge";
import { ETIQUETA_ESTADO } from "@/lib/marketplace/labels";
import { paisPuedeActivarse } from "@/lib/marketplace/compliance";
import type {
  EstadoGeografico,
  Pais,
  Region,
  ReglaCumplimiento,
} from "@/lib/marketplace/types";
import { ESTADOS_GEOGRAFICOS } from "@/lib/marketplace/types";

interface Props {
  paises: Pais[];
  regiones: Region[];
  reglas: ReglaCumplimiento[];
  onCambio: (mensaje: string, esError?: boolean) => void;
}

export function AdminGeografia({ paises, regiones, reglas, onCambio }: Props) {
  const [ocupado, setOcupado] = useState(false);

  async function cambiar(
    tipo: "paises" | "regiones",
    id: string,
    estado: EstadoGeografico,
  ) {
    setOcupado(true);
    try {
      const respuesta = await fetch(`/api/marketplace/admin/${tipo}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.error ?? "Falló la operación.");
      onCambio(`Estado actualizado a «${ETIQUETA_ESTADO[estado]}».`);
    } catch (e) {
      onCambio(e instanceof Error ? e.message : "Error", true);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-slate-100 p-3 text-xs text-slate-600">
        Validación activa: un país sólo puede pasar a <strong>Activo</strong> si
        tiene al menos una regla de cumplimiento activa y verificada. Una región
        puede activarse con su país en <strong>En revisión</strong>, pero no si
        el país todavía está en <strong>Mapeado</strong>.
      </p>

      {paises.map((pais) => {
        const habilitable = paisPuedeActivarse(reglas, pais.id);
        return (
          <section key={pais.id} className="mkt-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-slate-900">
                  {pais.nombre}
                </h3>
                <EstadoBadge estado={pais.estado} />
              </div>
              <div className="flex items-center gap-2">
                {ESTADOS_GEOGRAFICOS.map((estado) => {
                  const bloqueado =
                    estado === "activo" && !habilitable && pais.estado !== "activo";
                  return (
                    <button
                      key={estado}
                      type="button"
                      disabled={ocupado || pais.estado === estado || bloqueado}
                      title={
                        bloqueado
                          ? "Necesita al menos una regla verificada"
                          : undefined
                      }
                      onClick={() => cambiar("paises", pais.id, estado)}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                        pais.estado === estado
                          ? "bg-slate-900 text-white ring-slate-900"
                          : "bg-white text-slate-600 ring-slate-300 hover:bg-slate-50 disabled:opacity-40"
                      }`}
                    >
                      {ETIQUETA_ESTADO[estado]}
                    </button>
                  );
                })}
              </div>
            </div>

            {!habilitable && (
              <p className="mt-2 text-xs font-medium text-amber-700">
                Sin reglas verificadas: no se puede activar todavía.
              </p>
            )}

            <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
              {regiones
                .filter((r) => r.pais_id === pais.id)
                .map((region) => (
                  <li
                    key={region.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-700">
                        {region.nombre}
                      </span>
                      <EstadoBadge estado={region.estado} />
                    </div>
                    <div className="flex items-center gap-2">
                      {ESTADOS_GEOGRAFICOS.map((estado) => (
                        <button
                          key={estado}
                          type="button"
                          disabled={ocupado || region.estado === estado}
                          onClick={() => cambiar("regiones", region.id, estado)}
                          className={`rounded-md px-2 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                            region.estado === estado
                              ? "bg-slate-900 text-white ring-slate-900"
                              : "bg-white text-slate-600 ring-slate-300 hover:bg-slate-50 disabled:opacity-40"
                          }`}
                        >
                          {ETIQUETA_ESTADO[estado]}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
