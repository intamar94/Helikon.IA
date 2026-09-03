import type { EstadoGeografico, EstadoSolicitud, Servicio } from "./types";

export const ETIQUETA_SERVICIO: Record<Servicio, string> = {
  fumigacion: "Fumigación",
  mapeo_ndvi: "Mapeo NDVI",
  siembra: "Siembra",
  dispersion_solidos: "Dispersión de sólidos",
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
