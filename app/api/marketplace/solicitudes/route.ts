import { NextResponse } from "next/server";
import { getRepository } from "@/lib/marketplace/repository";
import { procesarSolicitud } from "@/lib/marketplace/service";
import { respuestaDeError } from "@/lib/marketplace/http";
import {
  comoObjeto,
  fechaISO,
  modalidad,
  numeroPositivo,
  servicio,
  texto,
  textoOpcional,
} from "@/lib/marketplace/validacion";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const repo = getRepository();
    return NextResponse.json({ solicitudes: await repo.listarSolicitudes() });
  } catch (error) {
    return respuestaDeError(error);
  }
}

export async function POST(request: Request) {
  try {
    const cuerpo = comoObjeto(await request.json());
    const entrada = {
      productor_id: texto(cuerpo, "productor_id"),
      pais_id: texto(cuerpo, "pais_id"),
      region_id: texto(cuerpo, "region_id"),
      cultivo: texto(cuerpo, "cultivo"),
      servicio: servicio(cuerpo),
      modalidad: "modalidad" in cuerpo ? modalidad(cuerpo) : "con_piloto",
      hectareas: numeroPositivo(cuerpo, "hectareas"),
      fecha_deseada: fechaISO(cuerpo, "fecha_deseada"),
      producto_a_aplicar: textoOpcional(cuerpo, "producto_a_aplicar") ?? "",
    };

    const { resultado, solicitud } = await procesarSolicitud(
      getRepository(),
      entrada,
    );
    // 200 siempre: un rechazo por normativa es una respuesta legítima del
    // motor, no un error de la petición.
    return NextResponse.json({ resultado, solicitud });
  } catch (error) {
    return respuestaDeError(error);
  }
}
