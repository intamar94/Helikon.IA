import { SERVICIOS, ESTADOS_GEOGRAFICOS } from "./types";
import type { EstadoGeografico, Servicio, TipoUsuario } from "./types";

export class ErrorEntrada extends Error {
  readonly status = 400;
}

type Cuerpo = Record<string, unknown>;

export function comoObjeto(valor: unknown): Cuerpo {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    throw new ErrorEntrada("El cuerpo debe ser un objeto JSON.");
  }
  return valor as Cuerpo;
}

export function texto(cuerpo: Cuerpo, campo: string): string {
  const valor = cuerpo[campo];
  if (typeof valor !== "string" || valor.trim() === "") {
    throw new ErrorEntrada(`Falta el campo «${campo}».`);
  }
  return valor.trim();
}

export function textoOpcional(cuerpo: Cuerpo, campo: string): string | null {
  const valor = cuerpo[campo];
  if (valor === undefined || valor === null || valor === "") return null;
  if (typeof valor !== "string") {
    throw new ErrorEntrada(`El campo «${campo}» debe ser texto.`);
  }
  return valor.trim();
}

export function numero(cuerpo: Cuerpo, campo: string): number {
  const valor = Number(cuerpo[campo]);
  if (!Number.isFinite(valor)) {
    throw new ErrorEntrada(`El campo «${campo}» debe ser numérico.`);
  }
  return valor;
}

export function numeroPositivo(cuerpo: Cuerpo, campo: string): number {
  const valor = numero(cuerpo, campo);
  if (valor <= 0) {
    throw new ErrorEntrada(`El campo «${campo}» debe ser mayor a cero.`);
  }
  return valor;
}

export function booleano(cuerpo: Cuerpo, campo: string, porDefecto = false): boolean {
  const valor = cuerpo[campo];
  if (valor === undefined) return porDefecto;
  if (typeof valor !== "boolean") {
    throw new ErrorEntrada(`El campo «${campo}» debe ser booleano.`);
  }
  return valor;
}

export function servicio(cuerpo: Cuerpo, campo = "servicio"): Servicio {
  const valor = texto(cuerpo, campo);
  if (!SERVICIOS.includes(valor as Servicio)) {
    throw new ErrorEntrada(
      `«${valor}» no es un servicio válido (${SERVICIOS.join(", ")}).`,
    );
  }
  return valor as Servicio;
}

export function estadoGeografico(
  cuerpo: Cuerpo,
  campo = "estado",
): EstadoGeografico {
  const valor = texto(cuerpo, campo);
  if (!ESTADOS_GEOGRAFICOS.includes(valor as EstadoGeografico)) {
    throw new ErrorEntrada(
      `«${valor}» no es un estado válido (${ESTADOS_GEOGRAFICOS.join(", ")}).`,
    );
  }
  return valor as EstadoGeografico;
}

export function tipoUsuario(cuerpo: Cuerpo, campo = "tipo_usuario"): TipoUsuario {
  const valor = texto(cuerpo, campo);
  if (valor !== "operador" && valor !== "productor") {
    throw new ErrorEntrada("«tipo_usuario» debe ser 'operador' o 'productor'.");
  }
  return valor;
}

export function fechaISO(cuerpo: Cuerpo, campo: string): string {
  const valor = texto(cuerpo, campo);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    throw new ErrorEntrada(`El campo «${campo}» debe tener formato YYYY-MM-DD.`);
  }
  return valor;
}

export function email(cuerpo: Cuerpo, campo = "email"): string {
  const valor = texto(cuerpo, campo);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
    throw new ErrorEntrada(`«${valor}» no parece un email válido.`);
  }
  return valor.toLowerCase();
}

export function lista(cuerpo: Cuerpo, campo: string): Cuerpo[] {
  const valor = cuerpo[campo];
  if (valor === undefined) return [];
  if (!Array.isArray(valor)) {
    throw new ErrorEntrada(`El campo «${campo}» debe ser una lista.`);
  }
  return valor.map(comoObjeto);
}

export function serviciosLista(cuerpo: Cuerpo, campo: string): Servicio[] {
  const valor = cuerpo[campo];
  if (!Array.isArray(valor) || valor.length === 0) {
    throw new ErrorEntrada(`El campo «${campo}» necesita al menos un servicio.`);
  }
  return valor.map((v) => servicio({ servicio: v }));
}
