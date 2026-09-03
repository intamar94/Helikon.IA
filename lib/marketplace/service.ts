import { paisPuedeActivarse, reglaEnConflicto } from "./compliance";
import { regionPuedeActivarse } from "./geo";
import {
  ejecutarMatching,
  type OpcionMatching,
  type ResultadoMatching,
} from "./matching";
import type { MarketplaceRepository, NuevaRegla } from "./repository";
import type {
  EntradaSolicitud,
  EstadoGeografico,
  Pais,
  Region,
  ReglaCumplimiento,
  Solicitud,
} from "./types";

export class ErrorValidacion extends Error {
  readonly status = 422;
}

export interface RespuestaSolicitud {
  resultado: ResultadoMatching;
  solicitud: Solicitud;
}

/**
 * Crea la solicitud, corre el motor de matching y persiste el desenlace.
 * La solicitud queda registrada siempre — también cuando se rechaza — porque
 * el rechazo es la señal de demanda que alimenta la priorización de países.
 */
export async function procesarSolicitud(
  repo: MarketplaceRepository,
  entrada: EntradaSolicitud,
  hoy: Date = new Date(),
): Promise<RespuestaSolicitud> {
  const dataset = await repo.cargarDataset();
  const resultado = ejecutarMatching(dataset, entrada, hoy);

  const solicitud = await repo.registrarSolicitud({
    productor_id: entrada.productor_id,
    pais_id: entrada.pais_id,
    region_id: entrada.region_id,
    cultivo: entrada.cultivo,
    servicio: entrada.servicio,
    modalidad: entrada.modalidad,
    hectareas: entrada.hectareas,
    fecha_deseada: entrada.fecha_deseada,
    producto_a_aplicar: entrada.producto_a_aplicar,
    estado: resultado.estado === "asignable" ? "pendiente" : "rechazada",
    motivo_rechazo: resultado.motivo,
    regla_aplicada_id: resultado.regla_aplicada?.id ?? null,
    anuncio_asignado_id: null,
    operador_asignado_id: null,
    precio_acordado_usd: null,
    fecha_asignacion: null,
  });

  return { resultado, solicitud };
}

/**
 * Cambio de estado de un país con la validación crítica del panel admin:
 * marcarlo `activo` exige al menos una regla de cumplimiento verificada.
 */
export async function cambiarEstadoPais(
  repo: MarketplaceRepository,
  paisId: string,
  estado: EstadoGeografico,
): Promise<Pais> {
  if (estado === "activo") {
    const reglas = await repo.listarReglas();
    if (!paisPuedeActivarse(reglas, paisId)) {
      throw new ErrorValidacion(
        "No se puede activar el país: necesita al menos una regla de " +
          "cumplimiento activa y verificada.",
      );
    }
  }
  return repo.actualizarEstadoPais(paisId, estado);
}

/**
 * Cambio de estado de una región. Una región puede activarse aunque su país
 * siga `en_revision`, pero no si el país todavía está sólo `mapeado`.
 */
export async function cambiarEstadoRegion(
  repo: MarketplaceRepository,
  regionId: string,
  estado: EstadoGeografico,
): Promise<Region> {
  if (estado === "activo") {
    const [regiones, paises] = await Promise.all([
      repo.listarRegiones(),
      repo.listarPaises(),
    ]);
    const region = regiones.find((r) => r.id === regionId);
    if (!region) throw new ErrorValidacion(`Región ${regionId} no encontrada.`);
    const pais = paises.find((p) => p.id === region.pais_id);
    if (!pais || !regionPuedeActivarse(pais.estado)) {
      throw new ErrorValidacion(
        "No se puede activar la región: su país todavía está en estado " +
          "'mapeado'. Pasalo a 'en_revision' primero.",
      );
    }
  }
  return repo.actualizarEstadoRegion(regionId, estado);
}

/** Mensaje compartido por el alta y la edición de reglas. */
function mensajeConflicto(existente: ReglaCumplimiento): string {
  const alcance = existente.region_id
    ? "esa región"
    : "todo el país";
  return (
    `Ya existe una regla activa para ${alcance} con ese cultivo y servicio ` +
    `(${existente.id}). Editala o desactivala antes de crear otra: si hubiera ` +
    `dos, no quedaría claro cuál rige.`
  );
}

/** Alta de regla con el chequeo de unicidad por nivel de especificidad. */
export async function crearRegla(
  repo: MarketplaceRepository,
  nueva: NuevaRegla,
): Promise<ReglaCumplimiento> {
  const existente = reglaEnConflicto(await repo.listarReglas(), nueva);
  if (existente) throw new ErrorValidacion(mensajeConflicto(existente));
  return repo.crearRegla(nueva);
}

/** Edición de regla, con el mismo chequeo sobre el resultado del cambio. */
export async function actualizarRegla(
  repo: MarketplaceRepository,
  id: string,
  cambios: Partial<NuevaRegla>,
): Promise<ReglaCumplimiento> {
  const reglas = await repo.listarReglas();
  const actual = reglas.find((r) => r.id === id);
  if (!actual) throw new ErrorValidacion(`Regla ${id} no encontrada.`);

  const existente = reglaEnConflicto(reglas, { ...actual, ...cambios }, id);
  if (existente) throw new ErrorValidacion(mensajeConflicto(existente));

  return repo.actualizarRegla(id, cambios);
}

export interface ReservaConfirmada {
  solicitud: Solicitud;
  opcion: OpcionMatching;
}

/**
 * Reserva una de las opciones devueltas por el matching y deja la solicitud
 * en `asignada`.
 *
 * No confía en el precio ni en la habilitación que traiga el cliente: vuelve a
 * correr el motor con los datos actuales y sólo acepta el anuncio si sigue
 * apareciendo entre las opciones. Entre que se muestran los resultados y se
 * aprieta el botón, la normativa pudo cambiar — es justamente el escenario que
 * el producto promete cubrir.
 */
export async function reservarOpcion(
  repo: MarketplaceRepository,
  solicitudId: string,
  anuncioId: string,
  hoy: Date = new Date(),
): Promise<ReservaConfirmada> {
  const solicitud = await repo.obtenerSolicitud(solicitudId);
  if (!solicitud) {
    throw new ErrorValidacion(`Solicitud ${solicitudId} no encontrada.`);
  }
  if (solicitud.estado === "asignada") {
    throw new ErrorValidacion(
      "Esa solicitud ya tiene un anuncio reservado. Creá una nueva para " +
        "contratar otro.",
    );
  }
  if (solicitud.estado !== "pendiente") {
    throw new ErrorValidacion(
      `No se puede reservar una solicitud en estado «${solicitud.estado}».`,
    );
  }

  const dataset = await repo.cargarDataset();
  const resultado = ejecutarMatching(
    dataset,
    {
      productor_id: solicitud.productor_id,
      pais_id: solicitud.pais_id,
      region_id: solicitud.region_id,
      cultivo: solicitud.cultivo,
      servicio: solicitud.servicio,
      modalidad: solicitud.modalidad,
      hectareas: solicitud.hectareas,
      fecha_deseada: solicitud.fecha_deseada,
      producto_a_aplicar: solicitud.producto_a_aplicar,
    },
    hoy,
  );

  if (resultado.estado !== "asignable") {
    throw new ErrorValidacion(
      "La normativa cambió desde que viste los resultados y esta solicitud ya " +
        `no está habilitada: ${resultado.mensaje}`,
    );
  }

  const opcion = resultado.opciones.find((o) => o.anuncio.id === anuncioId);
  if (!opcion) {
    throw new ErrorValidacion(
      "Ese anuncio ya no está entre las opciones habilitadas. Volvé a buscar " +
        "para ver las vigentes.",
    );
  }

  const actualizada = await repo.asignarSolicitud(solicitudId, {
    anuncio_asignado_id: opcion.anuncio.id,
    operador_asignado_id: opcion.operador.id,
    precio_acordado_usd: opcion.precio_estimado_total_usd,
  });

  return { solicitud: actualizada, opcion };
}
