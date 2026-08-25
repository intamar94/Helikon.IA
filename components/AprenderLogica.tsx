"use client";

import React from "react";
import AprenderLogicaCore from "@/components/AprenderLogicaCore";
import IntroduccionReto from "@/components/IntroduccionReto";

export default function AprenderLogica({ onComplete }: { onComplete: () => void }) {
  const [introduccionCompletada, setIntroduccionCompletada] = React.useState(false);
  if (!introduccionCompletada) {
    return <IntroduccionReto numero={1} rama="Fundamentos" nombre="Lógica de programación" objetivo="Resolver problemas con lógica de programación y tomar decisiones según datos." onStart={() => setIntroduccionCompletada(true)} />;
  }
  return <AprenderLogicaCore onComplete={onComplete} />;
}
