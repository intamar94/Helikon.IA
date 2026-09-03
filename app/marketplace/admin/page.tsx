import { PanelAdmin } from "@/components/marketplace/PanelAdmin";
import { getRepository } from "@/lib/marketplace/repository";

export const dynamic = "force-dynamic";

export default async function PaginaAdmin() {
  const repo = getRepository();
  const [
    paises,
    regiones,
    reglas,
    operadores,
    certificaciones,
    drones,
    anuncios,
    solicitudes,
    listaEspera,
  ] = await Promise.all([
    repo.listarPaises(),
    repo.listarRegiones(),
    repo.listarReglas(),
    repo.listarOperadores(),
    repo.listarCertificaciones(),
    repo.listarDrones(),
    repo.listarAnuncios(),
    repo.listarSolicitudes(),
    repo.listarListaEspera(),
  ]);

  return (
    <PanelAdmin
      paises={paises}
      regiones={regiones}
      reglas={reglas}
      operadores={operadores}
      certificaciones={certificaciones}
      drones={drones}
      anuncios={anuncios}
      solicitudes={solicitudes}
      listaEspera={listaEspera}
      fuente={repo.fuente}
    />
  );
}
