import { NextResponse } from "next/server";
import { getRepository } from "@/lib/marketplace/repository";
import { respuestaDeError } from "@/lib/marketplace/http";
import {
  comoObjeto,
  email,
  ErrorEntrada,
  fechaISO,
  lista,
  modalidad,
  numero,
  numeroOpcional,
  numeroPositivo,
  serviciosLista,
  texto,
  textoOpcional,
} from "@/lib/marketplace/validacion";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const repo = getRepository();
    const [operadores, certificaciones, drones, anuncios] = await Promise.all([
      repo.listarOperadores(),
      repo.listarCertificaciones(),
      repo.listarDrones(),
      repo.listarAnuncios(),
    ]);
    return NextResponse.json({ operadores, certificaciones, drones, anuncios });
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

    const drones = lista(cuerpo, "drones").map((d) => {
      const anuncios = lista(d, "anuncios").map((a) => {
        const modo = modalidad(a);
        const porHectarea = numeroOpcional(a, "precio_hectarea_usd");
        const porDia = numeroOpcional(a, "precio_dia_usd");

        // Cada modalidad se cobra con su propia tarifa, y sólo con la suya.
        if (modo === "con_piloto" && porHectarea === null) {
          throw new ErrorEntrada(
            "Un anuncio con piloto necesita un precio por hectárea.",
          );
        }
        if (modo === "alquiler" && porDia === null) {
          throw new ErrorEntrada(
            "Un anuncio de alquiler necesita un precio por día.",
          );
        }

        return {
          modalidad: modo,
          servicios_ofrecidos: serviciosLista(a, "servicios_ofrecidos"),
          precio_hectarea_usd: modo === "con_piloto" ? porHectarea : null,
          precio_dia_usd: modo === "alquiler" ? porDia : null,
          horas_por_jornada: numeroOpcional(a, "horas_por_jornada") ?? 6,
        };
      });

      if (anuncios.length === 0) {
        throw new ErrorEntrada(
          `El dron «${texto(d, "modelo")}» necesita al menos un anuncio: con ` +
            "piloto, en alquiler, o los dos.",
        );
      }

      return {
        modelo: texto(d, "modelo"),
        capacidad_carga_litros: numero(d, "capacidad_carga_litros"),
        hectareas_por_hora: numeroPositivo(d, "hectareas_por_hora"),
        anuncios,
      };
    });

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
