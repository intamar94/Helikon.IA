"use client";

import { useState } from "react";
import { ETIQUETA_SERVICIO } from "@/lib/marketplace/labels";
import type {
  CertificacionOperador,
  Dron,
  Operador,
  Pais,
} from "@/lib/marketplace/types";

interface Props {
  operadores: Operador[];
  certificaciones: CertificacionOperador[];
  drones: Dron[];
  paises: Pais[];
  onCambio: (mensaje: string, esError?: boolean) => void;
}

export function AdminOperadores({
  operadores,
  certificaciones,
  drones,
  paises,
  onCambio,
}: Props) {
  const [ocupado, setOcupado] = useState(false);
  const hoy = new Date().toISOString().slice(0, 10);

  async function patch(url: string, cuerpo: unknown, mensaje: string) {
    setOcupado(true);
    try {
      const respuesta = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.error ?? "Falló la operación.");
      onCambio(mensaje);
    } catch (e) {
      onCambio(e instanceof Error ? e.message : "Error", true);
    } finally {
      setOcupado(false);
    }
  }

  const nombrePais = (id: string) =>
    paises.find((p) => p.id === id)?.nombre ?? id;

  return (
    <div className="space-y-4">
      {operadores.map((operador) => {
        const certs = certificaciones.filter(
          (c) => c.operador_id === operador.id,
        );
        const flota = drones.filter((d) => d.operador_id === operador.id);

        return (
          <section key={operador.id} className="mkt-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {operador.nombre}
                </h3>
                <p className="text-xs text-slate-500">
                  {operador.email} · base en {nombrePais(operador.pais_base_id)}{" "}
                  · ★ {operador.rating.toFixed(1)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`mkt-chip ${
                    operador.verificado
                      ? "bg-emerald-100 text-emerald-800 ring-emerald-600/30"
                      : "bg-slate-200 text-slate-700 ring-slate-500/30"
                  }`}
                >
                  {operador.verificado ? "Verificado" : "Sin verificar"}
                </span>
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() =>
                    patch(
                      `/api/marketplace/admin/operadores/${operador.id}`,
                      { verificado: !operador.verificado },
                      operador.verificado
                        ? "Operador desverificado."
                        : "Operador verificado: ya puede aparecer en resultados.",
                    )
                  }
                  className="mkt-btn-secundario"
                >
                  {operador.verificado ? "Quitar verificación" : "Verificar"}
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <h4 className="mkt-label">Certificaciones</h4>
                <ul className="space-y-2">
                  {certs.map((cert) => {
                    const vencida = cert.vigente_hasta < hoy;
                    return (
                      <li
                        key={cert.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-800">
                              {cert.tipo_certificacion}
                            </p>
                            <p className="text-slate-500">
                              {nombrePais(cert.pais_id)} · Nº {cert.numero}
                            </p>
                            <p
                              className={
                                vencida
                                  ? "font-semibold text-red-700"
                                  : "text-slate-500"
                              }
                            >
                              {vencida ? "VENCIDA el " : "vigente hasta "}
                              {cert.vigente_hasta}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {cert.documento_url && (
                              <a
                                href={cert.documento_url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-campo-700 underline"
                              >
                                Ver documento
                              </a>
                            )}
                            <button
                              type="button"
                              disabled={ocupado}
                              onClick={() =>
                                patch(
                                  `/api/marketplace/admin/certificaciones/${cert.id}`,
                                  { documento_revisado: !cert.documento_revisado },
                                  cert.documento_revisado
                                    ? "Documento marcado como pendiente."
                                    : "Documento marcado como revisado.",
                                )
                              }
                              className={`rounded-md px-2 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                                cert.documento_revisado
                                  ? "bg-emerald-100 text-emerald-800 ring-emerald-600/30"
                                  : "bg-white text-slate-600 ring-slate-300"
                              }`}
                            >
                              {cert.documento_revisado
                                ? "Documento revisado"
                                : "Marcar revisado"}
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                  {certs.length === 0 && (
                    <li className="text-xs text-slate-400">
                      Sin certificaciones cargadas.
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <h4 className="mkt-label">Flota</h4>
                <ul className="space-y-2">
                  {flota.map((dron) => (
                    <li
                      key={dron.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs"
                    >
                      <p className="font-semibold text-slate-800">
                        {dron.modelo}
                      </p>
                      <p className="text-slate-500">
                        {dron.capacidad_carga_litros} L ·{" "}
                        {dron.hectareas_por_hora} ha/h · USD{" "}
                        {dron.precio_base_hectarea_usd}/ha
                      </p>
                      <p className="mt-1 text-slate-500">
                        {dron.servicios_ofrecidos
                          .map((s) => ETIQUETA_SERVICIO[s])
                          .join(" · ")}
                      </p>
                    </li>
                  ))}
                  {flota.length === 0 && (
                    <li className="text-xs text-slate-400">Sin drones.</li>
                  )}
                </ul>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
