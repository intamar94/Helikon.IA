import { VistaCobertura } from "@/components/marketplace/VistaCobertura";
import { getRepository } from "@/lib/marketplace/repository";

export const dynamic = "force-dynamic";

export default async function PaginaCobertura() {
  const repo = getRepository();
  const [paises, regiones, reglas] = await Promise.all([
    repo.listarPaises(),
    repo.listarRegiones(),
    repo.listarReglas(),
  ]);

  return <VistaCobertura paises={paises} regiones={regiones} reglas={reglas} />;
}
