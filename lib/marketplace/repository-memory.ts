import {
  CERTIFICACIONES_SEED,
  DRONES_SEED,
  LISTA_ESPERA_SEED,
  OPERADORES_SEED,
  PAISES_SEED,
  PRODUCTORES_SEED,
  REGIONES_SEED,
  REGLAS_SEED,
  SOLICITUDES_SEED,
} from "./seed-data";
import type {
  AltaListaEspera,
  AltaOperador,
  MarketplaceRepository,
  NuevaRegla,
} from "./repository";
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

interface Store {
  paises: Pais[];
  regiones: Region[];
  reglas: ReglaCumplimiento[];
  operadores: Operador[];
  certificaciones: CertificacionOperador[];
  drones: Dron[];
  productores: Productor[];
  solicitudes: Solicitud[];
  lista_espera: ListaEspera[];
}

function sembrar(): Store {
  return {
    paises: PAISES_SEED.map((p) => ({ ...p })),
    regiones: REGIONES_SEED.map((r) => ({ ...r })),
    reglas: REGLAS_SEED.map((r) => ({ ...r })),
    operadores: OPERADORES_SEED.map((o) => ({ ...o })),
    certificaciones: CERTIFICACIONES_SEED.map((c) => ({ ...c })),
    drones: DRONES_SEED.map((d) => ({
      ...d,
      servicios_ofrecidos: [...d.servicios_ofrecidos],
    })),
    productores: PRODUCTORES_SEED.map((p) => ({ ...p })),
    solicitudes: SOLICITUDES_SEED.map((s) => ({ ...s })),
    lista_espera: LISTA_ESPERA_SEED.map((l) => ({ ...l })),
  };
}

// El store vive en el módulo para sobrevivir entre requests dentro del mismo
// proceso de Next. Es volátil por diseño: es el modo demo, no persistencia.
const globalRef = globalThis as typeof globalThis & {
  __helikonMarketplaceStore?: Store;
};

function store(): Store {
  if (!globalRef.__helikonMarketplaceStore) {
    globalRef.__helikonMarketplaceStore = sembrar();
  }
  return globalRef.__helikonMarketplaceStore;
}

/** Sólo para tests y para la página de demo determinista. */
export function reiniciarStore(): void {
  globalRef.__helikonMarketplaceStore = sembrar();
}

let contador = 0;
function nuevoId(prefijo: string): string {
  contador += 1;
  return `${prefijo}-${Date.now().toString(36)}-${contador}`;
}

const clonar = <T,>(valor: T): T => JSON.parse(JSON.stringify(valor)) as T;

export const repositorioMemoria: MarketplaceRepository = {
  fuente: "memoria",

  async cargarDataset(): Promise<DatasetMatching> {
    const s = store();
    return clonar({
      paises: s.paises,
      regiones: s.regiones,
      reglas: s.reglas,
      operadores: s.operadores,
      certificaciones: s.certificaciones,
      drones: s.drones,
      productores: s.productores,
    });
  },

  async listarPaises() {
    return clonar(store().paises);
  },

  async listarRegiones() {
    return clonar(store().regiones);
  },

  async actualizarEstadoPais(id, estado: EstadoGeografico) {
    const pais = store().paises.find((p) => p.id === id);
    if (!pais) throw new Error(`País ${id} no encontrado`);
    pais.estado = estado;
    pais.fecha_activacion =
      estado === "activo"
        ? (pais.fecha_activacion ?? new Date().toISOString().slice(0, 10))
        : null;
    return clonar(pais);
  },

  async actualizarEstadoRegion(id, estado: EstadoGeografico) {
    const region = store().regiones.find((r) => r.id === id);
    if (!region) throw new Error(`Región ${id} no encontrada`);
    region.estado = estado;
    return clonar(region);
  },

  async listarReglas() {
    return clonar(store().reglas);
  },

  async crearRegla(nueva: NuevaRegla) {
    const regla: ReglaCumplimiento = {
      id: nuevoId("rg"),
      ...nueva,
      fecha_verificacion: nueva.verificada
        ? new Date().toISOString().slice(0, 10)
        : null,
    };
    store().reglas.push(regla);
    return clonar(regla);
  },

  async actualizarRegla(id, cambios) {
    const regla = store().reglas.find((r) => r.id === id);
    if (!regla) throw new Error(`Regla ${id} no encontrada`);
    const pasaAVerificada = cambios.verificada === true && !regla.verificada;
    Object.assign(regla, cambios);
    if (pasaAVerificada) {
      regla.fecha_verificacion = new Date().toISOString().slice(0, 10);
    }
    if (cambios.verificada === false) {
      regla.fecha_verificacion = null;
      regla.verificada_por = null;
    }
    return clonar(regla);
  },

  async eliminarRegla(id) {
    const s = store();
    const indice = s.reglas.findIndex((r) => r.id === id);
    if (indice === -1) throw new Error(`Regla ${id} no encontrada`);
    s.reglas.splice(indice, 1);
  },

  async listarOperadores() {
    return clonar(store().operadores);
  },

  async listarCertificaciones() {
    return clonar(store().certificaciones);
  },

  async listarDrones() {
    return clonar(store().drones);
  },

  async crearOperador(alta: AltaOperador) {
    const s = store();
    const operador: Operador = {
      id: nuevoId("op"),
      nombre: alta.nombre,
      email: alta.email,
      pais_base_id: alta.pais_base_id,
      // Un operador nuevo entra sin verificar: lo habilita el panel admin.
      verificado: false,
      rating: 0,
      ubicacion_lat: alta.ubicacion_lat,
      ubicacion_lng: alta.ubicacion_lng,
    };
    s.operadores.push(operador);

    for (const cert of alta.certificaciones) {
      s.certificaciones.push({
        id: nuevoId("cert"),
        operador_id: operador.id,
        documento_revisado: false,
        ...cert,
      });
    }
    for (const dron of alta.drones) {
      s.drones.push({ id: nuevoId("dr"), operador_id: operador.id, ...dron });
    }
    return clonar(operador);
  },

  async verificarOperador(id, verificado) {
    const operador = store().operadores.find((o) => o.id === id);
    if (!operador) throw new Error(`Operador ${id} no encontrado`);
    operador.verificado = verificado;
    return clonar(operador);
  },

  async revisarDocumento(certificacionId, revisado) {
    const cert = store().certificaciones.find((c) => c.id === certificacionId);
    if (!cert) throw new Error(`Certificación ${certificacionId} no encontrada`);
    cert.documento_revisado = revisado;
    return clonar(cert);
  },

  async listarProductores(): Promise<Productor[]> {
    return clonar(store().productores);
  },

  async listarSolicitudes() {
    return clonar(store().solicitudes);
  },

  async registrarSolicitud(datos) {
    const solicitud: Solicitud = {
      id: nuevoId("sol"),
      creada_en: new Date().toISOString(),
      ...datos,
    };
    store().solicitudes.push(solicitud);
    return clonar(solicitud);
  },

  async listarListaEspera() {
    return clonar(store().lista_espera);
  },

  async agregarListaEspera(alta: AltaListaEspera) {
    const registro: ListaEspera = {
      id: nuevoId("le"),
      fecha: new Date().toISOString(),
      ...alta,
    };
    store().lista_espera.push(registro);
    return clonar(registro);
  },
};
