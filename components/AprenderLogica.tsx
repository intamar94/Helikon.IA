"use client";

import AprenderLogicaCore from "@/components/AprenderLogicaCore";
import IntroduccionReto from "@/components/IntroduccionReto";

export default function AprenderLogica({ numero = 1, rama = "Fundamentos", nombre = "Lógica de programación", objetivo = "Comprender y aplicar lógica de programación.", onComplete }: { numero?: number; rama?: string; nombre?: string; objetivo?: string | null; onComplete: () => void }) {
  const [introduccionCompletada, setIntroduccionCompletada] = React.useState(false);
  if (!introduccionCompletada) {
    return <IntroduccionReto numero={numero} rama={rama} nombre={nombre} objetivo={objetivo} onStart={() => setIntroduccionCompletada(true)} />;
  }
  return <AprenderLogicaCore onComplete={onComplete} />;
}
