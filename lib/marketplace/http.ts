import { NextResponse } from "next/server";
import { ErrorEntrada } from "./validacion";
import { ErrorValidacion } from "./service";

/** Traduce las excepciones del dominio a respuestas JSON con status correcto. */
export function respuestaDeError(error: unknown): NextResponse {
  if (error instanceof ErrorEntrada || error instanceof ErrorValidacion) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  const mensaje = error instanceof Error ? error.message : "Error inesperado";
  // Los "no encontrado" del repositorio en memoria llegan como Error simple.
  const status = /no encontrad[oa]/i.test(mensaje) ? 404 : 500;
  return NextResponse.json({ error: mensaje }, { status });
}
