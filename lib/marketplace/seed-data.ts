import type {
  CertificacionOperador,
  Dron,
  ListaEspera,
  Operador,
  Pais,
  Productor,
  Region,
  ReglaCumplimiento,
  Solicitud,
} from "./types";

/**
 * Datos semilla del MVP. Es la única fuente de verdad: `supabase/*.sql` se
 * genera desde acá con `npm run marketplace:sql`, y el repositorio en memoria
 * arranca con este mismo contenido.
 *
 * Cobertura: 6 países latinoamericanos — 2 `activo`, 2 `en_revision`,
 * 2 `mapeado`.
 */

export const PAISES_SEED: Pais[] = [
  {
    id: "co",
    nombre: "Colombia",
    codigo_iso: "CO",
    estado: "activo",
    fecha_activacion: "2026-02-10",
  },
  {
    id: "mx",
    nombre: "México",
    codigo_iso: "MX",
    estado: "activo",
    fecha_activacion: "2026-04-01",
  },
  {
    id: "br",
    nombre: "Brasil",
    codigo_iso: "BR",
    estado: "en_revision",
    fecha_activacion: null,
  },
  {
    id: "ec",
    nombre: "Ecuador",
    codigo_iso: "EC",
    estado: "en_revision",
    fecha_activacion: null,
  },
  {
    id: "cr",
    nombre: "Costa Rica",
    codigo_iso: "CR",
    estado: "mapeado",
    fecha_activacion: null,
  },
  {
    id: "ar",
    nombre: "Argentina",
    codigo_iso: "AR",
    estado: "mapeado",
    fecha_activacion: null,
  },
];

export const REGIONES_SEED: Region[] = [
  // Colombia — país activo
  { id: "co-antioquia", pais_id: "co", nombre: "Antioquia", estado: "activo" },
  { id: "co-valle", pais_id: "co", nombre: "Valle del Cauca", estado: "activo" },
  { id: "co-meta", pais_id: "co", nombre: "Meta", estado: "activo" },
  { id: "co-tolima", pais_id: "co", nombre: "Tolima", estado: "en_revision" },
  // México — país activo
  { id: "mx-sinaloa", pais_id: "mx", nombre: "Sinaloa", estado: "activo" },
  { id: "mx-jalisco", pais_id: "mx", nombre: "Jalisco", estado: "activo" },
  {
    id: "mx-michoacan",
    pais_id: "mx",
    nombre: "Michoacán",
    estado: "en_revision",
  },
  { id: "mx-sonora", pais_id: "mx", nombre: "Sonora", estado: "mapeado" },
  // Brasil — país en revisión, con una región ya verificada y activa
  {
    id: "br-mato-grosso",
    pais_id: "br",
    nombre: "Mato Grosso",
    estado: "activo",
  },
  { id: "br-sao-paulo", pais_id: "br", nombre: "São Paulo", estado: "en_revision" },
  { id: "br-parana", pais_id: "br", nombre: "Paraná", estado: "mapeado" },
  // Ecuador — país en revisión
  { id: "ec-guayas", pais_id: "ec", nombre: "Guayas", estado: "en_revision" },
  { id: "ec-los-rios", pais_id: "ec", nombre: "Los Ríos", estado: "mapeado" },
  // Costa Rica — país mapeado
  { id: "cr-alajuela", pais_id: "cr", nombre: "Alajuela", estado: "mapeado" },
  { id: "cr-limon", pais_id: "cr", nombre: "Limón", estado: "mapeado" },
  // Argentina — país mapeado
  {
    id: "ar-buenos-aires",
    pais_id: "ar",
    nombre: "Buenos Aires",
    estado: "mapeado",
  },
  { id: "ar-cordoba", pais_id: "ar", nombre: "Córdoba", estado: "mapeado" },
];

export const REGLAS_SEED: ReglaCumplimiento[] = [
  // ── Colombia ────────────────────────────────────────────────────────────
  {
    id: "rg-co-banano-fumigacion",
    pais_id: "co",
    region_id: null,
    cultivo: "banano",
    servicio: "fumigacion",
    certificacion_requerida: "Licencia ICA Aplicador Aéreo",
    producto_permitido: "Mancozeb 80% WP",
    verificada: true,
    verificada_por: "normativa@helikon.ia",
    fecha_verificacion: "2026-02-10",
    activa: true,
  },
  {
    // Regla REGIONAL que pisa a la nacional de arriba.
    id: "rg-co-valle-banano-fumigacion",
    pais_id: "co",
    region_id: "co-valle",
    cultivo: "banano",
    servicio: "fumigacion",
    certificacion_requerida: "Licencia ICA Aplicador Aéreo + Aval CVC",
    producto_permitido: "Azoxistrobina 25% SC (bajo impacto)",
    verificada: true,
    verificada_por: "normativa@helikon.ia",
    fecha_verificacion: "2026-05-18",
    activa: true,
  },
  {
    id: "rg-co-cafe-ndvi",
    pais_id: "co",
    region_id: null,
    cultivo: "cafe",
    servicio: "mapeo_ndvi",
    certificacion_requerida: "Registro ICA Operador de Servicios",
    producto_permitido: "No aplica (sensado remoto)",
    verificada: true,
    verificada_por: "normativa@helikon.ia",
    fecha_verificacion: "2026-02-10",
    activa: true,
  },
  {
    // Zona habilitada, pero la regla todavía no fue verificada.
    id: "rg-co-meta-arroz-siembra",
    pais_id: "co",
    region_id: "co-meta",
    cultivo: "arroz",
    servicio: "siembra",
    certificacion_requerida: "Licencia ICA Aplicador Aéreo",
    producto_permitido: "Semilla certificada de arroz",
    verificada: false,
    verificada_por: null,
    fecha_verificacion: null,
    activa: true,
  },
  // ── México ──────────────────────────────────────────────────────────────
  {
    id: "rg-mx-maiz-fumigacion",
    pais_id: "mx",
    region_id: null,
    cultivo: "maiz",
    servicio: "fumigacion",
    certificacion_requerida: "Licencia SENASICA Aplicador con RPAS",
    producto_permitido: "Clorantraniliprol 20% SC",
    verificada: true,
    verificada_por: "normativa@helikon.ia",
    fecha_verificacion: "2026-04-01",
    activa: true,
  },
  {
    // Segunda demostración de jerarquía: Sinaloa endurece la regla nacional.
    id: "rg-mx-sinaloa-maiz-fumigacion",
    pais_id: "mx",
    region_id: "mx-sinaloa",
    cultivo: "maiz",
    servicio: "fumigacion",
    certificacion_requerida:
      "Licencia SENASICA Aplicador con RPAS + Aval Estatal Sinaloa",
    producto_permitido: "Bioinsecticida Bacillus thuringiensis",
    verificada: true,
    verificada_por: "normativa@helikon.ia",
    fecha_verificacion: "2026-06-02",
    activa: true,
  },
  {
    id: "rg-mx-maiz-dispersion",
    pais_id: "mx",
    region_id: null,
    cultivo: "maiz",
    servicio: "dispersion_solidos",
    certificacion_requerida: "Licencia SENASICA Aplicador con RPAS",
    producto_permitido: "Urea granulada 46%",
    verificada: true,
    verificada_por: "normativa@helikon.ia",
    fecha_verificacion: "2026-04-01",
    activa: true,
  },
  // ── Brasil ──────────────────────────────────────────────────────────────
  {
    // Mato Grosso quedó verificada antes que el resto del país.
    id: "rg-br-mt-soja-fumigacion",
    pais_id: "br",
    region_id: "br-mato-grosso",
    cultivo: "soja",
    servicio: "fumigacion",
    certificacion_requerida: "Certificado MAPA Aplicação Aérea (AEA)",
    producto_permitido: "Glifosato 48% SL",
    verificada: true,
    verificada_por: "normativa@helikon.ia",
    fecha_verificacion: "2026-07-15",
    activa: true,
  },
  {
    id: "rg-br-soja-fumigacion",
    pais_id: "br",
    region_id: null,
    cultivo: "soja",
    servicio: "fumigacion",
    certificacion_requerida: "Certificado MAPA Aplicação Aérea (AEA)",
    producto_permitido: "Glifosato 48% SL",
    verificada: false,
    verificada_por: null,
    fecha_verificacion: null,
    activa: true,
  },
  // ── Ecuador ─────────────────────────────────────────────────────────────
  {
    id: "rg-ec-banano-fumigacion",
    pais_id: "ec",
    region_id: null,
    cultivo: "banano",
    servicio: "fumigacion",
    certificacion_requerida: "Licencia Agrocalidad Aplicación Aérea",
    producto_permitido: "Propiconazol 25% EC",
    verificada: false,
    verificada_por: null,
    fecha_verificacion: null,
    activa: true,
  },
];

export const OPERADORES_SEED: Operador[] = [
  {
    id: "op-aerocampo",
    nombre: "AeroCampo Andino",
    email: "ops@aerocampoandino.co",
    pais_base_id: "co",
    verificado: true,
    rating: 4.8,
    ubicacion_lat: 6.2442,
    ubicacion_lng: -75.5812, // Medellín
  },
  {
    id: "op-dronagro-valle",
    nombre: "DronAgro Valle",
    email: "contacto@dronagrovalle.co",
    pais_base_id: "co",
    verificado: true,
    rating: 4.6,
    ubicacion_lat: 3.5394,
    ubicacion_lng: -76.3036, // Palmira
  },
  {
    // Certificación vencida: se filtra en el paso (c).
    id: "op-fumiga-caribe",
    nombre: "Fumiga Caribe",
    email: "hola@fumigacaribe.co",
    pais_base_id: "co",
    verificado: true,
    rating: 4.2,
    ubicacion_lat: 10.9685,
    ubicacion_lng: -74.7813, // Barranquilla
  },
  {
    // Operador sin verificar: se filtra en el paso (c) aunque su
    // certificación esté vigente.
    id: "op-andes-drone",
    nombre: "Andes Drone Services",
    email: "info@andesdrone.co",
    pais_base_id: "co",
    verificado: false,
    rating: 4.9,
    ubicacion_lat: 4.711,
    ubicacion_lng: -74.0721, // Bogotá
  },
  {
    id: "op-agro-sinaloa",
    nombre: "Agro Sinaloa Drones",
    email: "vuelos@agrosinaloadrones.mx",
    pais_base_id: "mx",
    verificado: true,
    rating: 4.7,
    ubicacion_lat: 24.8091,
    ubicacion_lng: -107.394, // Culiacán
  },
  {
    id: "op-bajio-aereo",
    nombre: "Bajío Aéreo",
    email: "operaciones@bajioaereo.mx",
    pais_base_id: "mx",
    verificado: true,
    rating: 4.4,
    ubicacion_lat: 20.6597,
    ubicacion_lng: -103.3496, // Guadalajara
  },
  {
    id: "op-cerrado-drones",
    nombre: "Cerrado Drones",
    email: "contato@cerradodrones.br",
    pais_base_id: "br",
    verificado: true,
    rating: 4.5,
    ubicacion_lat: -15.6014,
    ubicacion_lng: -56.0979, // Cuiabá
  },
];

export const CERTIFICACIONES_SEED: CertificacionOperador[] = [
  {
    id: "cert-aerocampo-co",
    operador_id: "op-aerocampo",
    pais_id: "co",
    tipo_certificacion: "Licencia ICA Aplicador Aéreo",
    numero: "ICA-AA-2024-0431",
    vigente_hasta: "2027-03-31",
    documento_url: "https://docs.helikon.ia/cert/ICA-AA-2024-0431.pdf",
    documento_revisado: true,
  },
  {
    id: "cert-aerocampo-co-ndvi",
    operador_id: "op-aerocampo",
    pais_id: "co",
    tipo_certificacion: "Registro ICA Operador de Servicios",
    numero: "ICA-ROS-2024-1180",
    vigente_hasta: "2027-03-31",
    documento_url: "https://docs.helikon.ia/cert/ICA-ROS-2024-1180.pdf",
    documento_revisado: true,
  },
  {
    id: "cert-dronagro-co",
    operador_id: "op-dronagro-valle",
    pais_id: "co",
    tipo_certificacion: "Licencia ICA Aplicador Aéreo",
    numero: "ICA-AA-2025-0902",
    vigente_hasta: "2027-06-30",
    documento_url: "https://docs.helikon.ia/cert/ICA-AA-2025-0902.pdf",
    documento_revisado: true,
  },
  {
    // Única certificación que satisface la regla regional del Valle.
    id: "cert-dronagro-co-cvc",
    operador_id: "op-dronagro-valle",
    pais_id: "co",
    tipo_certificacion: "Licencia ICA Aplicador Aéreo + Aval CVC",
    numero: "CVC-AVAL-2026-0074",
    vigente_hasta: "2027-06-30",
    documento_url: "https://docs.helikon.ia/cert/CVC-AVAL-2026-0074.pdf",
    documento_revisado: true,
  },
  {
    // Vencida.
    id: "cert-fumiga-caribe-co",
    operador_id: "op-fumiga-caribe",
    pais_id: "co",
    tipo_certificacion: "Licencia ICA Aplicador Aéreo",
    numero: "ICA-AA-2022-0155",
    vigente_hasta: "2026-01-31",
    documento_url: "https://docs.helikon.ia/cert/ICA-AA-2022-0155.pdf",
    documento_revisado: true,
  },
  {
    // Vigente, pero el operador no está verificado.
    id: "cert-andes-co",
    operador_id: "op-andes-drone",
    pais_id: "co",
    tipo_certificacion: "Licencia ICA Aplicador Aéreo",
    numero: "ICA-AA-2026-0011",
    vigente_hasta: "2028-01-31",
    documento_url: "https://docs.helikon.ia/cert/ICA-AA-2026-0011.pdf",
    documento_revisado: false,
  },
  {
    id: "cert-agro-sinaloa-mx",
    operador_id: "op-agro-sinaloa",
    pais_id: "mx",
    tipo_certificacion: "Licencia SENASICA Aplicador con RPAS",
    numero: "SEN-RPAS-2025-2210",
    vigente_hasta: "2027-12-31",
    documento_url: "https://docs.helikon.ia/cert/SEN-RPAS-2025-2210.pdf",
    documento_revisado: true,
  },
  {
    id: "cert-agro-sinaloa-mx-estatal",
    operador_id: "op-agro-sinaloa",
    pais_id: "mx",
    tipo_certificacion:
      "Licencia SENASICA Aplicador con RPAS + Aval Estatal Sinaloa",
    numero: "SIN-AVAL-2026-0033",
    vigente_hasta: "2027-12-31",
    documento_url: "https://docs.helikon.ia/cert/SIN-AVAL-2026-0033.pdf",
    documento_revisado: true,
  },
  {
    id: "cert-bajio-mx",
    operador_id: "op-bajio-aereo",
    pais_id: "mx",
    tipo_certificacion: "Licencia SENASICA Aplicador con RPAS",
    numero: "SEN-RPAS-2024-1902",
    vigente_hasta: "2027-08-31",
    documento_url: "https://docs.helikon.ia/cert/SEN-RPAS-2024-1902.pdf",
    documento_revisado: true,
  },
  {
    id: "cert-cerrado-br",
    operador_id: "op-cerrado-drones",
    pais_id: "br",
    tipo_certificacion: "Certificado MAPA Aplicação Aérea (AEA)",
    numero: "MAPA-AEA-2025-0781",
    vigente_hasta: "2027-11-30",
    documento_url: "https://docs.helikon.ia/cert/MAPA-AEA-2025-0781.pdf",
    documento_revisado: true,
  },
];

export const DRONES_SEED: Dron[] = [
  {
    id: "dr-aerocampo-t40",
    operador_id: "op-aerocampo",
    modelo: "DJI Agras T40",
    capacidad_carga_litros: 40,
    servicios_ofrecidos: ["fumigacion", "dispersion_solidos"],
    hectareas_por_hora: 16,
    precio_base_hectarea_usd: 11.5,
  },
  {
    id: "dr-aerocampo-p4",
    operador_id: "op-aerocampo",
    modelo: "DJI P4 Multispectral",
    capacidad_carga_litros: 0,
    servicios_ofrecidos: ["mapeo_ndvi"],
    hectareas_por_hora: 55,
    precio_base_hectarea_usd: 3.2,
  },
  {
    id: "dr-dronagro-t50",
    operador_id: "op-dronagro-valle",
    modelo: "DJI Agras T50",
    capacidad_carga_litros: 50,
    servicios_ofrecidos: ["fumigacion", "dispersion_solidos", "siembra"],
    hectareas_por_hora: 21,
    precio_base_hectarea_usd: 12.9,
  },
  {
    id: "dr-fumiga-t30",
    operador_id: "op-fumiga-caribe",
    modelo: "DJI Agras T30",
    capacidad_carga_litros: 30,
    servicios_ofrecidos: ["fumigacion"],
    hectareas_por_hora: 14,
    precio_base_hectarea_usd: 10.4,
  },
  {
    id: "dr-andes-t40",
    operador_id: "op-andes-drone",
    modelo: "DJI Agras T40",
    capacidad_carga_litros: 40,
    servicios_ofrecidos: ["fumigacion", "mapeo_ndvi"],
    hectareas_por_hora: 17,
    precio_base_hectarea_usd: 9.8,
  },
  {
    id: "dr-sinaloa-t50",
    operador_id: "op-agro-sinaloa",
    modelo: "XAG P100 Pro",
    capacidad_carga_litros: 50,
    servicios_ofrecidos: ["fumigacion", "dispersion_solidos", "siembra"],
    hectareas_por_hora: 19,
    precio_base_hectarea_usd: 13.4,
  },
  {
    id: "dr-bajio-t40",
    operador_id: "op-bajio-aereo",
    modelo: "DJI Agras T40",
    capacidad_carga_litros: 40,
    servicios_ofrecidos: ["fumigacion", "mapeo_ndvi"],
    hectareas_por_hora: 15,
    precio_base_hectarea_usd: 12.1,
  },
  {
    id: "dr-cerrado-t50",
    operador_id: "op-cerrado-drones",
    modelo: "DJI Agras T50",
    capacidad_carga_litros: 50,
    servicios_ofrecidos: ["fumigacion", "siembra"],
    hectareas_por_hora: 22,
    precio_base_hectarea_usd: 10.9,
  },
];

export const PRODUCTORES_SEED: Productor[] = [
  {
    id: "pr-la-esperanza",
    nombre: "Finca La Esperanza",
    email: "admin@fincalaesperanza.co",
    pais_id: "co",
    region_id: "co-antioquia",
    ubicacion_lat: 7.8828,
    ubicacion_lng: -76.6256, // Apartadó, Urabá
  },
  {
    id: "pr-el-palmar",
    nombre: "Hacienda El Palmar",
    email: "gerencia@haciendaelpalmar.co",
    pais_id: "co",
    region_id: "co-valle",
    ubicacion_lat: 3.5,
    ubicacion_lng: -76.3,
  },
  {
    id: "pr-los-llanos",
    nombre: "Agrícola Los Llanos",
    email: "campo@agricolaloslllanos.co",
    pais_id: "co",
    region_id: "co-meta",
    ubicacion_lat: 4.142,
    ubicacion_lng: -73.6266, // Villavicencio
  },
  {
    id: "pr-san-miguel",
    nombre: "Rancho San Miguel",
    email: "produccion@ranchosanmiguel.mx",
    pais_id: "mx",
    region_id: "mx-sinaloa",
    ubicacion_lat: 25.0,
    ubicacion_lng: -107.5,
  },
  {
    id: "pr-boa-vista",
    nombre: "Fazenda Boa Vista",
    email: "campo@fazendaboavista.br",
    pais_id: "br",
    region_id: "br-mato-grosso",
    ubicacion_lat: -13.0,
    ubicacion_lng: -55.9,
  },
  {
    id: "pr-don-ramiro",
    nombre: "Estancia Don Ramiro",
    email: "contacto@estanciadonramiro.ar",
    pais_id: "ar",
    region_id: "ar-buenos-aires",
    ubicacion_lat: -34.6037,
    ubicacion_lng: -58.3816,
  },
];

export const SOLICITUDES_SEED: Solicitud[] = [];
export const LISTA_ESPERA_SEED: ListaEspera[] = [];
