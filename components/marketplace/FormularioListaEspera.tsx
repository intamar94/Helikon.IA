"use client";

import { useState } from "react";
import type { Pais, Region, TipoUsuario } from "@/lib/marketplace/types";

interface Props {
  pais: Pais;
  regiones: Region[];
  regionInicial?: string | null;
  onCerrar: () => void;
}

export function FormularioListaEspera({
  pais,
  regiones,
  regionInicial = null,
  onCerrar,
}: Props) {
  const [email, setEmail] = useState("");
  const [regionId, setRegionId] = useState<string>(regionInicial ?? "");
  const [tipo, setTipo] = useState<TipoUsuario>("productor");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">(
    "idle",
  );
  const [mensaje, setMensaje] = useState("");

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setEstado("enviando");
    setMensaje("");
    try {
      const respuesta = await fetch("/api/marketplace/lista-espera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          pais_id: pais.id,
          region_id: regionId || null,
          tipo_usuario: tipo,
        }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.error ?? "No se pudo registrar.");
      setEstado("ok");
      setMensaje(
        `Listo. Te avisamos apenas ${pais.nombre} quede habilitado para operar.`,
      );
    } catch (error) {
      setEstado("error");
      setMensaje(error instanceof Error ? error.message : "Error inesperado.");
    }
  }

  if (estado === "ok") {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm font-medium text-emerald-900">{mensaje}</p>
        <button
          type="button"
          onClick={onCerrar}
          className="mt-3 text-xs font-semibold text-emerald-700 underline"
        >
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={enviar}
      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
    >
      <p className="mb-3 text-xs text-slate-600">
        Dejanos tu email y te escribimos cuando la normativa de{" "}
        <strong>{pais.nombre}</strong> esté verificada.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="mkt-label" htmlFor={`email-${pais.id}`}>
            Email
          </label>
          <input
            id={`email-${pais.id}`}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="mkt-campo"
          />
        </div>
        <div>
          <label className="mkt-label" htmlFor={`tipo-${pais.id}`}>
            Soy
          </label>
          <select
            id={`tipo-${pais.id}`}
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoUsuario)}
            className="mkt-campo"
          >
            <option value="productor">Productor</option>
            <option value="operador">Operador</option>
          </select>
        </div>
        <div className="sm:col-span-3">
          <label className="mkt-label" htmlFor={`region-${pais.id}`}>
            Región (opcional)
          </label>
          <select
            id={`region-${pais.id}`}
            value={regionId}
            onChange={(e) => setRegionId(e.target.value)}
            className="mkt-campo"
          >
            <option value="">Todo el país</option>
            {regiones.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {estado === "error" && (
        <p className="mt-3 text-xs font-medium text-red-700">{mensaje}</p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={estado === "enviando"}
          className="mkt-btn-primario"
        >
          {estado === "enviando" ? "Enviando…" : "Sumarme a la lista"}
        </button>
        <button type="button" onClick={onCerrar} className="mkt-btn-secundario">
          Cancelar
        </button>
      </div>
    </form>
  );
}
