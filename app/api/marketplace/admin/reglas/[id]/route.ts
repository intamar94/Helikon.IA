import { NextResponse } from "next/server";
import { getRepository } from "@/lib/marketplace/repository";
import { actualizarRegla } from "@/lib/marketplace/service";
import { respuestaDeError } from "@/lib/marketplace/http";
import type { NuevaRegla } from "@/lib/marketplace/repository";
import {
  booleano,
  comoObjeto,
  ErrorEntrada,
  servicio,
  texto,
  textoOpcional,
} from "@/lib/marketplace/validacion";

export const dynamic = "force-dynamic";

type Contexto = { params: { id: string } };

export async function PATCH(request: Request, { params }: Contexto) {
  try {
    const cuerpo = comoObjeto(await request.json());
    const cambios: Partial<NuevaRegla> = {};

    if ("cultivo" in cuerpo) cambios.cultivo = texto(cuerpo, "cultivo").toLowerCase();
    if ("servicio" in cuerpo) cambios.servicio = servicio(cuerpo);
    if ("region_id" in cuerpo) cambios.region_id = textoOpcional(cuerpo, "region_id");
    if ("certificacion_requerida" in cuerpo) {
      cambios.certificacion_requerida = texto(cuerpo, "certificacion_requerida");
    }
    if ("producto_permitido" in cuerpo) {
      cambios.producto_permitido = texto(cuerpo, "producto_permitido");
    }
    if ("activa" in cuerpo) cambios.activa = booleano(cuerpo, "activa");
    if ("verificada" in cuerpo) {
      cambios.verificada = booleano(cuerpo, "verificada");
      if (cambios.verificada) {
        const por = textoOpcional(cuerpo, "verificada_por");
        if (!por) {
          throw new ErrorEntrada(
            "Para verificar una regla hay que registrar quién la verificó.",
          );
        }
        cambios.verificada_por = por;
      }
    }

    if (Object.keys(cambios).length === 0) {
      throw new ErrorEntrada("No se envió ningún cambio.");
    }

    const regla = await actualizarRegla(getRepository(), params.id, cambios);
    return NextResponse.json({ regla });
  } catch (error) {
    return respuestaDeError(error);
  }
}

export async function DELETE(_request: Request, { params }: Contexto) {
  try {
    await getRepository().eliminarRegla(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error);
  }
}
