"use client";

import { useMemo, useState } from "react";

type Props = { skills: string[]; onComplete: () => void };

type Challenge = {
  skill: string;
  title: string;
  prompt: string;
  options: string[];
  correct: number;
  success: string;
  hint: string;
};

const CHALLENGES: Challenge[] = [
  {
    skill: "predecir",
    title: "Predicción",
    prompt: "La regla dice: si temperatura > 30, encender ventilador. ¿Qué ocurre con 29 °C?",
    options: ["Se enciende", "No se enciende", "La regla cambia"],
    correct: 1,
    success: "Ahora predices el resultado antes de ejecutar la regla.",
    hint: "Compara 29 con 30 usando >."
  },
  {
    skill: "límites",
    title: "Límite",
    prompt: "El sistema debe activarse a 30 °C y también por encima. ¿Qué condición necesitas?",
    options: ["temperatura > 30", "temperatura >= 30", "temperatura < 30"],
    correct: 1,
    success: "Has distinguido correctamente el límite incluido.",
    hint: "El requisito incluye exactamente 30."
  },
  {
    skill: "reparar",
    title: "Reparación",
    prompt: "Con 35 °C el ventilador no se activa. El código usa `if temperatura < 30`. ¿Qué debes cambiar?",
    options: ["< por >", "< por ==", "30 por 0"],
    correct: 0,
    success: "Has localizado la parte de la regla que cambia el comportamiento.",
    hint: "35 debe satisfacer la condición."
  },
  {
    skill: "transferir",
    title: "Transferencia",
    prompt: "Cambia de dominio: si humedad < 25, regar. Con 18 % de humedad, ¿qué haces?",
    options: ["Regar", "No regar", "Medir temperatura"],
    correct: 0,
    success: "La estructura lógica se conserva aunque cambie el dominio.",
    hint: "El dato sigue comparándose con un umbral."
  },
  {
    skill: "construir",
    title: "Construcción",
    prompt: "Construye una regla: apagar el ventilador cuando la temperatura sea menor de 20 °C.",
    options: ["si temperatura < 20 → apagar", "si temperatura > 20 → apagar", "si temperatura == 20 → apagar"],
    correct: 0,
    success: "Has construido la regla a partir del comportamiento deseado.",
    hint: "'Menor de 20' se expresa con < 20."
  }
];

export default function ReforzarLogica({ skills, onComplete }: Props) {
  const active = useMemo(() => {
    const selected = skills.map((skill) => CHALLENGES.find((item) => item.skill === skill)).filter(Boolean) as Challenge[];
    return selected.length ? selected : CHALLENGES.slice(0, 1);
  }, [skills]);
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const current = active[step];
  const correct = answer === current.correct;

  function choose(index: number) {
    setAnswer(index);
  }

  function next() {
    if (!correct) return;
    if (step === active.length - 1) {
      try { localStorage.removeItem("helikon:last-failed-skills"); } catch {}
      onComplete();
      return;
    }
    setStep((value) => value + 1);
    setAnswer(null);
  }

  return (
    <div className="learn-experience">
      <div className="learn-top">
        <div>
          <div className="sheet-eyebrow">REFUERZO ADAPTATIVO · {step + 1}/{active.length}</div>
          <div className="learn-progress"><div style={{ width: `${((step + 1) / active.length) * 100}%` }} /></div>
        </div>
        <div className="learn-tag">habilidad detectada</div>
      </div>
      <div className="learn-icon">🔧</div>
      <div className="sheet-title">{current.title}</div>
      <p className="learn-text">Helikon ha detectado que esta habilidad necesita evidencia adicional. El ejercicio cambia; la habilidad objetivo se mantiene.</p>
      <div className="learn-challenge"><b>HABILIDAD · {current.skill}</b><br />{current.prompt}</div>
      <div className="learn-choice-grid">
        {current.options.map((option, index) => (
          <button key={option} className={`learn-choice ${answer === index ? "selected" : ""}`} onClick={() => choose(index)}>{option}</button>
        ))}
      </div>
      {answer !== null && (
        <div className={`learn-feedback ${correct ? "good" : "bad"}`}>
          {correct ? `✓ ${current.success}` : `! ${current.hint}`}
        </div>
      )}
      <button className="btn" disabled={!correct} onClick={next}>{step === active.length - 1 ? "Volver a demostrar →" : "Siguiente refuerzo →"}</button>
      <div className="evidence-note">Este refuerzo no sustituye la evaluación. Solo prepara una nueva demostración con evidencia dirigida.</div>
    </div>
  );
}
