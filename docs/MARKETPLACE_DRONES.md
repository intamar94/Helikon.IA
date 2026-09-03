# Marketplace de drones agrícolas — MVP

Marketplace multi-país de dos lados que conecta **propietarios de drones** con
**productores** que necesitan trabajo de campo: fumigación, mapeo NDVI, siembra
y dispersión de sólidos.

Cada dron se publica en una o dos **modalidades**, y el productor elige cuál
quiere:

| Modalidad | Quién vuela | A quién se le exige la licencia | Cómo se cobra |
|---|---|---|---|
| `con_piloto` | el operador | al **operador** | por hectárea |
| `alquiler` | el productor | al **productor** | por jornada |

Esa tabla es todo el producto en cuatro celdas: la licencia de aplicación aérea
la necesita quien aprieta el gatillo, así que la modalidad decide a quién
valida el motor de cumplimiento.

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
| `/marketplace/solicitar` | Formulario del productor, resultados del matching y reserva |
| `/marketplace/operadores/alta` | Alta de operador con certificaciones por país y flota |
| `/marketplace/admin` | Panel: CRUD de reglas, estados de país/región, verificación de operadores, demanda |
| `/marketplace/demo` | Los tres flujos de prueba corridos contra el dataset semilla |

### API

| Método | Endpoint | Uso |
|---|---|---|
| `POST` | `/api/marketplace/solicitudes` | Crea la solicitud y corre el motor de matching |
| `POST` | `/api/marketplace/solicitudes/{id}/reservar` | Reserva un anuncio; la solicitud pasa a `asignada` |
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
| c | Certificación vigente del tipo exigido, **a nombre de quien vaya a volar** | `sin_operadores_certificados`, `productor_sin_certificacion` |
| d | Anuncios de la modalidad pedida cuyos `servicios_ofrecidos` incluyen el servicio | `sin_capacidad` |
| e | Orden por cercanía (haversine), luego por rating | — |
| f | Devuelve hasta 5 opciones con operador, dron, certificación de respaldo, tiempo y precio por hectárea | — |

### El paso (c) y la modalidad

`titularExigido(modalidad)` devuelve a quién hay que validar:

- **`con_piloto`** → se buscan operadores verificados con la certificación
  exigida vigente en ese país. Sin ninguno: `sin_operadores_certificados`.
- **`alquiler`** → se valida la certificación **del productor**. Si no la
  tiene, el rechazo es `productor_sin_certificacion` y no manda a lista de
  espera: la zona está habilitada, el problema es la licencia, y el mismo
  trabajo se resuelve hoy con piloto. Por eso el resultado trae
  `sugerir_modalidad: "con_piloto"` y la UI ofrece el cambio en un botón.

En las dos modalidades el operador tiene que tener **base en el país del
trabajo**: el equipo está donde está. Con piloto esto quedaba implícito porque
la certificación se valida contra el país de la regla; en alquiler la licencia
es del productor, así que el filtro es explícito.

La jerarquía de reglas sigue aplicando igual: si la región endurece el
requisito, al productor que quiere alquilar se le exige la certificación
regional, no la nacional. En la semilla, Rancho San Miguel puede alquilar en
Jalisco pero no en Sinaloa, con la misma licencia.

Todo rechazo salvo `productor_desconocido` y `productor_sin_certificacion`
ofrece sumarse a la lista de espera.
El resultado incluye una `traza` con el embudo (cuántos operadores sobrevivieron
a cada filtro), que la UI muestra para que el rechazo sea explicable.

### Estimaciones del paso (f)

`horas_vuelo = hectareas / dron.hectareas_por_hora` en las dos modalidades. De
ahí en adelante se separan:

**Con piloto** — el operador se moviliza, así que el traslado se cobra:

- `horas_traslado = 2 × distancia_km / 60 km/h`
- `total = precio_hectarea_usd × hectareas + distancia_km × 1,2 USD/km`

**Alquiler** — el cliente retira el equipo, así que no hay movilización que
facturar y se cobra por jornada de uso:

- `dias = max(1, ceil(horas_vuelo / horas_por_jornada))`
- `total = precio_dia_usd × dias`

En los dos casos se informa además `precio_estimado_hectarea_usd = total /
hectareas`, para poder comparar modalidades con la misma unidad. Las constantes
están arriba de `matching.ts`. Son de MVP: no hay motor de pricing todavía.

### Reserva

El matching devuelve opciones; `POST /api/marketplace/solicitudes/{id}/reservar`
es el que cierra la transacción y deja la solicitud en `asignada`.

No confía en nada que venga del cliente: `reservarOpcion` vuelve a correr el
motor completo con los datos actuales y sólo acepta el anuncio si **sigue**
apareciendo entre las opciones habilitadas. Entre que se muestran los
resultados y se aprieta el botón, la normativa pudo cambiar — que es justamente
lo que el producto promete cubrir. Si cambió, el error lo dice y no se reserva.

### Campos agregados al modelo del enunciado

- `operadores.ubicacion_lat/lng` — el paso (e) ordena "por cercanía a la
  ubicación del productor", lo que exige una coordenada del lado del operador.
- `anuncios` — el enunciado ponía `servicios_ofrecidos` y el precio en `drones`.
  Al haber dos modalidades sobre el mismo equipo, lo comercial se separó del
  activo físico: `drones` es el aparato, `anuncios` es la oferta.
- `certificaciones` reemplaza a `certificaciones_operador` y lleva
  `titular_tipo` + `titular_id`, porque en alquiler la licencia es del
  productor.
- `solicitudes.modalidad` y los cuatro campos de asignación.

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
| Productor con licencia propia (puede alquilar) | Hacienda El Palmar, aval CVC |
| Productor con licencia insuficiente por la regla regional | Rancho San Miguel: alquila en Jalisco, no en Sinaloa |
| Productor sin licencia (sólo puede ir con piloto) | Finca La Esperanza |

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
npm test                     # 28 tests del motor (node:test)
npm run marketplace:demo     # los cinco flujos por consola
npm run marketplace:sql      # regenera supabase/marketplace_seed.sql
npm run build
```

---

## Fuera de alcance en esta pasada

Sin pagos, sin notificaciones por email/SMS, sin chat entre partes. La reserva
deja la solicitud en `asignada`, pero **el operador todavía no tiene bandeja
propia** para aceptarla, rechazarla o marcarla completada: los estados
`completada` y el circuito del lado de la oferta quedan para la próxima. Tampoco
se valida disponibilidad de agenda contra `fecha_deseada`. Tampoco hay
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
