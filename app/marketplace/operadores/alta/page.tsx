import { FormularioOperador } from "@/components/marketplace/FormularioOperador";
import { getRepository } from "@/lib/marketplace/repository";

export const dynamic = "force-dynamic";

export default async function PaginaAltaOperador() {
  const paises = await getRepository().listarPaises();
  return <FormularioOperador paises={paises} />;
}
