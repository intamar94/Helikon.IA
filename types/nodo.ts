export type Estado =
  | "bloqueado"
  | "disponible"
  | "en_aprendizaje"
  | "practicando"
  | "evaluando"
  | "dominado";

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

export interface Pregunta {
  pregunta: string;
  opciones: string[];
  correcta: number;
  explicacion?: string;
}

export interface EvaluacionNodo {
  nodo_id: string;
  practica: Pregunta[];
  preguntas: Pregunta[];
}
