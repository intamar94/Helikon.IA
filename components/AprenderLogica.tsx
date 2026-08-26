"use client";

import React from "react";
import AprenderLogicaCore from "@/components/AprenderLogicaCore";
import IntroduccionReto from "@/components/IntroduccionReto";
import PracticaLogica from "@/components/PracticaLogica";
import ReforzarLogica from "@/components/ReforzarLogica";

type Fase = "introduccion" | "aprendizaje" | "practica" | "refuerzo";

export default function AprenderLogica({ onComplete }: { onComplete: () => void }) {
  const [fase, setFase] = React.useState<Fase>("introduccion");
  const [skills, setSkills] = React.useState<string[]>([]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("helikon:last-failed-skills");
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed) && parsed.length) {
        setSkills(parsed);
        setFase("refuerzo");
      }
    } catch {}
  }, []);

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

  if (fase === "refuerzo") {
    return <ReforzarLogica skills={skills} onComplete={onComplete} />;
  }

  if (fase === "aprendizaje") {
    return <AprenderLogicaCore onComplete={() => setFase("practica")} />;
  }

  return <PracticaLogica onComplete={onComplete} />;
}
