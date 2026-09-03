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

create table if not exists mkt_certificaciones_operador (
  id                  text primary key default gen_random_uuid()::text,
  operador_id         text not null references mkt_operadores(id) on delete cascade,
  pais_id             text not null references mkt_paises(id),
  tipo_certificacion  text not null,
  numero              text not null,
  vigente_hasta       date not null,
  documento_url       text,
  documento_revisado  boolean not null default false,
  unique (operador_id, pais_id, tipo_certificacion, numero)
);

create index if not exists mkt_certificaciones_operador_idx
  on mkt_certificaciones_operador (operador_id, pais_id);

create table if not exists mkt_drones (
  id                       text primary key default gen_random_uuid()::text,
  operador_id              text not null references mkt_operadores(id) on delete cascade,
  modelo                   text not null,
  capacidad_carga_litros   numeric(6,1) not null default 0,
  servicios_ofrecidos      mkt_servicio[] not null default '{}',
  hectareas_por_hora       numeric(6,2) not null check (hectareas_por_hora > 0),
  precio_base_hectarea_usd numeric(8,2) not null default 0
);

create index if not exists mkt_drones_operador_idx on mkt_drones (operador_id);

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
  hectareas           numeric(10,2) not null check (hectareas > 0),
  fecha_deseada       date not null,
  producto_a_aplicar  text,
  estado              mkt_estado_solicitud not null default 'pendiente',
  motivo_rechazo      text,
  regla_aplicada_id   text references mkt_reglas_cumplimiento(id) on delete set null,
  creada_en           timestamptz not null default now()
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
alter table mkt_certificaciones_operador enable row level security;
alter table mkt_drones                 enable row level security;
alter table mkt_productores            enable row level security;
alter table mkt_solicitudes            enable row level security;
alter table mkt_lista_espera           enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'mkt_paises','mkt_regiones','mkt_reglas_cumplimiento','mkt_operadores',
    'mkt_certificaciones_operador','mkt_drones','mkt_productores',
    'mkt_solicitudes','mkt_lista_espera'
  ] loop
    execute format('drop policy if exists %I on %I', t || '_lectura_publica', t);
    execute format(
      'create policy %I on %I for select using (true)', t || '_lectura_publica', t);
  end loop;
end $$;
