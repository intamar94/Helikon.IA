"use client";

import { useState } from "react";
import AprenderLogica from "@/components/AprenderLogica";
import IntroduccionReto from "@/components/IntroduccionReto";

type Props = {
  numero: number;
  rama: string;
  nombre: string;
  objetivo: string | null;
  onComplete: () => void;
};

export default function ExperienciaAprenderLogica({ numero, rama, nombre, objetivo, onComplete }: Props) {
  const [introduccionCompletada, setIntroduccionCompletada] = useState(false);

  if (!introduccionCompletada) {
    return (
      <IntroduccionReto
        numero={numero}
        rama={rama}
        nombre={nombre}
        objetivo={objetivo}
        onStart={() => setIntroduccionCompletada(true)}
      />
    );
  }

  return <AprenderLogica onComplete={onComplete} />;
}
