export type Estado = "bloqueado" | "disponible" | "dominado";

export interface Nodo {
  id: string;
  numero: number;
  nombre: string;
  rama: string;
  objetivo: string | null;
  construir: string | null;
  romper: string | null;
  resolver: string | null;
  prerequisitos: string[];
}
