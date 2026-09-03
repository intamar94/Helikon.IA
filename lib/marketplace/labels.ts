import type {
  EstadoGeografico,
  EstadoSolicitud,
  Modalidad,
  Servicio,
} from "./types";

export const ETIQUETA_SERVICIO: Record<Servicio, string> = {
  fumigacion: "Fumigación",
  mapeo_ndvi: "Mapeo NDVI",
  siembra: "Siembra",
  dispersion_solidos: "Dispersión de sólidos",
};

export const ETIQUETA_MODALIDAD: Record<Modalidad, string> = {
  con_piloto: "Con piloto",
  alquiler: "Alquiler del equipo",
};

/** Qué recibe el productor en cada modalidad, en una línea. */
export const DESCRIPCION_MODALIDAD: Record<Modalidad, string> = {
  con_piloto:
    "El operador va al campo y aplica. La licencia la pone él.",
  alquiler:
    "Retirás el equipo y volás vos. La licencia tiene que estar a tu nombre.",
};

/** Cómo se cobra cada modalidad. */
export const UNIDAD_PRECIO: Record<Modalidad, string> = {
  con_piloto: "por hectárea",
  alquiler: "por jornada",
};

export const CLASES_MODALIDAD: Record<Modalidad, string> = {
  con_piloto: "bg-sky-100 text-sky-900 ring-sky-600/30",
  alquiler: "bg-violet-100 text-violet-900 ring-violet-600/30",
};

export const ETIQUETA_ESTADO: Record<EstadoGeografico, string> = {
  activo: "Activo",
  en_revision: "En revisión",
  mapeado: "Mapeado",
};

export const ETIQUETA_ESTADO_SOLICITUD: Record<EstadoSolicitud, string> = {
  pendiente: "Pendiente",
  asignada: "Asignada",
  completada: "Completada",
  rechazada: "Rechazada",
};

/** Clases Tailwind del badge por estado (verde / amarillo / gris). */
export const CLASES_BADGE: Record<EstadoGeografico, string> = {
  activo: "bg-emerald-100 text-emerald-800 ring-emerald-600/30",
  en_revision: "bg-amber-100 text-amber-900 ring-amber-600/30",
  mapeado: "bg-slate-200 text-slate-700 ring-slate-500/30",
};

export const CLASES_PUNTO: Record<EstadoGeografico, string> = {
  activo: "bg-emerald-500",
  en_revision: "bg-amber-500",
  mapeado: "bg-slate-400",
};

/** Texto del CTA por estado, según la vista de cobertura. */
export function ctaPorEstado(estado: EstadoGeografico): string {
  return estado === "activo" ? "Solicitar servicio" : "Notificarme";
}

export const CULTIVOS_SUGERIDOS = [
  "banano",
  "cafe",
  "maiz",
  "soja",
  "arroz",
  "caña de azúcar",
  "palma de aceite",
];

export function formatearUSD(valor: number): string {
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(valor);
}

export function formatearHoras(horas: number): string {
  if (horas < 1) return `${Math.round(horas * 60)} min`;
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** pluralizar(1, "jornada", "jornadas") → "1 jornada" */
export function pluralizar(n: number, uno: string, varios: string): string {
  return `${n} ${n === 1 ? uno : varios}`;
}
