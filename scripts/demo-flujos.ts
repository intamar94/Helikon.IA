/**
 * Demostración por consola de los tres flujos del motor de cumplimiento.
 * Usa el mismo dataset y las mismas entradas que /marketplace/demo.
 *
 *   npm run marketplace:demo
 */
import { correrFlujosDemo, DATASET_DEMO } from "../lib/marketplace/demo";
import {
  ETIQUETA_SERVICIO,
  formatearHoras,
  formatearUSD,
} from "../lib/marketplace/labels";

const linea = (c = "─") => console.log(c.repeat(78));

for (const flujo of correrFlujosDemo()) {
  const { entrada, resultado: r } = flujo;
  const pais = DATASET_DEMO.paises.find((p) => p.id === entrada.pais_id)!;
  const region = DATASET_DEMO.regiones.find((x) => x.id === entrada.region_id)!;
  const productor = DATASET_DEMO.productores.find(
    (p) => p.id === entrada.productor_id,
  );

  console.log("");
  linea("═");
  console.log(`FLUJO ${flujo.numero} — ${flujo.titulo}`);
  linea("═");
  console.log(flujo.descripcion);
  console.log("");
  console.log(`Productor    : ${productor?.nombre ?? entrada.productor_id}`);
  console.log(
    `Zona         : ${region.nombre}, ${pais.nombre} ` +
      `(país=${pais.estado} · región=${region.estado})`,
  );
  console.log(
    `Pedido       : ${ETIQUETA_SERVICIO[entrada.servicio]} · ${entrada.cultivo} · ` +
      `${entrada.hectareas} ha · ${entrada.fecha_deseada}`,
  );
  console.log(`Producto     : ${entrada.producto_a_aplicar}`);
  linea();
  console.log(
    `RESULTADO    : ${r.estado.toUpperCase()}${r.motivo ? ` (${r.motivo})` : ""}`,
  );
  console.log(`Mensaje      : ${r.mensaje}`);

  if (r.traza.regla_resuelta) {
    const { regla, especificidad, desplazada } = r.traza.regla_resuelta;
    console.log("");
    console.log(`Regla aplicada (${especificidad}): ${regla.id}`);
    console.log(`  certificación requerida : ${regla.certificacion_requerida}`);
    console.log(`  producto permitido      : ${regla.producto_permitido}`);
    console.log(
      `  verificada              : ${
        regla.verificada
          ? `sí, por ${regla.verificada_por} el ${regla.fecha_verificacion}`
          : "NO"
      }`,
    );
    if (desplazada) {
      console.log(`  ⤷ pisó a la regla nacional ${desplazada.id}`);
      console.log(`      exigía  : ${desplazada.certificacion_requerida}`);
      console.log(`      producto: ${desplazada.producto_permitido}`);
    }
  }

  if (r.estado === "rechazada") {
    console.log("");
    console.log(
      r.ofrecer_lista_espera
        ? "→ Se ofrece sumarse a la lista de espera (POST /api/marketplace/lista-espera)."
        : "→ Sin acción de lista de espera.",
    );
    continue;
  }

  console.log("");
  console.log(
    `Embudo       : ${r.traza.operadores_evaluados} operadores verificados → ` +
      `${r.traza.operadores_con_certificacion} con certificación vigente → ` +
      `${r.traza.drones_con_servicio} drones con el servicio`,
  );
  console.log("");
  console.log(`Opciones (${r.opciones.length}):`);
  r.opciones.forEach((o, i) => {
    console.log(
      `  ${i + 1}. ${o.operador.nombre} · ${o.dron.modelo} · rating ${o.operador.rating}`,
    );
    console.log(
      `     respaldo  : ${o.certificacion.tipo_certificacion} ` +
        `(${o.certificacion.numero}, vence ${o.certificacion.vigente_hasta})`,
    );
    console.log(
      `     distancia : ${o.distancia_km} km · tiempo estimado ` +
        `${formatearHoras(o.tiempo_estimado_horas)} ` +
        `(vuelo ${formatearHoras(o.horas_vuelo)} + traslado ${formatearHoras(o.horas_traslado)})`,
    );
    console.log(
      `     precio    : ${formatearUSD(o.precio_estimado_hectarea_usd)}/ha · ` +
        `total ${formatearUSD(o.precio_estimado_total_usd)}`,
    );
  });
}

console.log("");
