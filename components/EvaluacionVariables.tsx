"use client";

import { useMemo, useState } from "react";

type Props = { onFinish: (correctas: number, total: number) => void };
type Item = { id: string; title: string; prompt: string; options: string[]; correct: number; skill: string };
const ITEMS: Item[] = [
  { id: "order", title: "01 · Orden", prompt: "Para precio = 600, ¿qué condición debe evaluarse antes?", options: ["precio > 100", "precio > 500", "precio == 600"], correct: 1, skill: "orden" },
  { id: "shadow", title: "02 · Detectar", prompt: "¿Qué problema aparece si `if precio > 100` está antes de `else if precio > 500`?", options: ["La segunda regla queda inaccesible para 600", "El programa se vuelve más rápido", "No cambia nada"], correct: 0, skill: "detectar" },
  { id: "repair", title: "03 · Reparar", prompt: "¿Qué versión corrige el descuento para 600 €?", options: [">500 → 30%, después >100 → 10%", ">100 → 10%, después >500 → 30%", "solo >100 → 10%"], correct: 0, skill: "reparar" },
  { id: "transfer", title: "04 · Transferir", prompt: "Si humedad >80 activa una acción especial y humedad >50 una general, ¿qué patrón conviene?", options: ["Evaluar >50 primero", "Evaluar >80 primero", "No usar condiciones"], correct: 1, skill: "transferir" },
  { id: "build", title: "05 · Construir", prompt: "Quieres tres niveles: >80 alto, >50 medio, resto bajo. ¿Cuál es el orden correcto?", options: [">50, luego >80, luego resto", ">80, luego >50, luego resto", "resto, luego >80, luego >50"], correct: 1, skill: "construir" }
];

export default function EvaluacionVariables({ onFinish }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const complete = ITEMS.every((item) => answers[item.id] !== undefined);
  const score = useMemo(() => ITEMS.reduce((sum, item) => sum + (answers[item.id] === item.correct ? 1 : 0), 0), [answers]);
  const failed = useMemo(() => [...new Set(ITEMS.filter((item) => answers[item.id] !== item.correct).map((item) => item.skill))], [answers]);

  function finish() {
    if (!complete || submitted) return;
    setSubmitted(true);
    try { localStorage.setItem("helikon:last-failed-skills", JSON.stringify(failed)); } catch {}
    onFinish(score, ITEMS.length);
  }

  return <div className="learn-experience"><div className="learn-top"><div><div className="sheet-eyebrow">EVALUACIÓN · RETO 02</div><div className="learn-progress"><div style={{width:`${(Object.keys(answers).length/ITEMS.length)*100}%`}}/></div></div><div className="learn-tag">sin pistas</div></div><div className="learn-icon">🧪</div><div className="sheet-title">Demuestra que puedes controlar el flujo</div><p className="learn-text">No se evalúa memorizar sintaxis. Se evalúa ordenar reglas, detectar una condición que oculta otra, reparar el fallo y transferir el patrón.</p><div className="question-list">{ITEMS.map((item)=><div className="question" key={item.id}><div className="question-n">{item.title}</div><div className="question-text">{item.prompt}</div><div className="options">{item.options.map((option,index)=><button key={option} className={`option ${answers[item.id]===index?"selected":""}`} onClick={()=>!submitted&&setAnswers((current)=>({...current,[item.id]:index}))} disabled={submitted}>{option}</button>)}</div></div>)}</div><div className="evidence-note">Las habilidades fallidas quedan asociadas al intento para dirigir el siguiente refuerzo.</div><button className="btn" disabled={!complete||submitted} onClick={finish}>Demostrar competencia →</button></div>;
}
