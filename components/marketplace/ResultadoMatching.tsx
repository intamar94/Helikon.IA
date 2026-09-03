"use client";

import { EstadoBadge } from "./EstadoBadge";
import { FormularioListaEspera } from "./FormularioListaEspera";
import {
  CLASES_MODALIDAD,
  ETIQUETA_MODALIDAD,
  ETIQUETA_SERVICIO,
  formatearHoras,
  formatearUSD,
  pluralizar,
  UNIDAD_PRECIO,
} from "@/lib/marketplace/labels";
import type { ResultadoMatching as Resultado } from "@/lib/marketplace/matching";
import type { Modalidad, Pais, Region } from "@/lib/marketplace/types";

interface Props {
  resultado: Resultado;
  pais: Pais;
  region: Region;
  regionesDelPais: Region[];
  mostrarListaEspera: boolean;
  onAbrirListaEspera: () => void;
  onCerrarListaEspera: () => void;
  /** Reserva del anuncio. Ausente cuando la vista es de sólo lectura. */
  onReservar?: (anuncioId: string) => void;
  reservando?: string | null;
  anuncioReservado?: string | null;
  onCambiarModalidad?: (modalidad: Modalidad) => void;
}

export function ResultadoMatching({
  resultado,
  pais,
  region,
  regionesDelPais,
  mostrarListaEspera,
  onAbrirListaEspera,
  onCerrarListaEspera,
  onReservar,
  reservando = null,
  anuncioReservado = null,
  onCambiarModalidad,
}: Props) {
  if (resultado.estado === "rechazada") {
    return (
      <section className="mkt-card border-amber-200 bg-amber-50/60 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="mkt-chip bg-amber-100 text-amber-900 ring-amber-600/30">
            Solicitud rechazada
          </span>
          <code className="text-xs text-amber-800">{resultado.motivo}</code>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-amber-950">
          {resultado.mensaje}
        </p>

        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <dt className="font-semibold uppercase tracking-wide">País</dt>
            <dd className="flex items-center gap-2">
              {pais.nombre} <EstadoBadge estado={pais.estado} />
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="font-semibold uppercase tracking-wide">Región</dt>
            <dd className="flex items-center gap-2">
              {region.nombre} <EstadoBadge estado={region.estado} />
            </dd>
          </div>
        </dl>

        {resultado.regla_aplicada && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-white p-3 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">
              Regla encontrada: <code>{resultado.regla_aplicada.id}</code>
            </p>
            <p className="mt-1">
              Exige «{resultado.regla_aplicada.certificacion_requerida}» ·
              producto permitido: {resultado.regla_aplicada.producto_permitido}
            </p>
            <p className="mt-1 font-medium text-amber-800">
              Verificada: {resultado.regla_aplicada.verificada ? "sí" : "no"}
            </p>
          </div>
        )}

        {resultado.sugerir_modalidad && onCambiarModalidad && (
          <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-3">
            <p className="text-xs text-sky-900">
              Esta zona sí está habilitada. El mismo trabajo se puede pedir{" "}
              <strong>{ETIQUETA_MODALIDAD[resultado.sugerir_modalidad].toLowerCase()}</strong>.
            </p>
            <button
              type="button"
              onClick={() => onCambiarModalidad(resultado.sugerir_modalidad!)}
              className="mkt-btn-primario mt-3"
            >
              Buscar {ETIQUETA_MODALIDAD[resultado.sugerir_modalidad].toLowerCase()}
            </button>
          </div>
        )}

        {resultado.ofrecer_lista_espera && (
          <div className="mt-5">
            {mostrarListaEspera ? (
              <FormularioListaEspera
                pais={pais}
                regiones={regionesDelPais}
                regionInicial={region.id}
                onCerrar={onCerrarListaEspera}
              />
            ) : (
              <button
                type="button"
                onClick={onAbrirListaEspera}
                className="mkt-btn-primario"
              >
                Avisarme cuando se habilite
              </button>
            )}
          </div>
        )}
      </section>
    );
  }

  const { regla_resuelta: resuelta } = resultado;

  return (
    <section className="space-y-5">
      <div className="mkt-card border-emerald-200 bg-emerald-50/60 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="mkt-chip bg-emerald-100 text-emerald-800 ring-emerald-600/30">
            Zona habilitada
          </span>
          <span className="text-sm text-emerald-900">{resultado.mensaje}</span>
        </div>

        <div className="mt-4 rounded-lg border border-emerald-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Regla de cumplimiento aplicada
            </h3>
            <span
              className={`mkt-chip ${
                resuelta.especificidad === "regional"
                  ? "bg-indigo-100 text-indigo-800 ring-indigo-600/30"
                  : "bg-slate-200 text-slate-700 ring-slate-500/30"
              }`}
            >
              {resuelta.especificidad === "regional"
                ? "Regla regional"
                : "Regla nacional"}
            </span>
          </div>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
            <div>
              <dt className="font-semibold uppercase tracking-wide text-slate-500">
                Certificación requerida
              </dt>
              <dd className="text-slate-800">
                {resuelta.regla.certificacion_requerida}
              </dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-wide text-slate-500">
                Producto permitido
              </dt>
              <dd className="text-slate-800">
                {resuelta.regla.producto_permitido}
              </dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-wide text-slate-500">
                Verificada por
              </dt>
              <dd className="text-slate-800">
                {resuelta.regla.verificada_por} ·{" "}
                {resuelta.regla.fecha_verificacion}
              </dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-wide text-slate-500">
                Identificador
              </dt>
              <dd>
                <code className="text-slate-800">{resuelta.regla.id}</code>
              </dd>
            </div>
          </dl>

          {resuelta.desplazada && (
            <p className="mt-3 rounded-md border border-indigo-200 bg-indigo-50 p-2.5 text-xs text-indigo-900">
              <strong>Jerarquía aplicada:</strong> esta regla regional pisó a la
              regla nacional <code>{resuelta.desplazada.id}</code>, que exigía «
              {resuelta.desplazada.certificacion_requerida}» y permitía{" "}
              {resuelta.desplazada.producto_permitido}.
            </p>
          )}
        </div>

        <p className="mt-3 text-xs text-emerald-900/80">
          Embudo: {resultado.traza.operadores_evaluados} operadores verificados
          → {resultado.traza.operadores_con_certificacion} habilitados por la
          certificación{" "}
          {resultado.traza.titular_exigido === "productor"
            ? "(en alquiler la licencia es tuya, así que valen todos)"
            : "del operador"}{" "}
          → {resultado.traza.anuncios_disponibles} anuncios con el servicio.
        </p>
      </div>

      <ol className="space-y-3">
        {resultado.opciones.map((opcion, indice) => (
          <li key={opcion.anuncio.id} className="mkt-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-400">
                  Opción {indice + 1}
                </p>
                <h3 className="text-lg font-bold text-slate-900">
                  {opcion.operador.nombre}
                </h3>
                <p className="text-sm text-slate-600">
                  {opcion.dron.modelo}
                  {opcion.dron.capacidad_carga_litros > 0
                    ? ` · ${opcion.dron.capacidad_carga_litros} L`
                    : ""}{" "}
                  · {opcion.dron.hectareas_por_hora} ha/h
                </p>
                <span
                  className={`mkt-chip mt-2 ${CLASES_MODALIDAD[opcion.modalidad]}`}
                >
                  {ETIQUETA_MODALIDAD[opcion.modalidad]}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-slate-900">
                  {formatearUSD(opcion.precio_estimado_total_usd)}
                </p>
                <p className="text-xs text-slate-500">
                  {opcion.modalidad === "alquiler"
                    ? `${pluralizar(
                        opcion.dias_alquiler ?? 1,
                        "jornada",
                        "jornadas",
                      )} · ${formatearUSD(
                        opcion.anuncio.precio_dia_usd ?? 0,
                      )} ${UNIDAD_PRECIO.alquiler}`
                    : `${formatearUSD(
                        opcion.precio_estimado_hectarea_usd,
                      )} por hectárea`}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="font-semibold uppercase tracking-wide text-slate-500">
                  Rating
                </p>
                <p className="text-sm text-slate-800">
                  ★ {opcion.operador.rating.toFixed(1)}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="font-semibold uppercase tracking-wide text-slate-500">
                  Distancia
                </p>
                <p className="text-sm text-slate-800">
                  {opcion.distancia_km} km
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="font-semibold uppercase tracking-wide text-slate-500">
                  Tiempo estimado
                </p>
                <p className="text-sm text-slate-800">
                  {formatearHoras(opcion.tiempo_estimado_horas)}
                </p>
                <p className="text-slate-500">
                  vuelo {formatearHoras(opcion.horas_vuelo)} + traslado{" "}
                  {formatearHoras(opcion.horas_traslado)}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs">
              <p className="font-semibold uppercase tracking-wide text-slate-500">
                Certificación que respalda la habilitación ·{" "}
                {opcion.titular_certificacion === "productor"
                  ? "tuya"
                  : "del operador"}
              </p>
              <p className="mt-1 text-slate-800">
                {opcion.certificacion.tipo_certificacion} · Nº{" "}
                {opcion.certificacion.numero} · vigente hasta{" "}
                {opcion.certificacion.vigente_hasta}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Servicios del anuncio:{" "}
                {opcion.anuncio.servicios_ofrecidos
                  .map((s) => ETIQUETA_SERVICIO[s])
                  .join(" · ")}
              </p>
              {onReservar &&
                (anuncioReservado === opcion.anuncio.id ? (
                  <span className="mkt-chip bg-emerald-100 text-emerald-800 ring-emerald-600/30">
                    Reservado
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={reservando !== null || anuncioReservado !== null}
                    onClick={() => onReservar(opcion.anuncio.id)}
                    className="mkt-btn-primario"
                  >
                    {reservando === opcion.anuncio.id
                      ? "Reservando…"
                      : "Reservar"}
                  </button>
                ))}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
