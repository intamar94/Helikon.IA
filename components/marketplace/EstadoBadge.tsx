import { CLASES_BADGE, CLASES_PUNTO, ETIQUETA_ESTADO } from "@/lib/marketplace/labels";
import type { EstadoGeografico } from "@/lib/marketplace/types";

export function EstadoBadge({ estado }: { estado: EstadoGeografico }) {
  return (
    <span className={`mkt-chip ${CLASES_BADGE[estado]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${CLASES_PUNTO[estado]}`} />
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}
