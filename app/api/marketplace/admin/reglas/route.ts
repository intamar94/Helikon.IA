import { NextResponse } from "next/server";
import { getRepository } from "@/lib/marketplace/repository";
import { crearRegla } from "@/lib/marketplace/service";
import { respuestaDeError } from "@/lib/marketplace/http";
import {
  booleano,
  comoObjeto,
  ErrorEntrada,
  servicio,
  texto,
  textoOpcional,
} from "@/lib/marketplace/validacion";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ reglas: await getRepository().listarReglas() });
  } catch (error) {
    return respuestaDeError(error);
  }
}

export async function POST(request: Request) {
  try {
    const cuerpo = comoObjeto(await request.json());
    const verificada = booleano(cuerpo, "verificada");
    const verificada_por = textoOpcional(cuerpo, "verificada_por");

    if (verificada && !verificada_por) {
      throw new ErrorEntrada(
        "Una regla verificada necesita registrar quién la verificó.",
      );
    }

    const regla = await crearRegla(getRepository(), {
      pais_id: texto(cuerpo, "pais_id"),
      region_id: textoOpcional(cuerpo, "region_id"),
      cultivo: texto(cuerpo, "cultivo").toLowerCase(),
      servicio: servicio(cuerpo),
      certificacion_requerida: texto(cuerpo, "certificacion_requerida"),
      producto_permitido: texto(cuerpo, "producto_permitido"),
      verificada,
      verificada_por,
      activa: booleano(cuerpo, "activa", true),
    });

    return NextResponse.json({ regla }, { status: 201 });
  } catch (error) {
    return respuestaDeError(error);
  }
}
