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
    solicitudes,
    listaEspera,
  ] = await Promise.all([
    repo.listarPaises(),
    repo.listarRegiones(),
    repo.listarReglas(),
    repo.listarOperadores(),
    repo.listarCertificaciones(),
    repo.listarDrones(),
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
      solicitudes={solicitudes}
      listaEspera={listaEspera}
      fuente={repo.fuente}
    />
  );
}
