"use client";

import { useMemo, useState } from "react";

type Props = { onFinish: (correctas: number, total: number) => void };
type Item = { id: string; kind: "choice" | "code"; title: string; prompt: string; options: string[]; correct: number; habilidad: string; context?: string };

const ITEMS: Item[] = [
  { id: "predict", kind: "choice", title: "01 · Predecir", prompt: "La regla es: si temperatura > 30, encender ventilador. ¿Qué ocurre con 30°?", options: ["Se enciende", "No se enciende", "La regla no puede decidir"], correct: 1, habilidad: "predecir" },
  { id: "boundary", kind: "choice", title: "02 · Elegir el límite", prompt: "El ventilador también debe encenderse exactamente a 30°. ¿Qué condición representa mejor esa nueva regla?", options: ["temperatura > 30", "temperatura < 30", "temperatura >= 30"], correct: 2, habilidad: "límites" },
  { id: "repair", kind: "code", title: "03 · Reparar", prompt: "Este comportamiento es incorrecto: con 35° no se enciende el ventilador. ¿Qué línea corrige la decisión?", context: "if temperatura < 30:\n    encender_ventilador()", options: ["if temperatura > 30:", "if temperatura == 30:", "if temperatura < 30:"], correct: 0, habilidad: "reparar" },
  { id: "transfer", kind: "choice", title: "04 · Transferir", prompt: "Nuevo problema: si humedad_suelo < 25, regar. ¿Qué debe ocurrir con humedad_suelo = 20?", options: ["Regar", "No regar", "Cambiar la variable por temperatura"], correct: 0, habilidad: "transferir" },
  { id: "compose", kind: "choice", title: "05 · Construir", prompt: "Debes expresar una regla para mantener el invernadero ventilado cuando la temperatura llegue a 30° o más. ¿Cuál construirías?", options: ["si temperatura >= 30 → encender ventilador", "si temperatura <= 30 → apagar ventilador", "si temperatura == 30 → ignorar el dato"], correct: 0, habilidad: "construir" },
];

export default function EvaluacionLogica({ onFinish }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const complete = ITEMS.every((item) => answers[item.id] !== undefined);
  const score = useMemo(() => ITEMS.reduce((sum, item) => sum + (answers[item.id] === item.correct ? 1 : 0), 0), [answers]);
  const failedSkills = useMemo(() => [...new Set(ITEMS.filter((item) => answers[item.id] !== item.correct).map((item) => item.habilidad))], [answers]);

  function finish() {
    if (!complete) return;
    setSubmitted(true);
    try { localStorage.setItem("helikon:last-failed-skills", JSON.stringify(failedSkills)); } catch {}
    onFinish(score, ITEMS.length);
  }

  return (
    <div className="learn-experience">
      <div className="learn-top"><div><div className="sheet-eyebrow">EVALUACIÓN · DEMOSTRACIÓN</div><div className="learn-progress"><div style={{ width: `${(Object.keys(answers).length / ITEMS.length) * 100}%` }} /></div></div><div className="learn-tag">sin pistas</div></div>
      <div className="learn-icon">🧪</div>
      <div className="sheet-title">Demuestra que puedes usar la idea</div>
      <p className="learn-text">No se evalúa si recuerdas una definición. Se evalúa si puedes predecir, elegir una regla, reparar un error y usar la misma estructura en un problema nuevo.</p>
      <div className="question-list">{ITEMS.map((item) => <div className="question" key={item.id}><div className="question-n">{item.title}</div><div className="question-text">{item.prompt}</div>{item.context && <pre className="learn-code">{item.context}</pre>}<div className="options">{item.options.map((option, index) => <button key={option} className={`option ${answers[item.id] === index ? "selected" : ""}`} onClick={() => !submitted && setAnswers((current) => ({ ...current, [item.id]: index }))} disabled={submitted}>{option}</button>)}</div></div>)}</div>
      <div className="evidence-note">La evaluación identifica qué habilidad necesita refuerzo. Si fallas, Helikon no repite el mismo ejercicio: te devuelve al concepto concreto.</div>
      <button className="btn" disabled={!complete || submitted} onClick={finish}>Demostrar competencia →</button>
    </div>
  );
}
