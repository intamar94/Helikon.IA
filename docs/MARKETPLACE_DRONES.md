# Marketplace de drones agrícolas — MVP

Marketplace multi-país que conecta **productores** que necesitan servicios bajo
demanda (fumigación, mapeo NDVI, siembra, dispersión de sólidos) con
**operadores de dron** certificados.

El diferenciador no es el matching: es el **motor de cumplimiento normativo**.
Todos los países se mapean desde el arranque, pero solo se habilitan
transacciones donde la normativa ya fue verificada.

Vive dentro de este repo bajo la ruta `/marketplace`, aislado de la plataforma
de aprendizaje que ocupa `/` (ver *Convivencia* al final).

---

## Rutas

| Ruta | Qué hace |
|---|---|
| `/marketplace` | Vista de cobertura: los 6 países con badge por estado y CTA según estado |
| `/marketplace/solicitar` | Formulario del productor + resultados del matching |
| `/marketplace/operadores/alta` | Alta de operador con certificaciones por país y flota |
| `/marketplace/admin` | Panel: CRUD de reglas, estados de país/región, verificación de operadores, demanda |
| `/marketplace/demo` | Los tres flujos de prueba corridos contra el dataset semilla |

### API

| Método | Endpoint | Uso |
|---|---|---|
| `POST` | `/api/marketplace/solicitudes` | Crea la solicitud y corre el motor de matching |
| `GET` | `/api/marketplace/solicitudes` | Lista solicitudes |
| `POST` | `/api/marketplace/lista-espera` | Suma un email a la lista de espera de una zona |
| `POST` | `/api/marketplace/operadores` | Alta de operador (queda sin verificar) |
| `GET/POST` | `/api/marketplace/admin/reglas` | Lista / crea reglas de cumplimiento |
| `PATCH/DELETE` | `/api/marketplace/admin/reglas/{id}` | Edita, (des)verifica, (des)activa o borra una regla |
| `PATCH` | `/api/marketplace/admin/paises/{id}` | Cambia el estado de un país |
| `PATCH` | `/api/marketplace/admin/regiones/{id}` | Cambia el estado de una región |
| `PATCH` | `/api/marketplace/admin/operadores/{id}` | Verifica / desverifica un operador |
| `PATCH` | `/api/marketplace/admin/certificaciones/{id}` | Marca un documento como revisado |

`POST /api/marketplace/solicitudes` responde **200 incluso cuando rechaza**: un
rechazo por normativa es una respuesta legítima del motor, no un error de la
petición. El desenlace viene en `resultado.estado` (`asignable` / `rechazada`).

---

## Activación progresiva

`paises.estado` y `regiones.estado` son `mapeado | en_revision | activo`.

La regla del enunciado —una región puede estar `activo` aunque su país siga
`en_revision`— convive con el gate del paso (a) así:

> **Manda el estado de la región. El país solo bloquea si sigue en `mapeado`.**

Es decir, una zona queda habilitada cuando la región está `activo` y el país
está `activo` **o** `en_revision`. Un país todavía `mapeado` no tuvo trabajo
normativo de ningún tipo, así que ninguna región suya puede considerarse
verificada. El panel admin aplica la misma regla al revés: no deja activar una
región cuyo país está en `mapeado`.

Vive en `lib/marketplace/geo.ts` (`evaluarGateActivacion`).

En la semilla, **Mato Grosso está `activo` con Brasil en `en_revision`**, que es
el caso que demuestra la excepción.

---

## Motor de cumplimiento

`lib/marketplace/compliance.ts`

Una regla con `region_id = NULL` aplica a todo el país; una regla de la región
específica **pisa** a la nacional. La especificidad decide **qué regla rige**;
la verificación decide después **si esa regla habilita**. Son dos preguntas
distintas, y por eso una regla regional sin verificar bloquea la transacción en
vez de dejar pasar la nacional: si el regulador local endureció el requisito, no
se puede volver al requisito nacional más laxo.

Ante empate dentro del mismo nivel gana la verificada, y entre esas la de
verificación más reciente.

**Una regla no verificada nunca habilita una transacción** (`reglaHabilita`).

---

## Matching

`lib/marketplace/matching.ts` — función pura `ejecutarMatching(dataset, entrada, hoy)`.

| Paso | Qué hace | Motivo de rechazo posible |
|---|---|---|
| a | Gate de activación (país/región) | `pais_no_habilitado`, `region_no_habilitada` |
| b | Resolución de regla (región > país) | `sin_regla`, `regla_no_verificada` |
| c | Operadores verificados con certificación **vigente** del tipo exigido, en ese país | `sin_operadores_certificados` |
| d | Drones cuyos `servicios_ofrecidos` incluyen el servicio pedido | `sin_capacidad` |
| e | Orden por cercanía (haversine), luego por rating | — |
| f | Devuelve hasta 5 opciones con operador, dron, certificación de respaldo, tiempo y precio por hectárea | — |

Todo rechazo salvo `productor_desconocido` ofrece sumarse a la lista de espera.
El resultado incluye una `traza` con el embudo (cuántos operadores sobrevivieron
a cada filtro), que la UI muestra para que el rechazo sea explicable.

### Estimaciones del paso (f)

- `horas_vuelo = hectareas / dron.hectareas_por_hora`
- `horas_traslado = 2 × distancia_km / 60 km/h`
- `precio_hectarea = dron.precio_base_hectarea_usd + (distancia_km × 1,2 USD/km) / hectareas`

Las constantes están arriba de `matching.ts`. Son de MVP: no hay motor de
pricing todavía.

### Dos campos agregados al modelo del enunciado

- `operadores.ubicacion_lat/lng` — el paso (e) ordena "por cercanía a la
  ubicación del productor", lo que exige una coordenada del lado del operador.
- `drones.precio_base_hectarea_usd` — el paso (f) pide "precio estimado por
  hectárea", que necesita una tarifa de referencia.

---

## Panel admin

- **CRUD de reglas sin tocar código.** La normativa cambia y no debe requerir
  deploy: crear, editar, verificar/desverificar, activar/desactivar y eliminar
  reglas se hace desde `/marketplace/admin`.
- **Estados de país y región** con dos validaciones:
  - marcar un país `activo` exige al menos una regla activa y **verificada**
    (`paisPuedeActivarse`);
  - marcar una región `activo` exige que su país esté al menos `en_revision`.
- **Verificación de operadores** y revisión de documentos de certificación. Un
  operador dado de alta entra **sin verificar** y no aparece en ningún matching
  hasta que el equipo lo habilita.

Las validaciones viven en `lib/marketplace/service.ts`, del lado del servidor:
la UI las refleja deshabilitando botones, pero la API las vuelve a chequear.

---

## Datos

### Fuente de verdad

`lib/marketplace/seed-data.ts` es la única fuente. De ahí salen:

- el store en memoria (`repository-memory.ts`),
- `supabase/marketplace_seed.sql`, generado con `npm run marketplace:sql`
  (no editar ese `.sql` a mano),
- el dataset de la demo y de los tests.

### Semilla

6 países: **Colombia** y **México** `activo`; **Brasil** y **Ecuador**
`en_revision`; **Costa Rica** y **Argentina** `mapeado`.

Casos plantados a propósito:

| Caso | Dónde |
|---|---|
| Regla regional que pisa a la nacional | Valle del Cauca (banano + fumigación) y Sinaloa (maíz + fumigación) |
| Región activa con país en revisión | Mato Grosso / Brasil |
| Regla existente pero sin verificar | Meta (arroz + siembra), Brasil nacional, Ecuador |
| Operador con certificación vencida | Fumiga Caribe (venció 2026-01-31) |
| Operador sin verificar con certificación vigente | Andes Drone Services |

### Backends

`getRepository()` elige el backend:

- **por defecto, en memoria**, sembrado con `seed-data.ts`. El MVP corre sin
  credenciales. El store es volátil: se reinicia con el proceso.
- **Supabase** con `MARKETPLACE_DATA_SOURCE=supabase`, tras aplicar
  `supabase/marketplace_schema.sql` y `supabase/marketplace_seed.sql`.

Las tablas usan prefijo `mkt_` para convivir con las de la plataforma de
aprendizaje en el mismo proyecto Supabase.

---

## Comandos

```bash
npm run dev                  # http://localhost:3000/marketplace
npm test                     # 16 tests del motor (node:test)
npm run marketplace:demo     # los tres flujos por consola
npm run marketplace:sql      # regenera supabase/marketplace_seed.sql
npm run build
```

---

## Fuera de alcance en esta pasada

Sin pagos, sin notificaciones por email/SMS, sin chat entre partes. Tampoco hay
autenticación: el formulario de solicitud elige un productor de prueba de una
lista, y el panel admin no está detrás de login. **Antes de exponer esto a
usuarios reales hay que poner auth y RLS por rol** — el esquema deja RLS
activado con políticas de solo lectura pública y las escrituras pasando por las
rutas de API.

---

## Convivencia con la plataforma de aprendizaje

Este repo ya alojaba Helikon.IA (mapa de aprendizaje adaptativo) en `/`. El
marketplace no lo toca:

- Tailwind está configurado con `content` limitado a `app/marketplace/**` y
  `components/marketplace/**`, y con **`preflight` desactivado**, para no pisar
  los estilos globales de `app/globals.css`.
- `app/marketplace/tailwind.css` se importa solo en el layout del marketplace,
  así que esa hoja ni siquiera se carga en `/`.
- El reset propio va acotado al árbol `.mkt` y envuelto en `:where()` para tener
  especificidad 0, de modo que las utilidades de Tailwind lo ganen sin
  `!important`.
- Las tablas nuevas llevan prefijo `mkt_`.
