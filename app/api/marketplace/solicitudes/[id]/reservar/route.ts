import { NextResponse } from "next/server";
import { getRepository } from "@/lib/marketplace/repository";
import { reservarOpcion } from "@/lib/marketplace/service";
import { respuestaDeError } from "@/lib/marketplace/http";
import { comoObjeto, texto } from "@/lib/marketplace/validacion";

export const dynamic = "force-dynamic";

/**
 * Reserva un anuncio para una solicitud. El servicio vuelve a correr el motor
 * antes de aceptar: nunca se confía en el precio ni en la habilitación que
 * llegue del cliente.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const cuerpo = comoObjeto(await request.json());
    const reserva = await reservarOpcion(
      getRepository(),
      params.id,
      texto(cuerpo, "anuncio_id"),
    );
    return NextResponse.json(reserva, { status: 201 });
  } catch (error) {
    return respuestaDeError(error);
  }
}
