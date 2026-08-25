-- Helikon.IA — Esquema de base de datos
-- Las tablas usan prefijo helikon_ para no interferir con otros proyectos
-- que comparten el mismo proyecto Supabase.

create table if not exists helikon_nodos (
  id text primary key,
  numero int,
  nombre text not null,
  rama text not null,
  disciplina text not null default 'Ingeniería de Software',
  objetivo text,
  construir text,
  romper text,
  resolver text
);

create table if not exists helikon_aristas (
  origen text references helikon_nodos(id),
  destino text references helikon_nodos(id),
  tipo text default 'prerrequisito',
  fuente text,
  confianza text default 'alto',
  primary key (origen, destino)
);

create table if not exists helikon_usuario_progreso (
  usuario_id uuid not null,
  nodo_id text references helikon_nodos(id),
  estado text default 'bloqueado',
  nivel_dominio text,
  evidencia text,
  fecha timestamp default now(),
  primary key (usuario_id, nodo_id)
);

create table if not exists helikon_competencias_cruzadas (
  id text primary key,
  nombre text not null,
  nodos_requeridos text[] not null
);

create table if not exists helikon_evaluaciones (
  nodo_id text primary key references helikon_nodos(id) on delete cascade,
  practica jsonb not null default '[]'::jsonb,
  preguntas jsonb not null default '[]'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists helikon_intentos (
  id bigint generated always as identity primary key,
  usuario_id uuid not null,
  nodo_id text not null references helikon_nodos(id) on delete cascade,
  tipo text not null check (tipo in ('practica','evaluacion')),
  numero integer not null,
  resultado numeric,
  respuestas jsonb,
  completado boolean not null default false,
  creado_en timestamptz not null default now()
);
