"use client";

import { useState } from "react";
import { EstadoBadge } from "./EstadoBadge";
import {
  DESCRIPCION_MODALIDAD,
  ETIQUETA_MODALIDAD,
  ETIQUETA_SERVICIO,
} from "@/lib/marketplace/labels";
import type { Modalidad, Pais, Servicio } from "@/lib/marketplace/types";
import { MODALIDADES, SERVICIOS } from "@/lib/marketplace/types";

interface CertificacionForm {
  pais_id: string;
  tipo_certificacion: string;
  numero: string;
  vigente_hasta: string;
  documento_url: string;
}

interface AnuncioForm {
  modalidad: Modalidad;
  activo: boolean;
  servicios_ofrecidos: Servicio[];
  precio: string;
}

interface DronForm {
  modelo: string;
  capacidad_carga_litros: string;
  hectareas_por_hora: string;
  anuncios: AnuncioForm[];
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
  hectareas_por_hora: "15",
  anuncios: [
    {
      modalidad: "con_piloto",
      activo: true,
      servicios_ofrecidos: ["fumigacion"],
      precio: "12",
    },
    {
      modalidad: "alquiler",
      activo: false,
      servicios_ofrecidos: ["fumigacion"],
      precio: "420",
    },
  ],
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

  function actualizarAnuncio(
    dron: number,
    modalidad: Modalidad,
    cambios: Partial<AnuncioForm>,
  ) {
    setDrones((previos) =>
      previos.map((d, i) =>
        i === dron
          ? {
              ...d,
              anuncios: d.anuncios.map((a) =>
                a.modalidad === modalidad ? { ...a, ...cambios } : a,
              ),
            }
          : d,
      ),
    );
  }

  function alternarServicio(
    dron: number,
    modalidad: Modalidad,
    servicio: Servicio,
  ) {
    setDrones((previos) =>
      previos.map((d, i) => {
        if (i !== dron) return d;
        return {
          ...d,
          anuncios: d.anuncios.map((a) => {
            if (a.modalidad !== modalidad) return a;
            const incluido = a.servicios_ofrecidos.includes(servicio);
            return {
              ...a,
              servicios_ofrecidos: incluido
                ? a.servicios_ofrecidos.filter((s) => s !== servicio)
                : [...a.servicios_ofrecidos, servicio],
            };
          }),
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
            hectareas_por_hora: Number(d.hectareas_por_hora),
            anuncios: d.anuncios
              .filter((a) => a.activo)
              .map((a) => ({
                modalidad: a.modalidad,
                servicios_ofrecidos: a.servicios_ofrecidos,
                precio_hectarea_usd:
                  a.modalidad === "con_piloto" ? Number(a.precio) : null,
                precio_dia_usd:
                  a.modalidad === "alquiler" ? Number(a.precio) : null,
                horas_por_jornada: 6,
              })),
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
          Cargá tus certificaciones por país y decidí cómo publicás cada dron.
          En los anuncios <strong>con piloto</strong> la licencia la ponés vos,
          así que sin la certificación que pide la regla no te proponemos. En{" "}
          <strong>alquiler</strong> vuela el cliente: ahí la licencia la tiene
          que poner él, y tu equipo aparece igual.
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
              </div>

              <div className="mt-4 space-y-3">
                <p className="mkt-label">Cómo lo publicás</p>
                {dron.anuncios.map((anuncio) => (
                  <div
                    key={anuncio.modalidad}
                    className={`rounded-lg border p-3 ${
                      anuncio.activo
                        ? "border-campo-300 bg-white"
                        : "border-slate-200 bg-white/50"
                    }`}
                  >
                    <label className="flex cursor-pointer items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={anuncio.activo}
                        onChange={(e) =>
                          actualizarAnuncio(indice, anuncio.modalidad, {
                            activo: e.target.checked,
                          })
                        }
                        className="mt-1"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-slate-800">
                          {ETIQUETA_MODALIDAD[anuncio.modalidad]}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {DESCRIPCION_MODALIDAD[anuncio.modalidad]}
                        </span>
                      </span>
                    </label>

                    {anuncio.activo && (
                      <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                        <div>
                          <label className="mkt-label">
                            {anuncio.modalidad === "alquiler"
                              ? "Precio USD por jornada de 6 h"
                              : "Precio USD por hectárea"}
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={anuncio.precio}
                            onChange={(e) =>
                              actualizarAnuncio(indice, anuncio.modalidad, {
                                precio: e.target.value,
                              })
                            }
                            required
                            className="mkt-campo"
                          />
                        </div>
                        <fieldset>
                          <legend className="mkt-label">
                            Servicios de este anuncio
                          </legend>
                          <div className="flex flex-wrap gap-2">
                            {SERVICIOS.map((s) => {
                              const on = anuncio.servicios_ofrecidos.includes(s);
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() =>
                                    alternarServicio(
                                      indice,
                                      anuncio.modalidad,
                                      s,
                                    )
                                  }
                                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
                                    on
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
                      </div>
                    )}
                  </div>
                ))}
              </div>

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
