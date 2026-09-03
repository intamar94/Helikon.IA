import type {
  CertificacionOperador,
  DatasetMatching,
  Dron,
  EstadoGeografico,
  ListaEspera,
  Operador,
  Pais,
  Productor,
  Region,
  ReglaCumplimiento,
  Solicitud,
} from "./types";

export type FuenteDatos = "supabase" | "memoria";

export interface NuevaRegla {
  pais_id: string;
  region_id: string | null;
  cultivo: string;
  servicio: ReglaCumplimiento["servicio"];
  certificacion_requerida: string;
  producto_permitido: string;
  verificada: boolean;
  verificada_por: string | null;
  activa: boolean;
}

export interface AltaOperador {
  nombre: string;
  email: string;
  pais_base_id: string;
  ubicacion_lat: number;
  ubicacion_lng: number;
  certificaciones: Array<{
    pais_id: string;
    tipo_certificacion: string;
    numero: string;
    vigente_hasta: string;
    documento_url: string | null;
  }>;
  drones: Array<{
    modelo: string;
    capacidad_carga_litros: number;
    servicios_ofrecidos: Dron["servicios_ofrecidos"];
    hectareas_por_hora: number;
    precio_base_hectarea_usd: number;
  }>;
}

export interface AltaListaEspera {
  email: string;
  pais_id: string;
  region_id: string | null;
  tipo_usuario: ListaEspera["tipo_usuario"];
}

export interface MarketplaceRepository {
  fuente: FuenteDatos;

  cargarDataset(): Promise<DatasetMatching>;

  listarPaises(): Promise<Pais[]>;
  listarRegiones(): Promise<Region[]>;
  actualizarEstadoPais(id: string, estado: EstadoGeografico): Promise<Pais>;
  actualizarEstadoRegion(
    id: string,
    estado: EstadoGeografico,
  ): Promise<Region>;

  listarReglas(): Promise<ReglaCumplimiento[]>;
  crearRegla(regla: NuevaRegla): Promise<ReglaCumplimiento>;
  actualizarRegla(
    id: string,
    cambios: Partial<NuevaRegla>,
  ): Promise<ReglaCumplimiento>;
  eliminarRegla(id: string): Promise<void>;

  listarOperadores(): Promise<Operador[]>;
  listarCertificaciones(): Promise<CertificacionOperador[]>;
  listarDrones(): Promise<Dron[]>;
  crearOperador(alta: AltaOperador): Promise<Operador>;
  verificarOperador(id: string, verificado: boolean): Promise<Operador>;
  revisarDocumento(
    certificacionId: string,
    revisado: boolean,
  ): Promise<CertificacionOperador>;

  listarProductores(): Promise<Productor[]>;

  listarSolicitudes(): Promise<Solicitud[]>;
  registrarSolicitud(
    solicitud: Omit<Solicitud, "id" | "creada_en">,
  ): Promise<Solicitud>;

  listarListaEspera(): Promise<ListaEspera[]>;
  agregarListaEspera(alta: AltaListaEspera): Promise<ListaEspera>;
}

/**
 * Elige el backend de datos.
 *
 * Por defecto el MVP corre contra el repositorio en memoria (sembrado con
 * `seed-data.ts`) para que la demo funcione sin credenciales. Poniendo
 * `MARKETPLACE_DATA_SOURCE=supabase` — y con las tablas de
 * `supabase/marketplace_schema.sql` ya creadas — usa Supabase.
 */
export function getRepository(): MarketplaceRepository {
  if (process.env.MARKETPLACE_DATA_SOURCE === "supabase") {
    // Import diferido: evita cargar el cliente de Supabase cuando no se usa.
    const { crearRepositorioSupabase } =
      require("./repository-supabase") as typeof import("./repository-supabase");
    return crearRepositorioSupabase();
  }
  const { repositorioMemoria } =
    require("./repository-memory") as typeof import("./repository-memory");
  return repositorioMemoria;
}
