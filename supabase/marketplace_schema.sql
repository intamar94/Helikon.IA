-- ============================================================================
-- Marketplace de drones agrícolas — esquema
-- Prefijo `mkt_` para convivir con las tablas de la plataforma de aprendizaje
-- en el mismo proyecto Supabase.
-- Ejecutar antes que supabase/marketplace_seed.sql
-- ============================================================================

create extension if not exists pgcrypto;

do $$ begin
  create type mkt_estado_geografico as enum ('mapeado', 'en_revision', 'activo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type mkt_servicio as enum ('fumigacion', 'mapeo_ndvi', 'siembra', 'dispersion_solidos');
exception when duplicate_object then null; end $$;

do $$ begin
  create type mkt_estado_solicitud as enum ('pendiente', 'asignada', 'completada', 'rechazada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type mkt_tipo_usuario as enum ('operador', 'productor');
exception when duplicate_object then null; end $$;

-- Modalidad de la publicación: define quién opera el dron y, con eso, a quién
-- le exige la certificación el motor de cumplimiento.
do $$ begin
  create type mkt_modalidad as enum ('con_piloto', 'alquiler');
exception when duplicate_object then null; end $$;

-- ── 1. Esquema geográfico ───────────────────────────────────────────────────

create table if not exists mkt_paises (
  id                text primary key default gen_random_uuid()::text,
  nombre            text not null,
  codigo_iso        char(2) not null unique,
  estado            mkt_estado_geografico not null default 'mapeado',
  fecha_activacion  date
);

create table if not exists mkt_regiones (
  id       text primary key default gen_random_uuid()::text,
  pais_id  text not null references mkt_paises(id) on delete cascade,
  nombre   text not null,
  estado   mkt_estado_geografico not null default 'mapeado',
  unique (pais_id, nombre)
);

create index if not exists mkt_regiones_pais_idx on mkt_regiones (pais_id);

-- ── 2. Motor de cumplimiento ────────────────────────────────────────────────

create table if not exists mkt_reglas_cumplimiento (
  id                       text primary key default gen_random_uuid()::text,
  pais_id                  text not null references mkt_paises(id) on delete cascade,
  -- NULL => la regla aplica a todo el país.
  region_id                text references mkt_regiones(id) on delete cascade,
  cultivo                  text not null,
  servicio                 mkt_servicio not null,
  certificacion_requerida  text not null,
  producto_permitido       text not null,
  verificada               boolean not null default false,
  verificada_por           text,
  fecha_verificacion       date,
  activa                   boolean not null default true,
  -- Una regla verificada tiene que decir quién y cuándo la verificó.
  constraint mkt_reglas_verificacion_completa
    check (not verificada or (verificada_por is not null and fecha_verificacion is not null))
);

create index if not exists mkt_reglas_resolucion_idx
  on mkt_reglas_cumplimiento (pais_id, cultivo, servicio, region_id);

-- Una sola regla activa por nivel de especificidad + cultivo + servicio.
create unique index if not exists mkt_reglas_unica_nacional
  on mkt_reglas_cumplimiento (pais_id, cultivo, servicio)
  where region_id is null and activa;

create unique index if not exists mkt_reglas_unica_regional
  on mkt_reglas_cumplimiento (region_id, cultivo, servicio)
  where region_id is not null and activa;

-- ── 3. Operadores, certificaciones y flota ──────────────────────────────────

create table if not exists mkt_operadores (
  id             text primary key default gen_random_uuid()::text,
  nombre         text not null,
  email          text not null unique,
  pais_base_id   text not null references mkt_paises(id),
  verificado     boolean not null default false,
  rating         numeric(2,1) not null default 0 check (rating >= 0 and rating <= 5),
  -- Base de operaciones: el paso (e) del matching ordena por cercanía.
  ubicacion_lat  double precision not null,
  ubicacion_lng  double precision not null
);

-- Las certificaciones pueden ser de un operador o de un productor: en
-- alquiler vuela el cliente, así que la licencia tiene que ser suya. La FK no
-- se puede declarar porque el titular vive en dos tablas distintas; la
-- integridad se valida en la capa de aplicación.
create table if not exists mkt_certificaciones (
  id                  text primary key default gen_random_uuid()::text,
  titular_tipo        mkt_tipo_usuario not null,
  titular_id          text not null,
  pais_id             text not null references mkt_paises(id),
  tipo_certificacion  text not null,
  numero              text not null,
  vigente_hasta       date not null,
  documento_url       text,
  documento_revisado  boolean not null default false,
  unique (titular_tipo, titular_id, pais_id, tipo_certificacion, numero)
);

create index if not exists mkt_certificaciones_titular_idx
  on mkt_certificaciones (titular_tipo, titular_id, pais_id);

-- El equipo físico. Lo comercial vive en mkt_anuncios.
create table if not exists mkt_drones (
  id                       text primary key default gen_random_uuid()::text,
  operador_id              text not null references mkt_operadores(id) on delete cascade,
  modelo                   text not null,
  capacidad_carga_litros   numeric(6,1) not null default 0,
  hectareas_por_hora       numeric(6,2) not null check (hectareas_por_hora > 0)
);

create index if not exists mkt_drones_operador_idx on mkt_drones (operador_id);

-- La publicación: un mismo dron puede anunciarse con piloto y en alquiler, a
-- precios distintos. Es la unidad que se reserva.
create table if not exists mkt_anuncios (
  id                   text primary key default gen_random_uuid()::text,
  dron_id              text not null references mkt_drones(id) on delete cascade,
  modalidad            mkt_modalidad not null,
  servicios_ofrecidos  mkt_servicio[] not null default '{}',
  precio_hectarea_usd  numeric(8,2),
  precio_dia_usd       numeric(10,2),
  horas_por_jornada    numeric(4,1) not null default 6 check (horas_por_jornada > 0),
  activo               boolean not null default true,
  unique (dron_id, modalidad),
  -- Cada modalidad se cobra con su propia tarifa, y sólo con la suya.
  constraint mkt_anuncios_tarifa_por_modalidad check (
    (modalidad = 'con_piloto' and precio_hectarea_usd is not null and precio_dia_usd is null)
    or
    (modalidad = 'alquiler' and precio_dia_usd is not null and precio_hectarea_usd is null)
  ),
  constraint mkt_anuncios_con_servicios check (cardinality(servicios_ofrecidos) > 0)
);

create index if not exists mkt_anuncios_dron_idx on mkt_anuncios (dron_id, modalidad)
  where activo;

-- ── 4. Productores y solicitudes ────────────────────────────────────────────

create table if not exists mkt_productores (
  id             text primary key default gen_random_uuid()::text,
  nombre         text not null,
  email          text not null unique,
  pais_id        text not null references mkt_paises(id),
  region_id      text not null references mkt_regiones(id),
  ubicacion_lat  double precision not null,
  ubicacion_lng  double precision not null
);

create table if not exists mkt_solicitudes (
  id                  text primary key default gen_random_uuid()::text,
  productor_id        text not null references mkt_productores(id) on delete cascade,
  pais_id             text not null references mkt_paises(id),
  region_id           text not null references mkt_regiones(id),
  cultivo             text not null,
  servicio            mkt_servicio not null,
  modalidad           mkt_modalidad not null default 'con_piloto',
  hectareas           numeric(10,2) not null check (hectareas > 0),
  fecha_deseada       date not null,
  producto_a_aplicar  text,
  estado              mkt_estado_solicitud not null default 'pendiente',
  motivo_rechazo      text,
  regla_aplicada_id   text references mkt_reglas_cumplimiento(id) on delete set null,
  -- Se completan al reservar una opción del matching.
  anuncio_asignado_id   text references mkt_anuncios(id) on delete set null,
  operador_asignado_id  text references mkt_operadores(id) on delete set null,
  precio_acordado_usd   numeric(12,2),
  fecha_asignacion      timestamptz,
  creada_en           timestamptz not null default now(),
  -- Una solicitud asignada tiene que decir a qué anuncio y a qué precio.
  constraint mkt_solicitudes_asignacion_completa check (
    estado <> 'asignada'
    or (anuncio_asignado_id is not null
        and operador_asignado_id is not null
        and precio_acordado_usd is not null
        and fecha_asignacion is not null)
  )
);

create index if not exists mkt_solicitudes_zona_idx
  on mkt_solicitudes (pais_id, region_id, estado);

create table if not exists mkt_lista_espera (
  id            text primary key default gen_random_uuid()::text,
  email         text not null,
  pais_id       text not null references mkt_paises(id) on delete cascade,
  region_id     text references mkt_regiones(id) on delete cascade,
  tipo_usuario  mkt_tipo_usuario not null,
  fecha         timestamptz not null default now()
);

-- Dedup por zona. Va como índice (y no como UNIQUE de tabla) porque region_id
-- puede ser NULL — "todo el país" — y Postgres trata cada NULL como distinto.
create unique index if not exists mkt_lista_espera_unica
  on mkt_lista_espera (email, pais_id, coalesce(region_id, ''), tipo_usuario);

create index if not exists mkt_lista_espera_zona_idx
  on mkt_lista_espera (pais_id, region_id);

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- El MVP no tiene autenticación todavía: catálogo público de lectura, y las
-- escrituras pasan por las rutas de API del servidor. Al agregar Supabase Auth
-- hay que restringir las políticas de escritura por rol (admin / operador /
-- productor).

alter table mkt_paises                 enable row level security;
alter table mkt_regiones               enable row level security;
alter table mkt_reglas_cumplimiento    enable row level security;
alter table mkt_operadores             enable row level security;
alter table mkt_certificaciones       enable row level security;
alter table mkt_anuncios               enable row level security;
alter table mkt_drones                 enable row level security;
alter table mkt_productores            enable row level security;
alter table mkt_solicitudes            enable row level security;
alter table mkt_lista_espera           enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'mkt_paises','mkt_regiones','mkt_reglas_cumplimiento','mkt_operadores',
    'mkt_certificaciones','mkt_drones','mkt_anuncios','mkt_productores',
    'mkt_solicitudes','mkt_lista_espera'
  ] loop
    execute format('drop policy if exists %I on %I', t || '_lectura_publica', t);
    execute format(
      'create policy %I on %I for select using (true)', t || '_lectura_publica', t);
  end loop;
end $$;
