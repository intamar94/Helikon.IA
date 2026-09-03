import { NextResponse } from "next/server";
import { getRepository } from "@/lib/marketplace/repository";
import { respuestaDeError } from "@/lib/marketplace/http";
import { booleano, comoObjeto } from "@/lib/marketplace/validacion";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const cuerpo = comoObjeto(await request.json());
    const operador = await getRepository().verificarOperador(
      params.id,
      booleano(cuerpo, "verificado"),
    );
    return NextResponse.json({ operador });
  } catch (error) {
    return respuestaDeError(error);
  }
}
