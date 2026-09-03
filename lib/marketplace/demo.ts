import { ejecutarMatching, type ResultadoMatching } from "./matching";
import {
  ANUNCIOS_SEED,
  CERTIFICACIONES_SEED,
  DRONES_SEED,
  OPERADORES_SEED,
  PAISES_SEED,
  PRODUCTORES_SEED,
  REGIONES_SEED,
  REGLAS_SEED,
} from "./seed-data";
import type { DatasetMatching, EntradaSolicitud } from "./types";

/** Dataset semilla congelado: la demo no depende del store mutable. */
export const DATASET_DEMO: DatasetMatching = {
  paises: PAISES_SEED,
  regiones: REGIONES_SEED,
  reglas: REGLAS_SEED,
  operadores: OPERADORES_SEED,
  certificaciones: CERTIFICACIONES_SEED,
  drones: DRONES_SEED,
  anuncios: ANUNCIOS_SEED,
  productores: PRODUCTORES_SEED,
};

/**
 * Fecha fija para que la demo sea determinista. Importa porque el paso (c)
 * filtra certificaciones por vigencia: la de Fumiga Caribe venció el
 * 2026-01-31 y por eso ese operador nunca aparece.
 */
export const FECHA_DEMO = new Date("2026-09-03T12:00:00Z");

export interface FlujoDemo {
  numero: number;
  titulo: string;
  descripcion: string;
  entrada: EntradaSolicitud;
}

export const FLUJOS_DEMO: FlujoDemo[] = [
  {
    numero: 1,
    titulo: "País activo → devuelve operadores válidos",
    descripcion:
      "Colombia está activo y Antioquia también. Rige la regla nacional de " +
      "banano + fumigación, que exige «Licencia ICA Aplicador Aéreo».",
    entrada: {
      productor_id: "pr-la-esperanza",
      pais_id: "co",
      region_id: "co-antioquia",
      cultivo: "banano",
      servicio: "fumigacion",
      modalidad: "con_piloto",
      hectareas: 120,
      fecha_deseada: "2026-09-20",
      producto_a_aplicar: "Mancozeb 80% WP",
    },
  },
  {
    numero: 2,
    titulo: "País mapeado → rechaza y ofrece lista de espera",
    descripcion:
      "Argentina está sólo mapeada: no hay normativa verificada, así que el " +
      "gate de activación corta antes de mirar reglas u operadores.",
    entrada: {
      productor_id: "pr-don-ramiro",
      pais_id: "ar",
      region_id: "ar-buenos-aires",
      cultivo: "soja",
      servicio: "fumigacion",
      modalidad: "con_piloto",
      hectareas: 400,
      fecha_deseada: "2026-10-05",
      producto_a_aplicar: "Glifosato 48% SL",
    },
  },
  {
    numero: 3,
    titulo: "Región con regla específica → la regional pisa a la nacional",
    descripcion:
      "Mismo cultivo y servicio que el flujo 1, pero en Valle del Cauca, donde " +
      "hay una regla regional que exige el aval de la CVC. Cambia la " +
      "certificación exigida, el producto permitido y el operador habilitado.",
    entrada: {
      productor_id: "pr-el-palmar",
      pais_id: "co",
      region_id: "co-valle",
      cultivo: "banano",
      servicio: "fumigacion",
      modalidad: "con_piloto",
      hectareas: 120,
      fecha_deseada: "2026-09-20",
      producto_a_aplicar: "Azoxistrobina 25% SC (bajo impacto)",
    },
  },
  {
    numero: 4,
    titulo: "Alquiler con licencia propia → el productor vuela",
    descripcion:
      "Misma zona y regla que el flujo 3, pero en modalidad alquiler. Acá no " +
      "vuela el operador sino el productor, así que la licencia se le exige a " +
      "él: Hacienda El Palmar tiene el aval de la CVC a nombre propio, así que " +
      "puede llevarse el equipo. Cambia también el precio: por jornada, no por " +
      "hectárea.",
    entrada: {
      productor_id: "pr-el-palmar",
      pais_id: "co",
      region_id: "co-valle",
      cultivo: "banano",
      servicio: "fumigacion",
      modalidad: "alquiler",
      hectareas: 120,
      fecha_deseada: "2026-09-20",
      producto_a_aplicar: "Azoxistrobina 25% SC (bajo impacto)",
    },
  },
  {
    numero: 5,
    titulo: "Alquiler sin licencia propia → rechaza y ofrece ir con piloto",
    descripcion:
      "Mismo pedido del flujo 1, pero en alquiler. Finca La Esperanza no tiene " +
      "licencia de aplicador a su nombre, así que no puede volar. El motor no " +
      "manda a lista de espera: la zona está habilitada y el mismo trabajo se " +
      "resuelve hoy con piloto, así que sugiere cambiar de modalidad.",
    entrada: {
      productor_id: "pr-la-esperanza",
      pais_id: "co",
      region_id: "co-antioquia",
      cultivo: "banano",
      servicio: "fumigacion",
      modalidad: "alquiler",
      hectareas: 120,
      fecha_deseada: "2026-09-20",
      producto_a_aplicar: "Mancozeb 80% WP",
    },
  },
];

export interface FlujoResuelto extends FlujoDemo {
  resultado: ResultadoMatching;
}

export function correrFlujosDemo(): FlujoResuelto[] {
  return FLUJOS_DEMO.map((flujo) => ({
    ...flujo,
    resultado: ejecutarMatching(DATASET_DEMO, flujo.entrada, FECHA_DEMO),
  }));
}
