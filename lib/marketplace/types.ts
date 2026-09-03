// Modelo de dominio del marketplace de drones agrícolas.
// Los nombres de campos replican exactamente las columnas de
// `supabase/marketplace_schema.sql` para que el mapeo sea directo.

export type EstadoGeografico = "mapeado" | "en_revision" | "activo";

export const ESTADOS_GEOGRAFICOS: EstadoGeografico[] = [
  "mapeado",
  "en_revision",
  "activo",
];

export type Servicio =
  | "fumigacion"
  | "mapeo_ndvi"
  | "siembra"
  | "dispersion_solidos";

export const SERVICIOS: Servicio[] = [
  "fumigacion",
  "mapeo_ndvi",
  "siembra",
  "dispersion_solidos",
];

export type EstadoSolicitud =
  | "pendiente"
  | "asignada"
  | "completada"
  | "rechazada";

export type TipoUsuario = "operador" | "productor";

export interface Pais {
  id: string;
  nombre: string;
  codigo_iso: string;
  estado: EstadoGeografico;
  fecha_activacion: string | null;
}

export interface Region {
  id: string;
  pais_id: string;
  nombre: string;
  estado: EstadoGeografico;
}

export interface ReglaCumplimiento {
  id: string;
  pais_id: string;
  /** NULL => la regla aplica a todo el país. */
  region_id: string | null;
  cultivo: string;
  servicio: Servicio;
  certificacion_requerida: string;
  producto_permitido: string;
  verificada: boolean;
  verificada_por: string | null;
  fecha_verificacion: string | null;
  activa: boolean;
}

export interface Operador {
  id: string;
  nombre: string;
  email: string;
  pais_base_id: string;
  verificado: boolean;
  rating: number;
  /**
   * Ubicación de la base de operaciones. No aparece en el enunciado pero el
   * paso (e) del matching ordena "por cercanía a la ubicación del productor",
   * lo que exige una coordenada del lado del operador.
   */
  ubicacion_lat: number;
  ubicacion_lng: number;
}

export interface CertificacionOperador {
  id: string;
  operador_id: string;
  pais_id: string;
  tipo_certificacion: string;
  numero: string;
  /** ISO date (YYYY-MM-DD). */
  vigente_hasta: string;
  documento_url: string | null;
  /** Revisión documental del panel admin. */
  documento_revisado: boolean;
}

export interface Dron {
  id: string;
  operador_id: string;
  modelo: string;
  capacidad_carga_litros: number;
  servicios_ofrecidos: Servicio[];
  hectareas_por_hora: number;
  /** Tarifa de referencia usada para el precio estimado del paso (f). */
  precio_base_hectarea_usd: number;
}

export interface Productor {
  id: string;
  nombre: string;
  email: string;
  pais_id: string;
  region_id: string;
  ubicacion_lat: number;
  ubicacion_lng: number;
}

export interface Solicitud {
  id: string;
  productor_id: string;
  pais_id: string;
  region_id: string;
  cultivo: string;
  servicio: Servicio;
  hectareas: number;
  /** ISO date (YYYY-MM-DD). */
  fecha_deseada: string;
  producto_a_aplicar: string;
  estado: EstadoSolicitud;
  motivo_rechazo: string | null;
  regla_aplicada_id: string | null;
  creada_en: string;
}

export interface ListaEspera {
  id: string;
  email: string;
  pais_id: string;
  region_id: string | null;
  tipo_usuario: TipoUsuario;
  fecha: string;
}

/** Datos de entrada de una solicitud, antes de persistirla. */
export interface EntradaSolicitud {
  productor_id: string;
  pais_id: string;
  region_id: string;
  cultivo: string;
  servicio: Servicio;
  hectareas: number;
  fecha_deseada: string;
  producto_a_aplicar: string;
}

/** Conjunto de datos que consume el motor de matching (función pura). */
export interface DatasetMatching {
  paises: Pais[];
  regiones: Region[];
  reglas: ReglaCumplimiento[];
  operadores: Operador[];
  certificaciones: CertificacionOperador[];
  drones: Dron[];
  productores: Productor[];
}
