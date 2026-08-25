-- Helikon.IA — Esquema de base de datos (listo para pegar en Supabase)

create table nodos (
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

create table aristas (
  origen text references nodos(id),
  destino text references nodos(id),
  tipo text default 'prerrequisito', -- prerrequisito | recomendado | alternativa
  fuente text,
  confianza text default 'alto', -- alto | medio | bajo
  primary key (origen, destino)
);

create table usuario_progreso (
  usuario_id uuid not null,
  nodo_id text references nodos(id),
  estado text default 'bloqueado', -- bloqueado | disponible | en_progreso | dominado
  nivel_dominio text, -- inicial | confirmado | en_riesgo
  evidencia text,
  fecha timestamp default now(),
  primary key (usuario_id, nodo_id)
);

create table competencias_cruzadas (
  id text primary key,
  nombre text not null,
  nodos_requeridos text[] not null -- array de ids de nodos
);
