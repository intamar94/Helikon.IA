"use client";

import React from "react";
import AprenderLogicaCore from "@/components/AprenderLogicaCore";
import IntroduccionReto from "@/components/IntroduccionReto";
import PracticaLogica from "@/components/PracticaLogica";

type Fase = "introduccion" | "aprendizaje" | "practica";

export default function AprenderLogica({ onComplete }: { onComplete: () => void }) {
  const [fase, setFase] = React.useState<Fase>("introduccion");

  if (fase === "introduccion") {
    return (
      <IntroduccionReto
        numero={1}
        rama="Fundamentos"
        nombre="Lógica de programación"
        objetivo="Resolver problemas con lógica de programación y tomar decisiones según datos."
        onStart={() => setFase("aprendizaje")}
      />
    );
  }

  if (fase === "aprendizaje") {
    return <AprenderLogicaCore onComplete={() => setFase("practica")} />;
  }

  return <PracticaLogica onComplete={onComplete} />;
}
