"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EstadoBadge } from "./EstadoBadge";
import { ResultadoMatching } from "./ResultadoMatching";
import {
  CULTIVOS_SUGERIDOS,
  ETIQUETA_SERVICIO,
} from "@/lib/marketplace/labels";
import type { ResultadoMatching as Resultado } from "@/lib/marketplace/matching";
import type {
  Pais,
  Productor,
  Region,
  Servicio,
  Solicitud,
} from "@/lib/marketplace/types";
import { SERVICIOS } from "@/lib/marketplace/types";

interface Props {
  paises: Pais[];
  regiones: Region[];
  productores: Productor[];
}

function enUnaSemana(): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 7);
  return fecha.toISOString().slice(0, 10);
}

export function FormularioSolicitud({ paises, regiones, productores }: Props) {
  const parametros = useSearchParams();
  const paisInicial = parametros.get("pais") ?? paises[0]?.id ?? "";
  const regionInicial = parametros.get("region") ?? "";

  const [productorId, setProductorId] = useState(
    () =>
      productores.find(
        (p) =>
          p.pais_id === paisInicial &&
          (!regionInicial || p.region_id === regionInicial),
      )?.id ??
      productores[0]?.id ??
      "",
  );
  const [cultivo, setCultivo] = useState("banano");
  const [servicio, setServicio] = useState<Servicio>("fumigacion");
  const [hectareas, setHectareas] = useState("120");
  const [fechaDeseada, setFechaDeseada] = useState(enUnaSemana);
  const [producto, setProducto] = useState("Mancozeb 80% WP");

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [listaEsperaAbierta, setListaEsperaAbierta] = useState(false);

  const productor = productores.find((p) => p.id === productorId);
  const pais = paises.find((p) => p.id === productor?.pais_id);
  const region = regiones.find((r) => r.id === productor?.region_id);

  const regionesDelPais = useMemo(
    () => regiones.filter((r) => r.pais_id === pais?.id),
    [regiones, pais?.id],
  );

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!productor) return;
    setEnviando(true);
    setError("");
    setResultado(null);
    setListaEsperaAbierta(false);

    try {
      const respuesta = await fetch("/api/marketplace/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productor_id: productor.id,
          pais_id: productor.pais_id,
          region_id: productor.region_id,
          cultivo,
          servicio,
          hectareas: Number(hectareas),
          fecha_deseada: fechaDeseada,
          producto_a_aplicar: producto,
        }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.error ?? "No se pudo procesar.");
      setResultado(datos.resultado as Resultado);
      setSolicitud(datos.solicitud as Solicitud);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <form onSubmit={enviar} className="mkt-card h-fit p-5">
        <h1 className="text-xl font-bold text-slate-900">Solicitar servicio</h1>
        <p className="mt-1 text-xs text-slate-500">
          El motor de cumplimiento valida la zona y la normativa antes de
          mostrarte operadores.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mkt-label" htmlFor="productor">
              Productor
            </label>
            <select
              id="productor"
              value={productorId}
              onChange={(e) => setProductorId(e.target.value)}
              className="mkt-campo"
            >
              {productores.map((p) => {
                const r = regiones.find((x) => x.id === p.region_id);
                const pa = paises.find((x) => x.id === p.pais_id);
                return (
                  <option key={p.id} value={p.id}>
                    {p.nombre} — {r?.nombre}, {pa?.nombre}
                  </option>
                );
              })}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Sin autenticación todavía: elegí un productor de prueba. Su
              ubicación define el orden por cercanía.
            </p>
          </div>

          {pais && region && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <span className="font-semibold">
                {region.nombre}, {pais.nombre}
              </span>
              <EstadoBadge estado={pais.estado} />
              <EstadoBadge estado={region.estado} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mkt-label" htmlFor="cultivo">
                Cultivo
              </label>
              <input
                id="cultivo"
                list="cultivos"
                value={cultivo}
                onChange={(e) => setCultivo(e.target.value)}
                required
                className="mkt-campo"
              />
              <datalist id="cultivos">
                {CULTIVOS_SUGERIDOS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="mkt-label" htmlFor="servicio">
                Servicio
              </label>
              <select
                id="servicio"
                value={servicio}
                onChange={(e) => setServicio(e.target.value as Servicio)}
                className="mkt-campo"
              >
                {SERVICIOS.map((s) => (
                  <option key={s} value={s}>
                    {ETIQUETA_SERVICIO[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mkt-label" htmlFor="hectareas">
                Hectáreas
              </label>
              <input
                id="hectareas"
                type="number"
                min={1}
                step="0.1"
                value={hectareas}
                onChange={(e) => setHectareas(e.target.value)}
                required
                className="mkt-campo"
              />
            </div>
            <div>
              <label className="mkt-label" htmlFor="fecha">
                Fecha deseada
              </label>
              <input
                id="fecha"
                type="date"
                value={fechaDeseada}
                onChange={(e) => setFechaDeseada(e.target.value)}
                required
                className="mkt-campo"
              />
            </div>
          </div>

          <div>
            <label className="mkt-label" htmlFor="producto">
              Producto a aplicar
            </label>
            <input
              id="producto"
              value={producto}
              onChange={(e) => setProducto(e.target.value)}
              placeholder="Ej. Mancozeb 80% WP"
              className="mkt-campo"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-800">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando || !productor}
          className="mkt-btn-primario mt-5 w-full"
        >
          {enviando ? "Evaluando normativa…" : "Buscar operadores"}
        </button>
      </form>

      <div className="space-y-4">
        {!resultado && (
          <div className="mkt-card border-dashed p-8 text-center text-sm text-slate-500">
            Completá el formulario para correr el motor de cumplimiento.
          </div>
        )}

        {solicitud && (
          <p className="text-xs text-slate-400">
            Solicitud registrada: <code>{solicitud.id}</code> · estado{" "}
            <strong>{solicitud.estado}</strong>
          </p>
        )}

        {resultado && pais && region && (
          <ResultadoMatching
            resultado={resultado}
            pais={pais}
            region={region}
            regionesDelPais={regionesDelPais}
            mostrarListaEspera={listaEsperaAbierta}
            onAbrirListaEspera={() => setListaEsperaAbierta(true)}
            onCerrarListaEspera={() => setListaEsperaAbierta(false)}
          />
        )}
      </div>
    </div>
  );
}
