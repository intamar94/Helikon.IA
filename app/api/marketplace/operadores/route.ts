import { NextResponse } from "next/server";
import { getRepository } from "@/lib/marketplace/repository";
import { respuestaDeError } from "@/lib/marketplace/http";
import {
  comoObjeto,
  email,
  ErrorEntrada,
  fechaISO,
  lista,
  numero,
  numeroPositivo,
  serviciosLista,
  texto,
  textoOpcional,
} from "@/lib/marketplace/validacion";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const repo = getRepository();
    const [operadores, certificaciones, drones] = await Promise.all([
      repo.listarOperadores(),
      repo.listarCertificaciones(),
      repo.listarDrones(),
    ]);
    return NextResponse.json({ operadores, certificaciones, drones });
  } catch (error) {
    return respuestaDeError(error);
  }
}

export async function POST(request: Request) {
  try {
    const cuerpo = comoObjeto(await request.json());

    const certificaciones = lista(cuerpo, "certificaciones").map((c) => ({
      pais_id: texto(c, "pais_id"),
      tipo_certificacion: texto(c, "tipo_certificacion"),
      numero: texto(c, "numero"),
      vigente_hasta: fechaISO(c, "vigente_hasta"),
      documento_url: textoOpcional(c, "documento_url"),
    }));

    if (certificaciones.length === 0) {
      throw new ErrorEntrada(
        "Cargá al menos una certificación: sin certificación el operador no " +
          "puede ser habilitado por ninguna regla de cumplimiento.",
      );
    }

    const drones = lista(cuerpo, "drones").map((d) => ({
      modelo: texto(d, "modelo"),
      capacidad_carga_litros: numero(d, "capacidad_carga_litros"),
      servicios_ofrecidos: serviciosLista(d, "servicios_ofrecidos"),
      hectareas_por_hora: numeroPositivo(d, "hectareas_por_hora"),
      precio_base_hectarea_usd: numero(d, "precio_base_hectarea_usd"),
    }));

    if (drones.length === 0) {
      throw new ErrorEntrada("Cargá al menos un dron en la flota.");
    }

    const operador = await getRepository().crearOperador({
      nombre: texto(cuerpo, "nombre"),
      email: email(cuerpo),
      pais_base_id: texto(cuerpo, "pais_base_id"),
      ubicacion_lat: numero(cuerpo, "ubicacion_lat"),
      ubicacion_lng: numero(cuerpo, "ubicacion_lng"),
      certificaciones,
      drones,
    });

    return NextResponse.json({ operador }, { status: 201 });
  } catch (error) {
    return respuestaDeError(error);
  }
}
