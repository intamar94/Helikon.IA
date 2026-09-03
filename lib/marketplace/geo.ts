import type { EstadoGeografico, Pais, Region } from "./types";

const RADIO_TIERRA_KM = 6371;

const rad = (grados: number) => (grados * Math.PI) / 180;

/** Distancia en kilómetros entre dos coordenadas (haversine). */
export function distanciaKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type ResultadoGate =
  | { habilitada: true; motivo: null }
  | {
      habilitada: false;
      motivo: "pais_no_habilitado" | "region_no_habilitada";
    };

/**
 * Gate de activación (paso «a» del matching).
 *
 * La regla base es que país y región deben estar en estado `activo`, con la
 * excepción declarada en el modelo geográfico: una región verificada puede
 * operar aunque su país siga `en_revision`. Lo que nunca se habilita es una
 * zona cuyo país todavía está solo `mapeado` — ahí no hubo trabajo normativo
 * de ningún tipo, así que una región suya no puede considerarse verificada.
 *
 * En una frase: manda el estado de la región, y el país solo puede bloquear
 * si sigue en `mapeado`.
 */
export function evaluarGateActivacion(
  pais: Pais | undefined,
  region: Region | undefined,
): ResultadoGate {
  if (!pais || pais.estado === "mapeado") {
    return { habilitada: false, motivo: "pais_no_habilitado" };
  }
  if (!region || region.estado !== "activo") {
    return { habilitada: false, motivo: "region_no_habilitada" };
  }
  return { habilitada: true, motivo: null };
}

/** ¿Se puede poner esta región en `activo` dado el estado de su país? */
export function regionPuedeActivarse(paisEstado: EstadoGeografico): boolean {
  return paisEstado === "activo" || paisEstado === "en_revision";
}
