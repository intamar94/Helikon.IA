import type { ReglaCumplimiento, Servicio } from "./types";

export interface ConsultaRegla {
  pais_id: string;
  region_id: string | null;
  cultivo: string;
  servicio: Servicio;
}

export type Especificidad = "regional" | "nacional";

export interface ReglaResuelta {
  regla: ReglaCumplimiento;
  especificidad: Especificidad;
  /** Regla nacional que quedó desplazada, cuando ganó una regional. */
  desplazada: ReglaCumplimiento | null;
}

const coincide = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

function aplicaA(regla: ReglaCumplimiento, consulta: ConsultaRegla): boolean {
  return (
    regla.activa &&
    regla.pais_id === consulta.pais_id &&
    coincide(regla.cultivo, consulta.cultivo) &&
    regla.servicio === consulta.servicio
  );
}

/**
 * Resolución jerárquica de reglas de cumplimiento.
 *
 * - Una regla con `region_id = NULL` aplica a todo el país.
 * - Una regla de la región específica PISA a la nacional (mayor
 *   especificidad gana), sin importar el estado de verificación de ninguna
 *   de las dos: la especificidad decide qué regla rige, y la verificación
 *   decide después si esa regla habilita o no la transacción.
 *
 * Devuelve `null` sólo cuando no hay ninguna regla activa aplicable.
 */
export function resolverRegla(
  reglas: ReglaCumplimiento[],
  consulta: ConsultaRegla,
): ReglaResuelta | null {
  const aplicables = reglas.filter((r) => aplicaA(r, consulta));

  const regionales = consulta.region_id
    ? aplicables.filter((r) => r.region_id === consulta.region_id)
    : [];
  const nacionales = aplicables.filter((r) => r.region_id === null);

  // Ante empate dentro del mismo nivel gana la verificada, y entre esas la
  // de verificación más reciente: es la que refleja la normativa vigente.
  const preferida = (candidatas: ReglaCumplimiento[]) =>
    [...candidatas].sort((a, b) => {
      if (a.verificada !== b.verificada) return a.verificada ? -1 : 1;
      return (b.fecha_verificacion ?? "").localeCompare(
        a.fecha_verificacion ?? "",
      );
    })[0];

  if (regionales.length > 0) {
    return {
      regla: preferida(regionales),
      especificidad: "regional",
      desplazada: nacionales.length > 0 ? preferida(nacionales) : null,
    };
  }

  if (nacionales.length > 0) {
    return {
      regla: preferida(nacionales),
      especificidad: "nacional",
      desplazada: null,
    };
  }

  return null;
}

/** Una regla sin verificar nunca habilita una transacción. */
export function reglaHabilita(regla: ReglaCumplimiento): boolean {
  return regla.activa && regla.verificada;
}

/**
 * ¿Un país cumple el requisito para pasar a `activo`?
 * Necesita al menos una regla activa y verificada.
 */
export function paisPuedeActivarse(
  reglas: ReglaCumplimiento[],
  pais_id: string,
): boolean {
  return reglas.some((r) => r.pais_id === pais_id && r.activa && r.verificada);
}

/**
 * ¿Ya existe otra regla activa en el mismo nivel de especificidad para ese
 * cultivo y servicio? El esquema lo impide con índices únicos parciales; esta
 * función replica el chequeo para que el store en memoria se comporte igual y
 * el panel devuelva un mensaje entendible en vez de un error de Postgres.
 */
export function reglaEnConflicto(
  reglas: ReglaCumplimiento[],
  candidata: Pick<
    ReglaCumplimiento,
    "pais_id" | "region_id" | "cultivo" | "servicio" | "activa"
  >,
  idExcluido?: string,
): ReglaCumplimiento | null {
  if (!candidata.activa) return null;
  return (
    reglas.find(
      (r) =>
        r.id !== idExcluido &&
        r.activa &&
        r.servicio === candidata.servicio &&
        coincide(r.cultivo, candidata.cultivo) &&
        (candidata.region_id === null
          ? r.region_id === null && r.pais_id === candidata.pais_id
          : r.region_id === candidata.region_id),
    ) ?? null
  );
}
