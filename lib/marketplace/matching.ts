import { resolverRegla, reglaHabilita, type ReglaResuelta } from "./compliance";
import { distanciaKm, evaluarGateActivacion } from "./geo";
import type {
  CertificacionOperador,
  DatasetMatching,
  Dron,
  EntradaSolicitud,
  Operador,
  ReglaCumplimiento,
} from "./types";

/** Cuántas opciones devuelve el paso (f). */
export const MAX_OPCIONES = 5;

/** Velocidad de traslado terrestre asumida para estimar la movilización. */
const VELOCIDAD_TRASLADO_KMH = 60;
/** Costo de movilización por kilómetro (ida y vuelta ya incluida). */
const COSTO_TRASLADO_USD_KM = 1.2;

export type MotivoRechazo =
  | "pais_no_habilitado"
  | "region_no_habilitada"
  | "sin_regla"
  | "regla_no_verificada"
  | "sin_operadores_certificados"
  | "sin_capacidad"
  | "productor_desconocido";

export interface OpcionMatching {
  operador: Operador;
  dron: Dron;
  /** Certificación concreta que respalda la habilitación. */
  certificacion: CertificacionOperador;
  distancia_km: number;
  tiempo_estimado_horas: number;
  horas_vuelo: number;
  horas_traslado: number;
  precio_estimado_hectarea_usd: number;
  precio_estimado_total_usd: number;
}

export interface TrazaMatching {
  gate_ok: boolean;
  regla_resuelta: ReglaResuelta | null;
  operadores_evaluados: number;
  operadores_con_certificacion: number;
  drones_con_servicio: number;
}

export type ResultadoMatching =
  | {
      estado: "rechazada";
      motivo: MotivoRechazo;
      mensaje: string;
      ofrecer_lista_espera: boolean;
      regla_aplicada: ReglaCumplimiento | null;
      opciones: [];
      traza: TrazaMatching;
    }
  | {
      estado: "asignable";
      motivo: null;
      mensaje: string;
      ofrecer_lista_espera: false;
      regla_aplicada: ReglaCumplimiento;
      regla_resuelta: ReglaResuelta;
      opciones: OpcionMatching[];
      traza: TrazaMatching;
    };

const normalizar = (valor: string) => valor.trim().toLowerCase();

/**
 * Una certificación respalda la regla si es del mismo país, del tipo exigido,
 * y sigue vigente en la fecha de referencia.
 */
export function certificacionRespalda(
  certificacion: CertificacionOperador,
  regla: ReglaCumplimiento,
  hoy: Date,
): boolean {
  if (certificacion.pais_id !== regla.pais_id) return false;
  if (
    normalizar(certificacion.tipo_certificacion) !==
    normalizar(regla.certificacion_requerida)
  ) {
    return false;
  }
  return new Date(`${certificacion.vigente_hasta}T23:59:59Z`) > hoy;
}

function trazaBase(overrides: Partial<TrazaMatching> = {}): TrazaMatching {
  return {
    gate_ok: false,
    regla_resuelta: null,
    operadores_evaluados: 0,
    operadores_con_certificacion: 0,
    drones_con_servicio: 0,
    ...overrides,
  };
}

/**
 * Motor de matching. Función pura: recibe todo el dataset y la solicitud, y
 * ejecuta en orden los pasos (a) gate de activación, (b) resolución de regla,
 * (c) filtro de cumplimiento, (d) filtro de capacidad, (e) ordenamiento y
 * (f) armado de opciones.
 */
export function ejecutarMatching(
  dataset: DatasetMatching,
  entrada: EntradaSolicitud,
  hoy: Date = new Date(),
): ResultadoMatching {
  const pais = dataset.paises.find((p) => p.id === entrada.pais_id);
  const region = dataset.regiones.find((r) => r.id === entrada.region_id);

  // ── (a) Gate de activación ───────────────────────────────────────────────
  const gate = evaluarGateActivacion(pais, region);
  if (!gate.habilitada) {
    const zona = [region?.nombre, pais?.nombre].filter(Boolean).join(", ");
    return {
      estado: "rechazada",
      motivo: gate.motivo,
      mensaje:
        `Todavía no operamos en ${zona || "esa zona"}. La normativa para ` +
        `aplicación con dron ahí no está verificada, así que no podemos ` +
        `habilitar la transacción. Sumate a la lista de espera y te avisamos ` +
        `apenas la zona quede activa.`,
      ofrecer_lista_espera: true,
      regla_aplicada: null,
      opciones: [],
      traza: trazaBase(),
    };
  }

  // ── (b) Resolución de regla (región pisa a país) ─────────────────────────
  const resuelta = resolverRegla(dataset.reglas, {
    pais_id: entrada.pais_id,
    region_id: entrada.region_id,
    cultivo: entrada.cultivo,
    servicio: entrada.servicio,
  });

  if (!resuelta) {
    return {
      estado: "rechazada",
      motivo: "sin_regla",
      mensaje:
        `No hay regla de cumplimiento cargada para ${entrada.cultivo} + ` +
        `${entrada.servicio} en ${region!.nombre}, ${pais!.nombre}. Sin regla ` +
        `no habilitamos la transacción.`,
      ofrecer_lista_espera: true,
      regla_aplicada: null,
      opciones: [],
      traza: trazaBase({ gate_ok: true }),
    };
  }

  if (!reglaHabilita(resuelta.regla)) {
    return {
      estado: "rechazada",
      motivo: "regla_no_verificada",
      mensaje:
        `La regla ${resuelta.especificidad} para ${entrada.cultivo} + ` +
        `${entrada.servicio} en ${region!.nombre} existe pero todavía no fue ` +
        `verificada por nuestro equipo normativo. Una regla sin verificar ` +
        `nunca habilita una transacción.`,
      ofrecer_lista_espera: true,
      regla_aplicada: resuelta.regla,
      opciones: [],
      traza: trazaBase({ gate_ok: true, regla_resuelta: resuelta }),
    };
  }

  const regla = resuelta.regla;

  // ── (c) Filtro de cumplimiento ───────────────────────────────────────────
  const operadoresVerificados = dataset.operadores.filter((o) => o.verificado);

  const respaldos = new Map<string, CertificacionOperador>();
  for (const operador of operadoresVerificados) {
    const certificacion = dataset.certificaciones
      .filter((c) => c.operador_id === operador.id)
      .find((c) => certificacionRespalda(c, regla, hoy));
    if (certificacion) respaldos.set(operador.id, certificacion);
  }

  const traza = trazaBase({
    gate_ok: true,
    regla_resuelta: resuelta,
    operadores_evaluados: operadoresVerificados.length,
    operadores_con_certificacion: respaldos.size,
  });

  if (respaldos.size === 0) {
    return {
      estado: "rechazada",
      motivo: "sin_operadores_certificados",
      mensaje:
        `La zona está habilitada, pero hoy ningún operador verificado tiene ` +
        `la certificación «${regla.certificacion_requerida}» vigente en ` +
        `${pais!.nombre}.`,
      ofrecer_lista_espera: true,
      regla_aplicada: regla,
      opciones: [],
      traza,
    };
  }

  // ── (d) Filtro de capacidad ──────────────────────────────────────────────
  const combinaciones = dataset.drones
    .filter(
      (d) =>
        respaldos.has(d.operador_id) &&
        d.servicios_ofrecidos.includes(entrada.servicio),
    )
    .map((dron) => ({
      dron,
      operador: operadoresVerificados.find((o) => o.id === dron.operador_id)!,
      certificacion: respaldos.get(dron.operador_id)!,
    }));

  traza.drones_con_servicio = combinaciones.length;

  if (combinaciones.length === 0) {
    return {
      estado: "rechazada",
      motivo: "sin_capacidad",
      mensaje:
        `Hay operadores certificados en la zona, pero ninguno tiene un dron ` +
        `configurado para el servicio solicitado.`,
      ofrecer_lista_espera: true,
      regla_aplicada: regla,
      opciones: [],
      traza,
    };
  }

  // ── (e) Ordenamiento: cercanía, luego rating ─────────────────────────────
  const productor = dataset.productores.find(
    (p) => p.id === entrada.productor_id,
  );

  if (!productor) {
    return {
      estado: "rechazada",
      motivo: "productor_desconocido",
      mensaje: "No encontramos el productor asociado a la solicitud.",
      ofrecer_lista_espera: false,
      regla_aplicada: regla,
      opciones: [],
      traza,
    };
  }

  const opciones: OpcionMatching[] = combinaciones
    .map(({ dron, operador, certificacion }) => {
      const distancia_km = distanciaKm(
        productor.ubicacion_lat,
        productor.ubicacion_lng,
        operador.ubicacion_lat,
        operador.ubicacion_lng,
      );
      const horas_vuelo = entrada.hectareas / dron.hectareas_por_hora;
      const horas_traslado = (2 * distancia_km) / VELOCIDAD_TRASLADO_KMH;
      const costo_traslado = distancia_km * COSTO_TRASLADO_USD_KM;
      const precio_hectarea =
        dron.precio_base_hectarea_usd + costo_traslado / entrada.hectareas;

      return {
        operador,
        dron,
        certificacion,
        distancia_km: redondear(distancia_km, 1),
        horas_vuelo: redondear(horas_vuelo, 1),
        horas_traslado: redondear(horas_traslado, 1),
        tiempo_estimado_horas: redondear(horas_vuelo + horas_traslado, 1),
        precio_estimado_hectarea_usd: redondear(precio_hectarea, 2),
        precio_estimado_total_usd: redondear(
          precio_hectarea * entrada.hectareas,
          2,
        ),
      };
    })
    .sort((a, b) => {
      if (a.distancia_km !== b.distancia_km) {
        return a.distancia_km - b.distancia_km;
      }
      return b.operador.rating - a.operador.rating;
    })
    .slice(0, MAX_OPCIONES);

  // ── (f) Resultado ────────────────────────────────────────────────────────
  return {
    estado: "asignable",
    motivo: null,
    mensaje:
      `${opciones.length} operador(es) habilitados por la regla ` +
      `${resuelta.especificidad} vigente en ${region!.nombre}.`,
    ofrecer_lista_espera: false,
    regla_aplicada: regla,
    regla_resuelta: resuelta,
    opciones,
    traza,
  };
}

function redondear(valor: number, decimales: number): number {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}
