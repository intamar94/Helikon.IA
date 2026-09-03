"use client";

import { useState } from "react";
import { ETIQUETA_SERVICIO } from "@/lib/marketplace/labels";
import type {
  Pais,
  Region,
  ReglaCumplimiento,
  Servicio,
} from "@/lib/marketplace/types";
import { SERVICIOS } from "@/lib/marketplace/types";

interface Props {
  paises: Pais[];
  regiones: Region[];
  reglas: ReglaCumplimiento[];
  verificador: string;
  onCambio: (mensaje: string, esError?: boolean) => void;
}

const FORM_VACIO = {
  pais_id: "",
  region_id: "",
  cultivo: "",
  servicio: "fumigacion" as Servicio,
  certificacion_requerida: "",
  producto_permitido: "",
  verificada: false,
};

export function AdminReglas({
  paises,
  regiones,
  reglas,
  verificador,
  onCambio,
}: Props) {
  const [form, setForm] = useState({ ...FORM_VACIO, pais_id: paises[0]?.id ?? "" });
  const [editando, setEditando] = useState<string | null>(null);
  const [borrador, setBorrador] = useState<Partial<ReglaCumplimiento>>({});
  const [ocupado, setOcupado] = useState(false);

  async function llamar(url: string, metodo: string, cuerpo?: unknown) {
    setOcupado(true);
    try {
      const respuesta = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.error ?? "Falló la operación.");
      return datos;
    } finally {
      setOcupado(false);
    }
  }

  async function crear(evento: React.FormEvent) {
    evento.preventDefault();
    try {
      await llamar("/api/marketplace/admin/reglas", "POST", {
        ...form,
        region_id: form.region_id || null,
        verificada_por: form.verificada ? verificador : null,
      });
      setForm({ ...FORM_VACIO, pais_id: paises[0]?.id ?? "" });
      onCambio("Regla creada. La normativa se actualiza sin deploy.");
    } catch (e) {
      onCambio(e instanceof Error ? e.message : "Error", true);
    }
  }

  async function guardar(id: string) {
    try {
      await llamar(`/api/marketplace/admin/reglas/${id}`, "PATCH", {
        ...borrador,
        verificada_por: borrador.verificada ? verificador : undefined,
      });
      setEditando(null);
      setBorrador({});
      onCambio("Regla actualizada.");
    } catch (e) {
      onCambio(e instanceof Error ? e.message : "Error", true);
    }
  }

  async function alternarVerificada(regla: ReglaCumplimiento) {
    try {
      await llamar(`/api/marketplace/admin/reglas/${regla.id}`, "PATCH", {
        verificada: !regla.verificada,
        verificada_por: !regla.verificada ? verificador : undefined,
      });
      onCambio(
        !regla.verificada
          ? "Regla verificada: ya puede habilitar transacciones."
          : "Regla desverificada: deja de habilitar transacciones.",
      );
    } catch (e) {
      onCambio(e instanceof Error ? e.message : "Error", true);
    }
  }

  async function alternarActiva(regla: ReglaCumplimiento) {
    try {
      await llamar(`/api/marketplace/admin/reglas/${regla.id}`, "PATCH", {
        activa: !regla.activa,
      });
      onCambio(regla.activa ? "Regla desactivada." : "Regla reactivada.");
    } catch (e) {
      onCambio(e instanceof Error ? e.message : "Error", true);
    }
  }

  async function eliminar(id: string) {
    try {
      await llamar(`/api/marketplace/admin/reglas/${id}`, "DELETE");
      onCambio("Regla eliminada.");
    } catch (e) {
      onCambio(e instanceof Error ? e.message : "Error", true);
    }
  }

  const regionesDe = (paisId: string) =>
    regiones.filter((r) => r.pais_id === paisId);

  const nombrePais = (id: string) =>
    paises.find((p) => p.id === id)?.nombre ?? id;
  const nombreRegion = (id: string | null) =>
    id ? (regiones.find((r) => r.id === id)?.nombre ?? id) : "— todo el país";

  return (
    <div className="space-y-6">
      <form onSubmit={crear} className="mkt-card p-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Nueva regla de cumplimiento
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mkt-label">País</label>
            <select
              value={form.pais_id}
              onChange={(e) =>
                setForm({ ...form, pais_id: e.target.value, region_id: "" })
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
            <label className="mkt-label">Región (vacío = todo el país)</label>
            <select
              value={form.region_id}
              onChange={(e) => setForm({ ...form, region_id: e.target.value })}
              className="mkt-campo"
            >
              <option value="">— Regla nacional —</option>
              {regionesDe(form.pais_id).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mkt-label">Cultivo</label>
            <input
              value={form.cultivo}
              onChange={(e) => setForm({ ...form, cultivo: e.target.value })}
              required
              className="mkt-campo"
            />
          </div>
          <div>
            <label className="mkt-label">Servicio</label>
            <select
              value={form.servicio}
              onChange={(e) =>
                setForm({ ...form, servicio: e.target.value as Servicio })
              }
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
            <label className="mkt-label">Certificación requerida</label>
            <input
              value={form.certificacion_requerida}
              onChange={(e) =>
                setForm({ ...form, certificacion_requerida: e.target.value })
              }
              required
              className="mkt-campo"
            />
          </div>
          <div>
            <label className="mkt-label">Producto permitido</label>
            <input
              value={form.producto_permitido}
              onChange={(e) =>
                setForm({ ...form, producto_permitido: e.target.value })
              }
              required
              className="mkt-campo"
            />
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.verificada}
            onChange={(e) => setForm({ ...form, verificada: e.target.checked })}
          />
          Marcar como verificada (queda registrada a nombre de{" "}
          <code>{verificador}</code>)
        </label>

        <button
          type="submit"
          disabled={ocupado}
          className="mkt-btn-primario mt-4"
        >
          Crear regla
        </button>
      </form>

      <div className="mkt-card overflow-x-auto">
        <table className="text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Alcance</th>
              <th className="px-4 py-3">Cultivo / servicio</th>
              <th className="px-4 py-3">Certificación</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reglas.map((regla) => {
              const enEdicion = editando === regla.id;
              return (
                <tr key={regla.id} className={regla.activa ? "" : "opacity-50"}>
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-slate-900">
                      {nombrePais(regla.pais_id)}
                    </div>
                    <div
                      className={`text-xs ${
                        regla.region_id
                          ? "font-semibold text-indigo-700"
                          : "text-slate-500"
                      }`}
                    >
                      {nombreRegion(regla.region_id)}
                    </div>
                    <code className="text-[10px] text-slate-400">
                      {regla.id}
                    </code>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="text-slate-900">{regla.cultivo}</div>
                    <div className="text-xs text-slate-500">
                      {ETIQUETA_SERVICIO[regla.servicio]}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    {enEdicion ? (
                      <input
                        defaultValue={regla.certificacion_requerida}
                        onChange={(e) =>
                          setBorrador((b) => ({
                            ...b,
                            certificacion_requerida: e.target.value,
                          }))
                        }
                        className="mkt-campo"
                      />
                    ) : (
                      <span className="text-slate-700">
                        {regla.certificacion_requerida}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {enEdicion ? (
                      <input
                        defaultValue={regla.producto_permitido}
                        onChange={(e) =>
                          setBorrador((b) => ({
                            ...b,
                            producto_permitido: e.target.value,
                          }))
                        }
                        className="mkt-campo"
                      />
                    ) : (
                      <span className="text-slate-700">
                        {regla.producto_permitido}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={`mkt-chip ${
                        regla.verificada
                          ? "bg-emerald-100 text-emerald-800 ring-emerald-600/30"
                          : "bg-amber-100 text-amber-900 ring-amber-600/30"
                      }`}
                    >
                      {regla.verificada ? "Verificada" : "Sin verificar"}
                    </span>
                    {regla.verificada && (
                      <div className="mt-1 text-[10px] text-slate-500">
                        {regla.verificada_por} · {regla.fecha_verificacion}
                      </div>
                    )}
                    {!regla.activa && (
                      <div className="mt-1 text-[10px] font-semibold text-slate-500">
                        inactiva
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col gap-1 text-xs font-semibold">
                      {enEdicion ? (
                        <>
                          <button
                            type="button"
                            disabled={ocupado}
                            onClick={() => guardar(regla.id)}
                            className="text-left text-campo-700 underline"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditando(null);
                              setBorrador({});
                            }}
                            className="text-left text-slate-500 underline"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditando(regla.id);
                              setBorrador({});
                            }}
                            className="text-left text-slate-600 underline"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            disabled={ocupado}
                            onClick={() => alternarVerificada(regla)}
                            className="text-left text-campo-700 underline"
                          >
                            {regla.verificada ? "Desverificar" : "Verificar"}
                          </button>
                          <button
                            type="button"
                            disabled={ocupado}
                            onClick={() => alternarActiva(regla)}
                            className="text-left text-slate-600 underline"
                          >
                            {regla.activa ? "Desactivar" : "Reactivar"}
                          </button>
                          <button
                            type="button"
                            disabled={ocupado}
                            onClick={() => eliminar(regla.id)}
                            className="text-left text-red-600 underline"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
