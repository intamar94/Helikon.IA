import { Suspense } from "react";
import { FormularioSolicitud } from "@/components/marketplace/FormularioSolicitud";
import { getRepository } from "@/lib/marketplace/repository";

export const dynamic = "force-dynamic";

export default async function PaginaSolicitar() {
  const repo = getRepository();
  const [paises, regiones, productores] = await Promise.all([
    repo.listarPaises(),
    repo.listarRegiones(),
    repo.listarProductores(),
  ]);

  return (
    <Suspense
      fallback={<p className="text-sm text-slate-500">Cargando formulario…</p>}
    >
      <FormularioSolicitud
        paises={paises}
        regiones={regiones}
        productores={productores}
      />
    </Suspense>
  );
}
