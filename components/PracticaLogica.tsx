"use client";

import { useMemo, useState } from "react";

const TOTAL = 4;

type Props = { onComplete: () => void };

export default function PracticaLogica({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const tasks = useMemo(() => [
    {
      title: "Construye la regla",
      text: "El ventilador debe encenderse únicamente cuando la temperatura supere 30 °C. ¿Qué comparación necesitas?",
      options: ["temperatura < 30", "temperatura > 30", "temperatura = 30"],
      correct: 1,
      good: "Correcto. La regla debe distinguir los valores que están por encima de 30.",
      bad: "Busca la palabra «supere»: significa que el valor debe ser mayor que 30."
    },
    {
      title: "Predice antes de ejecutar",
      text: "Usando esa regla, ¿qué secuencia de decisiones es correcta para 25 °C, 35 °C y 30 °C?",
      options: ["no / sí / no", "sí / no / sí", "no / sí / sí"],
      correct: 0,
      good: "Bien. 35 activa la regla; 25 y 30 no la superan.",
      bad: "Recuerda que «> 30» no incluye 30."
    },
    {
      title: "Detecta el fallo",
      text: "Encuentras este código: `if temperatura >= 30`. ¿Qué comportamiento incorrecto introduce?",
      options: ["También enciende el ventilador exactamente a 30 °C", "Nunca enciende el ventilador", "Solo funciona con temperaturas negativas"],
      correct: 0,
      good: "Exacto. Cambiar > por >= modifica el límite y cambia el comportamiento del sistema.",
      bad: "Compara > y >=: el segundo también acepta exactamente 30."
    },
    {
      title: "Transfiere la solución",
      text: "Ahora cambia el dominio. Una planta debe regarse cuando la humedad sea menor que 25 %. ¿Cuál conserva la misma estructura lógica?",
      options: ["si humedad > 25 → regar", "si humedad < 25 → regar", "si humedad = 25 → no hacer nada"],
      correct: 1,
      good: "Transferencia conseguida. La estructura se mantiene aunque cambien el dato y la acción.",
      bad: "La planta necesita agua cuando la humedad cae por debajo del umbral."
    }
  ], []);

  const current = tasks[step];
  const answered = answers[step] !== undefined;

  function choose(index: number) {
    setAnswers((prev) => ({ ...prev, [step]: index }));
    setFeedback(index === current.correct ? current.good : current.bad);
  }

  function next() {
    if (!answered || answers[step] !== current.correct) return;
    setFeedback(null);
    if (step === TOTAL - 1) onComplete();
    else setStep((value) => value + 1);
  }

  return (
    <div className="learn-experience">
      <div className="learn-top">
        <div>
          <div className="sheet-eyebrow">PRÁCTICA · {step + 1}/{TOTAL}</div>
          <div className="learn-progress"><div style={{ width: `${((step + 1) / TOTAL) * 100}%` }} /></div>
        </div>
        <div className="learn-tag">construcción + transferencia</div>
      </div>

      <div className="learn-icon">🛠️</div>
      <div className="sheet-title">{current.title}</div>
      <p className="learn-text">{current.text}</p>

      <div className="learn-choice-grid">
        {current.options.map((option, index) => (
          <button
            key={option}
            className={`learn-choice ${answers[step] === index ? "selected" : ""}`}
            onClick={() => choose(index)}
          >
            {option}
          </button>
        ))}
      </div>

      {feedback && (
        <div className={`learn-feedback ${answers[step] === current.correct ? "good" : "bad"}`}>
          {answers[step] === current.correct ? "✓ " : "! "}{feedback}
        </div>
      )}

      <button className="btn" disabled={!answered || answers[step] !== current.correct} onClick={next}>
        {step === TOTAL - 1 ? "Cerrar práctica y demostrar →" : "Siguiente desafío →"}
      </button>

      <div className="learn-challenge">
        <b>Qué comprueba Helikon</b><br />
        No basta con reconocer una definición: debes predecir, detectar un cambio de comportamiento y trasladar la estructura a otro problema.
      </div>
    </div>
  );
}
