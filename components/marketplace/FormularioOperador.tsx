"use client";

import { useState } from "react";
import { EstadoBadge } from "./EstadoBadge";
import { ETIQUETA_SERVICIO } from "@/lib/marketplace/labels";
import type { Pais, Servicio } from "@/lib/marketplace/types";
import { SERVICIOS } from "@/lib/marketplace/types";

interface CertificacionForm {
  pais_id: string;
  tipo_certificacion: string;
  numero: string;
  vigente_hasta: string;
  documento_url: string;
}

interface DronForm {
  modelo: string;
  capacidad_carga_litros: string;
  servicios_ofrecidos: Servicio[];
  hectareas_por_hora: string;
  precio_base_hectarea_usd: string;
}

const certVacia = (paisId: string): CertificacionForm => ({
  pais_id: paisId,
  tipo_certificacion: "",
  numero: "",
  vigente_hasta: "",
  documento_url: "",
});

const dronVacio = (): DronForm => ({
  modelo: "",
  capacidad_carga_litros: "40",
  servicios_ofrecidos: ["fumigacion"],
  hectareas_por_hora: "15",
  precio_base_hectarea_usd: "12",
});

export function FormularioOperador({ paises }: { paises: Pais[] }) {
  const paisPorDefecto = paises[0]?.id ?? "";

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [paisBase, setPaisBase] = useState(paisPorDefecto);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [certificaciones, setCertificaciones] = useState<CertificacionForm[]>([
    certVacia(paisPorDefecto),
  ]);
  const [drones, setDrones] = useState<DronForm[]>([dronVacio()]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  function actualizarCert(indice: number, cambios: Partial<CertificacionForm>) {
    setCertificaciones((previas) =>
      previas.map((c, i) => (i === indice ? { ...c, ...cambios } : c)),
    );
  }

  function actualizarDron(indice: number, cambios: Partial<DronForm>) {
    setDrones((previos) =>
      previos.map((d, i) => (i === indice ? { ...d, ...cambios } : d)),
    );
  }

  function alternarServicio(indice: number, servicio: Servicio) {
    setDrones((previos) =>
      previos.map((d, i) => {
        if (i !== indice) return d;
        const incluido = d.servicios_ofrecidos.includes(servicio);
        return {
          ...d,
          servicios_ofrecidos: incluido
            ? d.servicios_ofrecidos.filter((s) => s !== servicio)
            : [...d.servicios_ofrecidos, servicio],
        };
      }),
    );
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError("");
    setExito("");

    try {
      const respuesta = await fetch("/api/marketplace/operadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          pais_base_id: paisBase,
          ubicacion_lat: Number(lat),
          ubicacion_lng: Number(lng),
          certificaciones: certificaciones.map((c) => ({
            ...c,
            documento_url: c.documento_url || null,
          })),
          drones: drones.map((d) => ({
            modelo: d.modelo,
            capacidad_carga_litros: Number(d.capacidad_carga_litros),
            servicios_ofrecidos: d.servicios_ofrecidos,
            hectareas_por_hora: Number(d.hectareas_por_hora),
            precio_base_hectarea_usd: Number(d.precio_base_hectarea_usd),
          })),
        }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.error ?? "No se pudo registrar.");

      setExito(
        `Alta registrada (${datos.operador.id}). Queda pendiente de ` +
          `verificación: hasta que el equipo revise tus documentos no vas a ` +
          `aparecer en los resultados de matching.`,
      );
      setNombre("");
      setEmail("");
      setLat("");
      setLng("");
      setCertificaciones([certVacia(paisBase)]);
      setDrones([dronVacio()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">
          Alta de operador de dron
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Cargá tus certificaciones por país. Cada regla de cumplimiento exige
          una certificación puntual: sin ella no te vamos a proponer para ese
          cultivo y servicio, aunque tu dron sí pueda hacerlo.
        </p>
      </header>

      <section className="mkt-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Datos del operador
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mkt-label" htmlFor="op-nombre">
              Nombre comercial
            </label>
            <input
              id="op-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="mkt-campo"
            />
          </div>
          <div>
            <label className="mkt-label" htmlFor="op-email">
              Email
            </label>
            <input
              id="op-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mkt-campo"
            />
          </div>
          <div>
            <label className="mkt-label" htmlFor="op-pais">
              País base
            </label>
            <select
              id="op-pais"
              value={paisBase}
              onChange={(e) => setPaisBase(e.target.value)}
              className="mkt-campo"
            >
              {paises.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
            <div className="mt-2">
              <EstadoBadge
                estado={
                  paises.find((p) => p.id === paisBase)?.estado ?? "mapeado"
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mkt-label" htmlFor="op-lat">
                Latitud base
              </label>
              <input
                id="op-lat"
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="6.2442"
                required
                className="mkt-campo"
              />
            </div>
            <div>
              <label className="mkt-label" htmlFor="op-lng">
                Longitud base
              </label>
              <input
                id="op-lng"
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="-75.5812"
                required
                className="mkt-campo"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mkt-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Certificaciones por país
          </h2>
          <button
            type="button"
            onClick={() =>
              setCertificaciones((c) => [...c, certVacia(paisBase)])
            }
            className="mkt-btn-secundario"
          >
            + Agregar
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {certificaciones.map((cert, indice) => (
            <div
              key={indice}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mkt-label">País</label>
                  <select
                    value={cert.pais_id}
                    onChange={(e) =>
                      actualizarCert(indice, { pais_id: e.target.value })
                    }
                    className="mkt-campo"
                  >
                    {paises.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mkt-label">Tipo de certificación</label>
                  <input
                    value={cert.tipo_certificacion}
                    onChange={(e) =>
                      actualizarCert(indice, {
                        tipo_certificacion: e.target.value,
                      })
                    }
                    placeholder="Licencia ICA Aplicador Aéreo"
                    required
                    className="mkt-campo"
                  />
                </div>
                <div>
                  <label className="mkt-label">Número</label>
                  <input
                    value={cert.numero}
                    onChange={(e) =>
                      actualizarCert(indice, { numero: e.target.value })
                    }
                    required
                    className="mkt-campo"
                  />
                </div>
                <div>
                  <label className="mkt-label">Vigente hasta</label>
                  <input
                    type="date"
                    value={cert.vigente_hasta}
                    onChange={(e) =>
                      actualizarCert(indice, { vigente_hasta: e.target.value })
                    }
                    required
                    className="mkt-campo"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mkt-label">URL del documento</label>
                  <input
                    type="url"
                    value={cert.documento_url}
                    onChange={(e) =>
                      actualizarCert(indice, { documento_url: e.target.value })
                    }
                    placeholder="https://…"
                    className="mkt-campo"
                  />
                </div>
              </div>
              {certificaciones.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setCertificaciones((c) => c.filter((_, i) => i !== indice))
                  }
                  className="mt-3 text-xs font-semibold text-red-600 underline"
                >
                  Quitar certificación
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mkt-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Flota
          </h2>
          <button
            type="button"
            onClick={() => setDrones((d) => [...d, dronVacio()])}
            className="mkt-btn-secundario"
          >
            + Agregar dron
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {drones.map((dron, indice) => (
            <div
              key={indice}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mkt-label">Modelo</label>
                  <input
                    value={dron.modelo}
                    onChange={(e) =>
                      actualizarDron(indice, { modelo: e.target.value })
                    }
                    placeholder="DJI Agras T40"
                    required
                    className="mkt-campo"
                  />
                </div>
                <div>
                  <label className="mkt-label">Capacidad de carga (L)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={dron.capacidad_carga_litros}
                    onChange={(e) =>
                      actualizarDron(indice, {
                        capacidad_carga_litros: e.target.value,
                      })
                    }
                    className="mkt-campo"
                  />
                </div>
                <div>
                  <label className="mkt-label">Hectáreas por hora</label>
                  <input
                    type="number"
                    min={0.1}
                    step="0.1"
                    value={dron.hectareas_por_hora}
                    onChange={(e) =>
                      actualizarDron(indice, {
                        hectareas_por_hora: e.target.value,
                      })
                    }
                    required
                    className="mkt-campo"
                  />
                </div>
                <div>
                  <label className="mkt-label">Precio base USD/ha</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={dron.precio_base_hectarea_usd}
                    onChange={(e) =>
                      actualizarDron(indice, {
                        precio_base_hectarea_usd: e.target.value,
                      })
                    }
                    className="mkt-campo"
                  />
                </div>
              </div>

              <fieldset className="mt-3">
                <legend className="mkt-label">Servicios que ofrece</legend>
                <div className="flex flex-wrap gap-2">
                  {SERVICIOS.map((s) => {
                    const activo = dron.servicios_ofrecidos.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => alternarServicio(indice, s)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
                          activo
                            ? "bg-campo-600 text-white ring-campo-600"
                            : "bg-white text-slate-600 ring-slate-300"
                        }`}
                      >
                        {ETIQUETA_SERVICIO[s]}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {drones.length > 1 && (
                <button
                  type="button"
                  onClick={() => setDrones((d) => d.filter((_, i) => i !== indice))}
                  className="mt-3 text-xs font-semibold text-red-600 underline"
                >
                  Quitar dron
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
          {error}
        </p>
      )}
      {exito && (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-900">
          {exito}
        </p>
      )}

      <button type="submit" disabled={enviando} className="mkt-btn-primario">
        {enviando ? "Enviando…" : "Registrar operador"}
      </button>
    </form>
  );
}
