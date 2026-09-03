/**
 * Genera `supabase/marketplace_seed.sql` a partir de `lib/marketplace/seed-data.ts`,
 * para que el seed SQL y el store en memoria nunca se desincronicen.
 *
 *   npm run marketplace:sql
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  CERTIFICACIONES_SEED,
  DRONES_SEED,
  OPERADORES_SEED,
  PAISES_SEED,
  PRODUCTORES_SEED,
  REGIONES_SEED,
  REGLAS_SEED,
} from "../lib/marketplace/seed-data";

type Valor = string | number | boolean | null | string[];

const lit = (valor: Valor): string => {
  if (valor === null) return "null";
  if (typeof valor === "boolean") return valor ? "true" : "false";
  if (typeof valor === "number") return String(valor);
  if (Array.isArray(valor)) {
    return `array[${valor.map((v) => `'${v}'`).join(", ")}]::mkt_servicio[]`;
  }
  return `'${valor.replace(/'/g, "''")}'`;
};

function insertar(
  tabla: string,
  columnas: string[],
  filas: Valor[][],
  claveConflicto = "id",
): string {
  const actualizables = columnas.filter((c) => c !== claveConflicto);
  const values = filas
    .map((fila) => `  (${fila.map(lit).join(", ")})`)
    .join(",\n");
  const setClause = actualizables
    .map((c) => `  ${c} = excluded.${c}`)
    .join(",\n");
  return [
    `insert into ${tabla} (${columnas.join(", ")}) values`,
    values,
    `on conflict (${claveConflicto}) do update set`,
    setClause,
    ";",
    "",
  ].join("\n");
}

const bloques: string[] = [
  "-- ============================================================================",
  "-- Marketplace de drones agrícolas — datos semilla",
  "-- GENERADO AUTOMÁTICAMENTE por scripts/generar-sql-seed.ts — no editar a mano.",
  "-- Fuente: lib/marketplace/seed-data.ts   ·   Regenerar: npm run marketplace:sql",
  "-- Requiere supabase/marketplace_schema.sql aplicado previamente.",
  "-- ============================================================================",
  "",
  "begin;",
  "",
  "-- 6 países: 2 activos, 2 en revisión, 2 mapeados.",
  insertar(
    "mkt_paises",
    ["id", "nombre", "codigo_iso", "estado", "fecha_activacion"],
    PAISES_SEED.map((p) => [
      p.id,
      p.nombre,
      p.codigo_iso,
      p.estado,
      p.fecha_activacion,
    ]),
  ),
  "-- Regiones. Mato Grosso está 'activo' aunque Brasil siga 'en_revision'.",
  insertar(
    "mkt_regiones",
    ["id", "pais_id", "nombre", "estado"],
    REGIONES_SEED.map((r) => [r.id, r.pais_id, r.nombre, r.estado]),
  ),
  "-- Reglas de cumplimiento. Las de region_id no nulo pisan a la nacional.",
  insertar(
    "mkt_reglas_cumplimiento",
    [
      "id",
      "pais_id",
      "region_id",
      "cultivo",
      "servicio",
      "certificacion_requerida",
      "producto_permitido",
      "verificada",
      "verificada_por",
      "fecha_verificacion",
      "activa",
    ],
    REGLAS_SEED.map((r) => [
      r.id,
      r.pais_id,
      r.region_id,
      r.cultivo,
      r.servicio,
      r.certificacion_requerida,
      r.producto_permitido,
      r.verificada,
      r.verificada_por,
      r.fecha_verificacion,
      r.activa,
    ]),
  ),
  insertar(
    "mkt_operadores",
    [
      "id",
      "nombre",
      "email",
      "pais_base_id",
      "verificado",
      "rating",
      "ubicacion_lat",
      "ubicacion_lng",
    ],
    OPERADORES_SEED.map((o) => [
      o.id,
      o.nombre,
      o.email,
      o.pais_base_id,
      o.verificado,
      o.rating,
      o.ubicacion_lat,
      o.ubicacion_lng,
    ]),
  ),
  insertar(
    "mkt_certificaciones_operador",
    [
      "id",
      "operador_id",
      "pais_id",
      "tipo_certificacion",
      "numero",
      "vigente_hasta",
      "documento_url",
      "documento_revisado",
    ],
    CERTIFICACIONES_SEED.map((c) => [
      c.id,
      c.operador_id,
      c.pais_id,
      c.tipo_certificacion,
      c.numero,
      c.vigente_hasta,
      c.documento_url,
      c.documento_revisado,
    ]),
  ),
  insertar(
    "mkt_drones",
    [
      "id",
      "operador_id",
      "modelo",
      "capacidad_carga_litros",
      "servicios_ofrecidos",
      "hectareas_por_hora",
      "precio_base_hectarea_usd",
    ],
    DRONES_SEED.map((d) => [
      d.id,
      d.operador_id,
      d.modelo,
      d.capacidad_carga_litros,
      d.servicios_ofrecidos,
      d.hectareas_por_hora,
      d.precio_base_hectarea_usd,
    ]),
  ),
  insertar(
    "mkt_productores",
    [
      "id",
      "nombre",
      "email",
      "pais_id",
      "region_id",
      "ubicacion_lat",
      "ubicacion_lng",
    ],
    PRODUCTORES_SEED.map((p) => [
      p.id,
      p.nombre,
      p.email,
      p.pais_id,
      p.region_id,
      p.ubicacion_lat,
      p.ubicacion_lng,
    ]),
  ),
  "commit;",
  "",
];

const destino = join(process.cwd(), "supabase", "marketplace_seed.sql");
writeFileSync(destino, bloques.join("\n"), "utf8");
console.log(`✓ ${destino}`);
