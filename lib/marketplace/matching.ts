import {
  buscarRespaldo,
  reglaHabilita,
  resolverRegla,
  titularExigido,
  type ReglaResuelta,
} from "./compliance";
import { distanciaKm, evaluarGateActivacion } from "./geo";
import type {
  Anuncio,
  Certificacion,
  DatasetMatching,
  Dron,
  EntradaSolicitud,
  Modalidad,
  Operador,
  ReglaCumplimiento,
  TitularCertificacion,
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
  | "productor_sin_certificacion"
  | "sin_operadores_certificados"
  | "sin_capacidad"
  | "productor_desconocido";

export interface OpcionMatching {
  operador: Operador;
  dron: Dron;
  anuncio: Anuncio;
  modalidad: Modalidad;
  /** Certificación concreta que respalda la habilitación. */
  certificacion: Certificacion;
  /** De quién es esa certificación, según la modalidad. */
  titular_certificacion: TitularCertificacion;
  distancia_km: number;
  horas_vuelo: number;
  /** Traslado del operador al campo (con piloto) o retiro del equipo (alquiler). */
  horas_traslado: number;
  tiempo_estimado_horas: number;
  /** Jornadas de alquiler facturadas. Null en anuncios con piloto. */
  dias_alquiler: number | null;
  precio_estimado_hectarea_usd: number;
  precio_estimado_total_usd: number;
}

export interface TrazaMatching {
  gate_ok: boolean;
  regla_resuelta: ReglaResuelta | null;
  titular_exigido: TitularCertificacion | null;
  operadores_evaluados: number;
  /** Operadores habilitados por el paso (c). En alquiler, todos los verificados. */
  operadores_con_certificacion: number;
  anuncios_disponibles: number;
}

export type ResultadoMatching =
  | {
      estado: "rechazada";
      motivo: MotivoRechazo;
      mensaje: string;
      ofrecer_lista_espera: boolean;
      /** Sugerir cambiar de modalidad resuelve algunos rechazos sin salir de la zona. */
      sugerir_modalidad: Modalidad | null;
      regla_aplicada: ReglaCumplimiento | null;
      opciones: [];
      traza: TrazaMatching;
    }
  | {
      estado: "asignable";
      motivo: null;
      mensaje: string;
      ofrecer_lista_espera: false;
      sugerir_modalidad: null;
      regla_aplicada: ReglaCumplimiento;
      regla_resuelta: ReglaResuelta;
      opciones: OpcionMatching[];
      traza: TrazaMatching;
    };

function trazaBase(overrides: Partial<TrazaMatching> = {}): TrazaMatching {
  return {
    gate_ok: false,
    regla_resuelta: null,
    titular_exigido: null,
    operadores_evaluados: 0,
    operadores_con_certificacion: 0,
    anuncios_disponibles: 0,
    ...overrides,
  };
}

function redondear(valor: number, decimales: number): number {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}

/**
 * Motor de matching. Función pura: recibe todo el dataset y la solicitud, y
 * ejecuta en orden los pasos (a) gate de activación, (b) resolución de regla,
 * (c) filtro de cumplimiento, (d) filtro de capacidad, (e) ordenamiento y
 * (f) armado de opciones.
 *
 * El paso (c) es el que depende de la modalidad: la certificación se le exige
 * a quien va a aplicar el producto, que con piloto es el operador y en
 * alquiler es el propio productor.
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
      sugerir_modalidad: null,
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
      sugerir_modalidad: null,
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
      sugerir_modalidad: null,
      regla_aplicada: resuelta.regla,
      opciones: [],
      traza: trazaBase({ gate_ok: true, regla_resuelta: resuelta }),
    };
  }

  const regla = resuelta.regla;
  const productor = dataset.productores.find(
    (p) => p.id === entrada.productor_id,
  );

  if (!productor) {
    return {
      estado: "rechazada",
      motivo: "productor_desconocido",
      mensaje: "No encontramos el productor asociado a la solicitud.",
      ofrecer_lista_espera: false,
      sugerir_modalidad: null,
      regla_aplicada: regla,
      opciones: [],
      traza: trazaBase({ gate_ok: true, regla_resuelta: resuelta }),
    };
  }

  // ── (c) Filtro de cumplimiento ───────────────────────────────────────────
  const titular = titularExigido(entrada.modalidad);

  // El equipo tiene que estar en el país donde se hace el trabajo, en las dos
  // modalidades: un dron con base en Cuiabá no se alquila para el Valle del
  // Cauca. Con piloto esto quedaba implícito porque la certificación del
  // operador se valida contra el país de la regla; en alquiler la licencia es
  // del productor, así que el filtro tiene que ser explícito.
  const operadoresVerificados = dataset.operadores.filter(
    (o) => o.verificado && o.pais_base_id === entrada.pais_id,
  );

  const traza = trazaBase({
    gate_ok: true,
    regla_resuelta: resuelta,
    titular_exigido: titular,
    operadores_evaluados: operadoresVerificados.length,
  });

  /** La certificación que respalda a cada operador habilitado. */
  const respaldos = new Map<string, Certificacion>();

  if (titular === "productor") {
    // Alquiler: vuela el productor, así que la licencia tiene que ser suya.
    const propia = buscarRespaldo(
      dataset.certificaciones,
      regla,
      { tipo: "productor", id: productor.id },
      hoy,
    );

    if (!propia) {
      return {
        estado: "rechazada",
        motivo: "productor_sin_certificacion",
        mensaje:
          `En alquiler volás vos, así que la licencia tiene que estar a tu ` +
          `nombre: acá se exige «${regla.certificacion_requerida}» vigente y ` +
          `no la tenés cargada. Pedí el mismo trabajo con piloto y lo ` +
          `resolvés hoy — la licencia la pone el operador.`,
        ofrecer_lista_espera: false,
        sugerir_modalidad: "con_piloto",
        regla_aplicada: regla,
        opciones: [],
        traza,
      };
    }

    // Con la licencia del productor en regla, cualquier operador verificado
    // puede prestar el equipo.
    for (const operador of operadoresVerificados) {
      respaldos.set(operador.id, propia);
    }
  } else {
    // Con piloto: aplica el operador, así que la licencia es del operador.
    for (const operador of operadoresVerificados) {
      const cert = buscarRespaldo(
        dataset.certificaciones,
        regla,
        { tipo: "operador", id: operador.id },
        hoy,
      );
      if (cert) respaldos.set(operador.id, cert);
    }

    if (respaldos.size === 0) {
      return {
        estado: "rechazada",
        motivo: "sin_operadores_certificados",
        mensaje:
          `La zona está habilitada, pero hoy ningún operador verificado con ` +
          `base en ${pais!.nombre} tiene la certificación ` +
          `«${regla.certificacion_requerida}» vigente.`,
        ofrecer_lista_espera: true,
        sugerir_modalidad: null,
        regla_aplicada: regla,
        opciones: [],
        traza,
      };
    }
  }

  traza.operadores_con_certificacion = respaldos.size;

  // ── (d) Filtro de capacidad ──────────────────────────────────────────────
  const combinaciones = dataset.anuncios
    .filter(
      (a) =>
        a.activo &&
        a.modalidad === entrada.modalidad &&
        a.servicios_ofrecidos.includes(entrada.servicio),
    )
    .map((anuncio) => {
      const dron = dataset.drones.find((d) => d.id === anuncio.dron_id);
      return { anuncio, dron };
    })
    .filter(
      (c): c is { anuncio: Anuncio; dron: Dron } =>
        c.dron !== undefined && respaldos.has(c.dron.operador_id),
    )
    .map(({ anuncio, dron }) => ({
      anuncio,
      dron,
      operador: operadoresVerificados.find((o) => o.id === dron.operador_id)!,
      certificacion: respaldos.get(dron.operador_id)!,
    }));

  traza.anuncios_disponibles = combinaciones.length;

  if (combinaciones.length === 0) {
    const otraModalidad: Modalidad =
      entrada.modalidad === "alquiler" ? "con_piloto" : "alquiler";
    const hayEnLaOtra = dataset.anuncios.some(
      (a) =>
        a.activo &&
        a.modalidad === otraModalidad &&
        a.servicios_ofrecidos.includes(entrada.servicio),
    );
    return {
      estado: "rechazada",
      motivo: "sin_capacidad",
      mensaje:
        entrada.modalidad === "alquiler"
          ? `Nadie tiene un dron publicado en alquiler para ${entrada.servicio} ` +
            `en esta zona.`
          : `Hay operadores certificados, pero ninguno tiene un anuncio con ` +
            `piloto para el servicio solicitado.`,
      ofrecer_lista_espera: true,
      sugerir_modalidad: hayEnLaOtra ? otraModalidad : null,
      regla_aplicada: regla,
      opciones: [],
      traza,
    };
  }

  // ── (e) Ordenamiento: cercanía, luego rating ─────────────────────────────
  const opciones: OpcionMatching[] = combinaciones
    .map(({ anuncio, dron, operador, certificacion }) => {
      const distancia_km = distanciaKm(
        productor.ubicacion_lat,
        productor.ubicacion_lng,
        operador.ubicacion_lat,
        operador.ubicacion_lng,
      );
      const horas_vuelo = entrada.hectareas / dron.hectareas_por_hora;
      const horas_traslado = (2 * distancia_km) / VELOCIDAD_TRASLADO_KMH;

      let dias_alquiler: number | null = null;
      let total: number;

      if (anuncio.modalidad === "alquiler") {
        // El cliente retira el equipo: no hay costo de movilización del
        // operador, se factura por jornada de uso.
        dias_alquiler = Math.max(
          1,
          Math.ceil(horas_vuelo / anuncio.horas_por_jornada),
        );
        total = (anuncio.precio_dia_usd ?? 0) * dias_alquiler;
      } else {
        const costo_traslado = distancia_km * COSTO_TRASLADO_USD_KM;
        total = (anuncio.precio_hectarea_usd ?? 0) * entrada.hectareas +
          costo_traslado;
      }

      return {
        operador,
        dron,
        anuncio,
        modalidad: anuncio.modalidad,
        certificacion,
        titular_certificacion: titular,
        distancia_km: redondear(distancia_km, 1),
        horas_vuelo: redondear(horas_vuelo, 1),
        horas_traslado: redondear(horas_traslado, 1),
        tiempo_estimado_horas: redondear(horas_vuelo + horas_traslado, 1),
        dias_alquiler,
        precio_estimado_hectarea_usd: redondear(total / entrada.hectareas, 2),
        precio_estimado_total_usd: redondear(total, 2),
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
  const comoTexto =
    entrada.modalidad === "alquiler" ? "en alquiler" : "con piloto";

  return {
    estado: "asignable",
    motivo: null,
    mensaje:
      `${opciones.length} ${opciones.length === 1 ? "anuncio" : "anuncios"} ` +
      `${comoTexto} habilitados por la regla ${resuelta.especificidad} ` +
      `vigente en ${region!.nombre}.`,
    ofrecer_lista_espera: false,
    sugerir_modalidad: null,
    regla_aplicada: regla,
    regla_resuelta: resuelta,
    opciones,
    traza,
  };
}
