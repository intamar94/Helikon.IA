# Helikon.IA

Mapa de aprendizaje adaptativo — Ingeniería de Software + Biología vegetal.
52 nodos, estados `bloqueado` / `disponible` / `dominado`, desbloqueo automático por prerrequisitos.

## Stack
- Next.js 14 (App Router) + TypeScript
- Supabase (Postgres) como fuente de datos — sin datos embebidos en el cliente
- Deploy en Vercel

## Estructura de datos
- `nodos`: catálogo de retos (id, numero, nombre, rama, objetivo, construir, romper, resolver)
- `aristas`: prerrequisitos como relaciones `origen -> destino` (tipo `prerrequisito`)
- `usuario_progreso`: progreso por `usuario_id` (identificador anónimo por dispositivo, guardado en `localStorage` — no hay autenticación todavía)
- `competencias_cruzadas`: nodos "competencia" que agregan varias ramas

## Desarrollo local

```bash
npm install
cp .env.local.example .env.local   # completar con las credenciales del proyecto Supabase
npm run dev
```

## Base de datos (Supabase)

1. Crear un proyecto en Supabase.
2. Ejecutar `supabase/schema.sql` para crear las tablas.
3. Ejecutar `supabase/seed.sql` para cargar los 52 nodos y sus 70 relaciones de prerrequisito (generado a partir de `reference/graph-data.json`).
4. Copiar la URL del proyecto y la `anon`/`publishable` key a `.env.local` (ver `.env.local.example`).

> Nota: como todavía no hay autenticación de usuarios, las tablas se usan con Row Level Security desactivada (comportamiento por defecto de Postgres). Al agregar autenticación, activar RLS y políticas por `usuario_id`.

## Referencia
La carpeta `reference/` conserva el prototipo original (`plataforma-prototipo.html`) y los datos fuente (`graph-data.json`, `schema.sql`) tal como se entregaron, como referencia de diseño y comportamiento.
