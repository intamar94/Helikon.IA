import { NextResponse } from "next/server";
import { getRepository } from "@/lib/marketplace/repository";
import { respuestaDeError } from "@/lib/marketplace/http";
import {
  comoObjeto,
  email,
  texto,
  textoOpcional,
  tipoUsuario,
} from "@/lib/marketplace/validacion";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const repo = getRepository();
    return NextResponse.json({ lista_espera: await repo.listarListaEspera() });
  } catch (error) {
    return respuestaDeError(error);
  }
}

export async function POST(request: Request) {
  try {
    const cuerpo = comoObjeto(await request.json());
    const registro = await getRepository().agregarListaEspera({
      email: email(cuerpo),
      pais_id: texto(cuerpo, "pais_id"),
      region_id: textoOpcional(cuerpo, "region_id"),
      tipo_usuario: tipoUsuario(cuerpo),
    });
    return NextResponse.json({ registro }, { status: 201 });
  } catch (error) {
    return respuestaDeError(error);
  }
}
