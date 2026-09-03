import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  AltaListaEspera,
  AltaOperador,
  AsignacionSolicitud,
  MarketplaceRepository,
  NuevaRegla,
} from "./repository";
import type {
  Anuncio,
  Certificacion,
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

const TABLAS = {
  paises: "mkt_paises",
  regiones: "mkt_regiones",
  reglas: "mkt_reglas_cumplimiento",
  operadores: "mkt_operadores",
  certificaciones: "mkt_certificaciones",
  drones: "mkt_drones",
  anuncios: "mkt_anuncios",
  productores: "mkt_productores",
  solicitudes: "mkt_solicitudes",
  lista_espera: "mkt_lista_espera",
} as const;

function cliente(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // La escritura del panel admin necesita saltear RLS; con anon key funciona
  // sólo si las políticas lo permiten.
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "MARKETPLACE_DATA_SOURCE=supabase requiere NEXT_PUBLIC_SUPABASE_URL y " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY (o SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function seleccionar<T>(db: SupabaseClient, tabla: string): Promise<T[]> {
  const { data, error } = await db.from(tabla).select("*");
  if (error) throw new Error(`Supabase ${tabla}: ${error.message}`);
  return (data ?? []) as T[];
}

async function unaFila<T>(
  consulta: PromiseLike<{ data: unknown; error: { message: string } | null }>,
  tabla: string,
): Promise<T> {
  const { data, error } = await consulta;
  if (error) throw new Error(`Supabase ${tabla}: ${error.message}`);
  if (!data) throw new Error(`Supabase ${tabla}: sin filas devueltas`);
  return data as T;
}

export function crearRepositorioSupabase(): MarketplaceRepository {
  const db = cliente();

  const repo: MarketplaceRepository = {
    fuente: "supabase",

    async cargarDataset(): Promise<DatasetMatching> {
      const [
        paises,
        regiones,
        reglas,
        operadores,
        certificaciones,
        drones,
        anuncios,
        productores,
      ] = await Promise.all([
        seleccionar<Pais>(db, TABLAS.paises),
        seleccionar<Region>(db, TABLAS.regiones),
        seleccionar<ReglaCumplimiento>(db, TABLAS.reglas),
        seleccionar<Operador>(db, TABLAS.operadores),
        seleccionar<Certificacion>(db, TABLAS.certificaciones),
        seleccionar<Dron>(db, TABLAS.drones),
        seleccionar<Anuncio>(db, TABLAS.anuncios),
        seleccionar<Productor>(db, TABLAS.productores),
      ]);
      return {
        paises,
        regiones,
        reglas,
        operadores,
        certificaciones,
        drones,
        anuncios,
        productores,
      };
    },

    listarPaises: () => seleccionar<Pais>(db, TABLAS.paises),
    listarRegiones: () => seleccionar<Region>(db, TABLAS.regiones),
    listarReglas: () => seleccionar<ReglaCumplimiento>(db, TABLAS.reglas),
    listarOperadores: () => seleccionar<Operador>(db, TABLAS.operadores),
    listarCertificaciones: () =>
      seleccionar<Certificacion>(db, TABLAS.certificaciones),
    listarDrones: () => seleccionar<Dron>(db, TABLAS.drones),
    listarAnuncios: () => seleccionar<Anuncio>(db, TABLAS.anuncios),
    listarProductores: () => seleccionar<Productor>(db, TABLAS.productores),
    listarSolicitudes: () => seleccionar<Solicitud>(db, TABLAS.solicitudes),
    listarListaEspera: () => seleccionar<ListaEspera>(db, TABLAS.lista_espera),

    async actualizarEstadoPais(id: string, estado: EstadoGeografico) {
      const parche: Partial<Pais> = { estado };
      if (estado === "activo") {
        parche.fecha_activacion = new Date().toISOString().slice(0, 10);
      } else {
        parche.fecha_activacion = null;
      }
      return unaFila<Pais>(
        db.from(TABLAS.paises).update(parche).eq("id", id).select().single(),
        TABLAS.paises,
      );
    },

    async actualizarEstadoRegion(id: string, estado: EstadoGeografico) {
      return unaFila<Region>(
        db
          .from(TABLAS.regiones)
          .update({ estado })
          .eq("id", id)
          .select()
          .single(),
        TABLAS.regiones,
      );
    },

    async crearRegla(nueva: NuevaRegla) {
      return unaFila<ReglaCumplimiento>(
        db
          .from(TABLAS.reglas)
          .insert({
            ...nueva,
            fecha_verificacion: nueva.verificada
              ? new Date().toISOString().slice(0, 10)
              : null,
          })
          .select()
          .single(),
        TABLAS.reglas,
      );
    },

    async actualizarRegla(id: string, cambios: Partial<NuevaRegla>) {
      const parche: Record<string, unknown> = { ...cambios };
      if (cambios.verificada === true) {
        parche.fecha_verificacion = new Date().toISOString().slice(0, 10);
      }
      if (cambios.verificada === false) {
        parche.fecha_verificacion = null;
        parche.verificada_por = null;
      }
      return unaFila<ReglaCumplimiento>(
        db.from(TABLAS.reglas).update(parche).eq("id", id).select().single(),
        TABLAS.reglas,
      );
    },

    async eliminarRegla(id: string) {
      const { error } = await db.from(TABLAS.reglas).delete().eq("id", id);
      if (error) throw new Error(`Supabase ${TABLAS.reglas}: ${error.message}`);
    },

    async crearOperador(alta: AltaOperador) {
      const operador = await unaFila<Operador>(
        db
          .from(TABLAS.operadores)
          .insert({
            nombre: alta.nombre,
            email: alta.email,
            pais_base_id: alta.pais_base_id,
            ubicacion_lat: alta.ubicacion_lat,
            ubicacion_lng: alta.ubicacion_lng,
            verificado: false,
            rating: 0,
          })
          .select()
          .single(),
        TABLAS.operadores,
      );

      if (alta.certificaciones.length > 0) {
        const { error } = await db.from(TABLAS.certificaciones).insert(
          alta.certificaciones.map((c) => ({
            ...c,
            titular_tipo: "operador",
            titular_id: operador.id,
            documento_revisado: false,
          })),
        );
        if (error) {
          throw new Error(`Supabase ${TABLAS.certificaciones}: ${error.message}`);
        }
      }

      for (const dron of alta.drones) {
        const fila = await unaFila<Dron>(
          db
            .from(TABLAS.drones)
            .insert({
              operador_id: operador.id,
              modelo: dron.modelo,
              capacidad_carga_litros: dron.capacidad_carga_litros,
              hectareas_por_hora: dron.hectareas_por_hora,
            })
            .select()
            .single(),
          TABLAS.drones,
        );
        if (dron.anuncios.length > 0) {
          const { error } = await db.from(TABLAS.anuncios).insert(
            dron.anuncios.map((a) => ({ ...a, dron_id: fila.id, activo: true })),
          );
          if (error) {
            throw new Error(`Supabase ${TABLAS.anuncios}: ${error.message}`);
          }
        }
      }

      return operador;
    },

    async verificarOperador(id: string, verificado: boolean) {
      return unaFila<Operador>(
        db
          .from(TABLAS.operadores)
          .update({ verificado })
          .eq("id", id)
          .select()
          .single(),
        TABLAS.operadores,
      );
    },

    async revisarDocumento(certificacionId: string, revisado: boolean) {
      return unaFila<Certificacion>(
        db
          .from(TABLAS.certificaciones)
          .update({ documento_revisado: revisado })
          .eq("id", certificacionId)
          .select()
          .single(),
        TABLAS.certificaciones,
      );
    },

    async registrarSolicitud(datos) {
      return unaFila<Solicitud>(
        db.from(TABLAS.solicitudes).insert(datos).select().single(),
        TABLAS.solicitudes,
      );
    },

    async obtenerSolicitud(id: string) {
      const { data, error } = await db
        .from(TABLAS.solicitudes)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        throw new Error(`Supabase ${TABLAS.solicitudes}: ${error.message}`);
      }
      return (data as Solicitud | null) ?? null;
    },

    async asignarSolicitud(id: string, asignacion: AsignacionSolicitud) {
      return unaFila<Solicitud>(
        db
          .from(TABLAS.solicitudes)
          .update({
            ...asignacion,
            estado: "asignada",
            fecha_asignacion: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single(),
        TABLAS.solicitudes,
      );
    },

    async agregarListaEspera(alta: AltaListaEspera) {
      return unaFila<ListaEspera>(
        db.from(TABLAS.lista_espera).insert(alta).select().single(),
        TABLAS.lista_espera,
      );
    },
  };

  return repo;
}
