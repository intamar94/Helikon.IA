"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminGeografia } from "./AdminGeografia";
import { AdminOperadores } from "./AdminOperadores";
import { AdminReglas } from "./AdminReglas";
import type {
  Anuncio,
  Certificacion,
  Dron,
  ListaEspera,
  Operador,
  Pais,
  Region,
  ReglaCumplimiento,
  Solicitud,
} from "@/lib/marketplace/types";

interface Props {
  paises: Pais[];
  regiones: Region[];
  reglas: ReglaCumplimiento[];
  operadores: Operador[];
  certificaciones: Certificacion[];
  drones: Dron[];
  anuncios: Anuncio[];
  solicitudes: Solicitud[];
  listaEspera: ListaEspera[];
  fuente: string;
}

type Pestana = "reglas" | "geografia" | "operadores" | "demanda";

const PESTANAS: Array<{ id: Pestana; texto: string }> = [
  { id: "reglas", texto: "Reglas de cumplimiento" },
  { id: "geografia", texto: "Países y regiones" },
  { id: "operadores", texto: "Operadores" },
  { id: "demanda", texto: "Demanda" },
];

const VERIFICADOR = "normativa@helikon.ia";

export function PanelAdmin(props: Props) {
  const router = useRouter();
  const [pestana, setPestana] = useState<Pestana>("reglas");
  const [aviso, setAviso] = useState<{ texto: string; error: boolean } | null>(
    null,
  );

  function alCambiar(texto: string, esError = false) {
    setAviso({ texto, error: esError });
    if (!esError) router.refresh();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Panel de operación</h1>
        <p className="mt-1 text-sm text-slate-600">
          La normativa cambia seguido: todo se edita acá, sin tocar código ni
          hacer deploy.{" "}
          <span className="text-slate-400">
            Fuente de datos: <code>{props.fuente}</code>
          </span>
        </p>
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-px">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPestana(p.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold ${
              pestana === p.id
                ? "border-b-2 border-campo-600 text-campo-700"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {p.texto}
          </button>
        ))}
      </nav>

      {aviso && (
        <p
          className={`rounded-lg p-3 text-sm font-medium ${
            aviso.error
              ? "bg-red-50 text-red-800"
              : "bg-emerald-50 text-emerald-900"
          }`}
        >
          {aviso.texto}
        </p>
      )}

      {pestana === "reglas" && (
        <AdminReglas
          paises={props.paises}
          regiones={props.regiones}
          reglas={props.reglas}
          verificador={VERIFICADOR}
          onCambio={alCambiar}
        />
      )}

      {pestana === "geografia" && (
        <AdminGeografia
          paises={props.paises}
          regiones={props.regiones}
          reglas={props.reglas}
          onCambio={alCambiar}
        />
      )}

      {pestana === "operadores" && (
        <AdminOperadores
          operadores={props.operadores}
          certificaciones={props.certificaciones}
          drones={props.drones}
          anuncios={props.anuncios}
          paises={props.paises}
          onCambio={alCambiar}
        />
      )}

      {pestana === "demanda" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="mkt-card p-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Solicitudes ({props.solicitudes.length})
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              {props.solicitudes
                .slice()
                .reverse()
                .map((s) => (
                  <li
                    key={s.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">
                        {s.cultivo} · {s.servicio} · {s.hectareas} ha
                      </span>
                      <span
                        className={`mkt-chip ${
                          s.estado === "rechazada"
                            ? "bg-amber-100 text-amber-900 ring-amber-600/30"
                            : "bg-emerald-100 text-emerald-800 ring-emerald-600/30"
                        }`}
                      >
                        {s.estado}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-500">
                      {s.region_id} · {s.pais_id}
                      {s.motivo_rechazo ? ` · ${s.motivo_rechazo}` : ""}
                    </p>
                  </li>
                ))}
              {props.solicitudes.length === 0 && (
                <li className="text-slate-400">Todavía no hay solicitudes.</li>
              )}
            </ul>
          </section>

          <section className="mkt-card p-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Lista de espera ({props.listaEspera.length})
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Señal de demanda para priorizar qué zona verificar primero.
            </p>
            <ul className="mt-3 space-y-2 text-xs">
              {props.listaEspera
                .slice()
                .reverse()
                .map((l) => (
                  <li
                    key={l.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <span className="font-semibold text-slate-800">
                      {l.email}
                    </span>
                    <p className="text-slate-500">
                      {l.tipo_usuario} · {l.pais_id}
                      {l.region_id ? ` / ${l.region_id}` : ""}
                    </p>
                  </li>
                ))}
              {props.listaEspera.length === 0 && (
                <li className="text-slate-400">Nadie en lista de espera.</li>
              )}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
