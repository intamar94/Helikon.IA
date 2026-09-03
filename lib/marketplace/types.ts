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

/**
 * Modalidad de la publicación. Define quién opera el dron y, con eso, a quién
 * le exige la certificación el motor de cumplimiento.
 *  - con_piloto: va el operador y aplica. La certificación es del operador.
 *  - alquiler:   el propietario presta el equipo y vuela el cliente. La
 *                certificación se le exige al PRODUCTOR.
 */
export type Modalidad = "con_piloto" | "alquiler";

export const MODALIDADES: Modalidad[] = ["con_piloto", "alquiler"];

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

/** Un titular de certificaciones puede ser cualquiera de los dos lados. */
export type TitularCertificacion = TipoUsuario;

export interface Certificacion {
  id: string;
  /** 'operador' o 'productor': quién es el dueño de la licencia. */
  titular_tipo: TitularCertificacion;
  titular_id: string;
  pais_id: string;
  tipo_certificacion: string;
  numero: string;
  /** ISO date (YYYY-MM-DD). */
  vigente_hasta: string;
  documento_url: string | null;
  /** Revisión documental del panel admin. */
  documento_revisado: boolean;
}

/** El equipo físico. Lo comercial vive en `Anuncio`. */
export interface Dron {
  id: string;
  operador_id: string;
  modelo: string;
  capacidad_carga_litros: number;
  hectareas_por_hora: number;
}

/**
 * La publicación: un mismo dron puede estar anunciado dos veces, con piloto y
 * en alquiler, a precios distintos. Es la unidad que se reserva.
 */
export interface Anuncio {
  id: string;
  dron_id: string;
  modalidad: Modalidad;
  servicios_ofrecidos: Servicio[];
  /** Tarifa del servicio con piloto. Null en anuncios de alquiler. */
  precio_hectarea_usd: number | null;
  /** Tarifa diaria del alquiler. Null en anuncios con piloto. */
  precio_dia_usd: number | null;
  /** Jornada operativa asumida para convertir horas de vuelo en días. */
  horas_por_jornada: number;
  activo: boolean;
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
  modalidad: Modalidad;
  hectareas: number;
  /** ISO date (YYYY-MM-DD). */
  fecha_deseada: string;
  producto_a_aplicar: string;
  estado: EstadoSolicitud;
  motivo_rechazo: string | null;
  regla_aplicada_id: string | null;
  /** Se completan al reservar una opción (estado pasa a 'asignada'). */
  anuncio_asignado_id: string | null;
  operador_asignado_id: string | null;
  precio_acordado_usd: number | null;
  fecha_asignacion: string | null;
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
  modalidad: Modalidad;
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
  certificaciones: Certificacion[];
  drones: Dron[];
  anuncios: Anuncio[];
  productores: Productor[];
}
