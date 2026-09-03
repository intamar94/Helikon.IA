import Link from "next/link";
import { EstadoBadge } from "@/components/marketplace/EstadoBadge";
import { correrFlujosDemo, DATASET_DEMO, FECHA_DEMO } from "@/lib/marketplace/demo";
import {
  CLASES_MODALIDAD,
  ETIQUETA_MODALIDAD,
  ETIQUETA_SERVICIO,
  formatearHoras,
  formatearUSD,
  pluralizar,
} from "@/lib/marketplace/labels";

export const metadata = { title: "Demo del motor de cumplimiento" };

export default function PaginaDemo() {
  const flujos = correrFlujosDemo();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">
          Cinco flujos con datos de prueba
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          Cada flujo corre el motor de matching completo sobre el dataset
          semilla, con fecha fija{" "}
          <code>{FECHA_DEMO.toISOString().slice(0, 10)}</code> para que el
          resultado sea determinista (la vigencia de las certificaciones depende
          de la fecha). Mismo código que usa{" "}
          <Link
            href="/marketplace/solicitar"
            className="font-semibold text-campo-700 underline"
          >
            el formulario de solicitud
          </Link>
          .
        </p>
      </header>

      {flujos.map((flujo) => {
        const { entrada, resultado } = flujo;
        const pais = DATASET_DEMO.paises.find((p) => p.id === entrada.pais_id)!;
        const region = DATASET_DEMO.regiones.find(
          (r) => r.id === entrada.region_id,
        )!;
        const productor = DATASET_DEMO.productores.find(
          (p) => p.id === entrada.productor_id,
        )!;
        const resuelta = resultado.traza.regla_resuelta;

        return (
          <section key={flujo.numero} className="mkt-card overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-campo-700">
                Flujo {flujo.numero}
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                {flujo.titulo}
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">
                {flujo.descripcion}
              </p>
            </div>

            <div className="grid gap-0 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
              <div className="border-b border-slate-200 p-5 lg:border-b-0 lg:border-r">
                <h3 className="mkt-label">Entrada</h3>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">Productor</dt>
                    <dd className="text-slate-800">{productor.nombre}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Zona</dt>
                    <dd className="flex flex-wrap items-center gap-2 text-slate-800">
                      {region.nombre}, {pais.nombre}
                      <EstadoBadge estado={pais.estado} />
                      <EstadoBadge estado={region.estado} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Pedido</dt>
                    <dd className="text-slate-800">
                      {ETIQUETA_SERVICIO[entrada.servicio]} · {entrada.cultivo} ·{" "}
                      {entrada.hectareas} ha · {entrada.fecha_deseada}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Modalidad</dt>
                    <dd>
                      <span
                        className={`mkt-chip ${CLASES_MODALIDAD[entrada.modalidad]}`}
                      >
                        {ETIQUETA_MODALIDAD[entrada.modalidad]}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Producto</dt>
                    <dd className="text-slate-800">
                      {entrada.producto_a_aplicar}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`mkt-chip ${
                      resultado.estado === "asignable"
                        ? "bg-emerald-100 text-emerald-800 ring-emerald-600/30"
                        : "bg-amber-100 text-amber-900 ring-amber-600/30"
                    }`}
                  >
                    {resultado.estado === "asignable"
                      ? "Asignable"
                      : "Rechazada"}
                  </span>
                  {resultado.motivo && (
                    <code className="text-xs text-amber-800">
                      {resultado.motivo}
                    </code>
                  )}
                </div>

                <p className="mt-3 text-sm text-slate-700">
                  {resultado.mensaje}
                </p>

                {resuelta && (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs">
                    <p className="font-bold text-slate-900">
                      Regla {resuelta.especificidad} ·{" "}
                      <code>{resuelta.regla.id}</code>
                    </p>
                    <p className="mt-1 text-slate-700">
                      Exige «{resuelta.regla.certificacion_requerida}» · permite{" "}
                      {resuelta.regla.producto_permitido} ·{" "}
                      {resuelta.regla.verificada
                        ? `verificada por ${resuelta.regla.verificada_por}`
                        : "SIN VERIFICAR"}
                    </p>
                    {resuelta.desplazada && (
                      <p className="mt-2 rounded-md border border-indigo-200 bg-indigo-50 p-2 text-indigo-900">
                        <strong>Jerarquía:</strong> pisó a la regla nacional{" "}
                        <code>{resuelta.desplazada.id}</code>, que exigía «
                        {resuelta.desplazada.certificacion_requerida}» y permitía{" "}
                        {resuelta.desplazada.producto_permitido}.
                      </p>
                    )}
                  </div>
                )}

                {resultado.estado === "rechazada" ? (
                  <>
                    {resultado.sugerir_modalidad && (
                      <p className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
                        La zona sí está habilitada, así que en vez de lista de
                        espera el motor sugiere cambiar de modalidad a{" "}
                        <strong>
                          {ETIQUETA_MODALIDAD[
                            resultado.sugerir_modalidad
                          ].toLowerCase()}
                        </strong>
                        .
                      </p>
                    )}
                    {resultado.ofrecer_lista_espera && (
                      <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                        Se le ofrece al productor sumarse a la lista de espera
                        (<code>POST /api/marketplace/lista-espera</code>). El
                        rechazo queda registrado como señal de demanda para
                        priorizar qué zona verificar.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="mt-4 text-xs text-slate-500">
                      Embudo: {resultado.traza.operadores_evaluados} operadores
                      verificados →{" "}
                      {resultado.traza.operadores_con_certificacion} habilitados
                      por la certificación{" "}
                      {resultado.traza.titular_exigido === "productor"
                        ? "del productor"
                        : "del operador"}{" "}
                      → {resultado.traza.anuncios_disponibles} anuncios con el
                      servicio.
                    </p>
                    <ol className="mt-3 space-y-2">
                      {resultado.opciones.map((o, i) => (
                        <li
                          key={o.anuncio.id}
                          className="rounded-lg border border-slate-200 p-3 text-xs"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="text-sm font-bold text-slate-900">
                              {i + 1}. {o.operador.nombre}
                            </span>
                            <span className="font-semibold text-slate-900">
                              {formatearUSD(o.precio_estimado_total_usd)}
                              <span className="font-normal text-slate-500">
                                {o.modalidad === "alquiler"
                                  ? ` · ${pluralizar(
                                      o.dias_alquiler ?? 1,
                                      "jornada",
                                      "jornadas",
                                    )} a ${formatearUSD(
                                      o.anuncio.precio_dia_usd ?? 0,
                                    )}`
                                  : ` · ${formatearUSD(
                                      o.precio_estimado_hectarea_usd,
                                    )}/ha`}
                              </span>
                            </span>
                          </div>
                          <p className="mt-1 text-slate-600">
                            {o.dron.modelo} · ★ {o.operador.rating.toFixed(1)} ·{" "}
                            {o.distancia_km} km ·{" "}
                            {formatearHoras(o.tiempo_estimado_horas)}
                          </p>
                          <p className="mt-1 text-slate-500">
                            Respaldo{" "}
                            {o.titular_certificacion === "productor"
                              ? "del productor"
                              : "del operador"}
                            : {o.certificacion.tipo_certificacion} (Nº{" "}
                            {o.certificacion.numero}, vence{" "}
                            {o.certificacion.vigente_hasta})
                          </p>
                        </li>
                      ))}
                    </ol>
                  </>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
