import { NextResponse } from "next/server";
import { getRepository } from "@/lib/marketplace/repository";
import { cambiarEstadoPais } from "@/lib/marketplace/service";
import { respuestaDeError } from "@/lib/marketplace/http";
import { comoObjeto, estadoGeografico } from "@/lib/marketplace/validacion";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const cuerpo = comoObjeto(await request.json());
    const pais = await cambiarEstadoPais(
      getRepository(),
      params.id,
      estadoGeografico(cuerpo),
    );
    return NextResponse.json({ pais });
  } catch (error) {
    return respuestaDeError(error);
  }
}
