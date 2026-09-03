/**
 * Pruebas del motor de cumplimiento y matching (node:test).
 *
 *   npm test
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  paisPuedeActivarse,
  reglaEnConflicto,
  resolverRegla,
} from "../lib/marketplace/compliance";
import { evaluarGateActivacion } from "../lib/marketplace/geo";
import { ejecutarMatching } from "../lib/marketplace/matching";
import { correrFlujosDemo, DATASET_DEMO, FECHA_DEMO } from "../lib/marketplace/demo";
import type { EntradaSolicitud } from "../lib/marketplace/types";

const solicitud = (
  cambios: Partial<EntradaSolicitud> = {},
): EntradaSolicitud => ({
  productor_id: "pr-la-esperanza",
  pais_id: "co",
  region_id: "co-antioquia",
  cultivo: "banano",
  servicio: "fumigacion",
  hectareas: 120,
  fecha_deseada: "2026-09-20",
  producto_a_aplicar: "Mancozeb 80% WP",
  ...cambios,
});

const correr = (cambios: Partial<EntradaSolicitud> = {}) =>
  ejecutarMatching(DATASET_DEMO, solicitud(cambios), FECHA_DEMO);

// ── Resolución jerárquica de reglas ─────────────────────────────────────────

test("la regla regional pisa a la nacional", () => {
  const resuelta = resolverRegla(DATASET_DEMO.reglas, {
    pais_id: "co",
    region_id: "co-valle",
    cultivo: "banano",
    servicio: "fumigacion",
  });
  assert.equal(resuelta?.especificidad, "regional");
  assert.equal(resuelta?.regla.id, "rg-co-valle-banano-fumigacion");
  assert.equal(resuelta?.desplazada?.id, "rg-co-banano-fumigacion");
});

test("sin regla regional aplica la nacional", () => {
  const resuelta = resolverRegla(DATASET_DEMO.reglas, {
    pais_id: "co",
    region_id: "co-antioquia",
    cultivo: "banano",
    servicio: "fumigacion",
  });
  assert.equal(resuelta?.especificidad, "nacional");
  assert.equal(resuelta?.desplazada, null);
});

test("la resolución ignora reglas inactivas", () => {
  const reglas = DATASET_DEMO.reglas.map((r) =>
    r.id === "rg-co-banano-fumigacion" ? { ...r, activa: false } : r,
  );
  const resuelta = resolverRegla(reglas, {
    pais_id: "co",
    region_id: "co-antioquia",
    cultivo: "banano",
    servicio: "fumigacion",
  });
  assert.equal(resuelta, null);
});

test("el cultivo se compara sin distinguir mayúsculas ni espacios", () => {
  const resuelta = resolverRegla(DATASET_DEMO.reglas, {
    pais_id: "co",
    region_id: "co-antioquia",
    cultivo: "  BANANO ",
    servicio: "fumigacion",
  });
  assert.equal(resuelta?.regla.id, "rg-co-banano-fumigacion");
});

// ── Gate de activación ──────────────────────────────────────────────────────

test("una región activa habilita aunque el país siga en revisión", () => {
  const pais = DATASET_DEMO.paises.find((p) => p.id === "br")!;
  const region = DATASET_DEMO.regiones.find((r) => r.id === "br-mato-grosso")!;
  assert.equal(pais.estado, "en_revision");
  assert.equal(evaluarGateActivacion(pais, region).habilitada, true);
});

test("una región no activa bloquea aunque el país esté activo", () => {
  const resultado = correr({
    productor_id: "pr-la-esperanza",
    region_id: "co-tolima",
  });
  assert.equal(resultado.estado, "rechazada");
  assert.equal(resultado.motivo, "region_no_habilitada");
});

// ── Flujos del enunciado ────────────────────────────────────────────────────

test("flujo 1 — país activo devuelve operadores válidos", () => {
  const [flujo] = correrFlujosDemo();
  assert.equal(flujo.resultado.estado, "asignable");
  assert.ok(flujo.resultado.opciones.length > 0);
  // Ordenado por cercanía.
  const distancias = flujo.resultado.opciones.map((o) => o.distancia_km);
  assert.deepEqual(distancias, [...distancias].sort((a, b) => a - b));
  // Toda opción viene respaldada por la certificación que la regla exige.
  for (const opcion of flujo.resultado.opciones) {
    assert.equal(
      opcion.certificacion.tipo_certificacion,
      "Licencia ICA Aplicador Aéreo",
    );
    assert.ok(opcion.operador.verificado);
    assert.ok(opcion.dron.servicios_ofrecidos.includes("fumigacion"));
  }
});

test("flujo 2 — país mapeado rechaza y ofrece lista de espera", () => {
  const [, flujo] = correrFlujosDemo();
  assert.equal(flujo.resultado.estado, "rechazada");
  assert.equal(flujo.resultado.motivo, "pais_no_habilitado");
  assert.equal(flujo.resultado.ofrecer_lista_espera, true);
  assert.equal(flujo.resultado.opciones.length, 0);
});

test("flujo 3 — la regla regional cambia el operador habilitado", () => {
  const [nacional, , regional] = correrFlujosDemo();
  assert.equal(regional.resultado.estado, "asignable");
  assert.equal(
    regional.resultado.traza.regla_resuelta?.especificidad,
    "regional",
  );

  const enNacional = nacional.resultado.opciones.map((o) => o.operador.id);
  const enRegional = regional.resultado.opciones.map((o) => o.operador.id);

  assert.ok(enNacional.includes("op-aerocampo"));
  // AeroCampo sólo tiene la licencia nacional: la regla del Valle lo deja afuera.
  assert.ok(!enRegional.includes("op-aerocampo"));
  assert.deepEqual(enRegional, ["op-dronagro-valle"]);
});

// ── Filtros de cumplimiento y capacidad ─────────────────────────────────────

test("una regla existente pero sin verificar nunca habilita", () => {
  const resultado = correr({
    productor_id: "pr-los-llanos",
    region_id: "co-meta",
    cultivo: "arroz",
    servicio: "siembra",
    producto_a_aplicar: "Semilla certificada de arroz",
  });
  assert.equal(resultado.estado, "rechazada");
  assert.equal(resultado.motivo, "regla_no_verificada");
  assert.equal(resultado.regla_aplicada?.id, "rg-co-meta-arroz-siembra");
});

test("sin regla cargada no hay transacción", () => {
  const resultado = correr({ cultivo: "palma de aceite" });
  assert.equal(resultado.estado, "rechazada");
  assert.equal(resultado.motivo, "sin_regla");
});

test("se filtran operadores sin verificar y con certificación vencida", () => {
  const [flujo] = correrFlujosDemo();
  const ids = flujo.resultado.opciones.map((o) => o.operador.id);
  assert.ok(!ids.includes("op-andes-drone"), "sin verificar");
  assert.ok(!ids.includes("op-fumiga-caribe"), "certificación vencida");
});

test("se filtran drones que no ofrecen el servicio pedido", () => {
  const resultado = correr({
    cultivo: "cafe",
    servicio: "mapeo_ndvi",
    producto_a_aplicar: "No aplica (sensado remoto)",
  });
  assert.equal(resultado.estado, "asignable");
  assert.deepEqual(
    resultado.opciones.map((o) => o.dron.id),
    ["dr-aerocampo-p4"],
  );
});

test("el resultado devuelve como máximo 5 opciones", () => {
  for (const flujo of correrFlujosDemo()) {
    assert.ok(flujo.resultado.opciones.length <= 5);
  }
});

// ── Validación del panel admin ──────────────────────────────────────────────

test("un país sin reglas verificadas no puede activarse", () => {
  assert.equal(paisPuedeActivarse(DATASET_DEMO.reglas, "ar"), false);
  assert.equal(paisPuedeActivarse(DATASET_DEMO.reglas, "ec"), false);
  assert.equal(paisPuedeActivarse(DATASET_DEMO.reglas, "co"), true);
});

// ── Datos semilla ───────────────────────────────────────────────────────────

test("la semilla trae 6 países: 2 activos, 2 en revisión, 2 mapeados", () => {
  const porEstado = (estado: string) =>
    DATASET_DEMO.paises.filter((p) => p.estado === estado).length;
  assert.equal(DATASET_DEMO.paises.length, 6);
  assert.equal(porEstado("activo"), 2);
  assert.equal(porEstado("en_revision"), 2);
  assert.equal(porEstado("mapeado"), 2);
});

// ── Unicidad de reglas por nivel de especificidad ───────────────────────────

test("no se puede crear otra regla nacional activa para el mismo cultivo y servicio", () => {
  const conflicto = reglaEnConflicto(DATASET_DEMO.reglas, {
    pais_id: "co",
    region_id: null,
    cultivo: "banano",
    servicio: "fumigacion",
    activa: true,
  });
  assert.equal(conflicto?.id, "rg-co-banano-fumigacion");
});

test("una regla regional no colisiona con la nacional del mismo cultivo", () => {
  const conflicto = reglaEnConflicto(DATASET_DEMO.reglas, {
    pais_id: "co",
    region_id: "co-antioquia",
    cultivo: "banano",
    servicio: "fumigacion",
    activa: true,
  });
  assert.equal(conflicto, null);
});

test("una regla inactiva nunca genera conflicto", () => {
  const conflicto = reglaEnConflicto(DATASET_DEMO.reglas, {
    pais_id: "co",
    region_id: null,
    cultivo: "banano",
    servicio: "fumigacion",
    activa: false,
  });
  assert.equal(conflicto, null);
});
