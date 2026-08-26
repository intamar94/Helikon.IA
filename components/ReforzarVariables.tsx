"use client";

import { useMemo, useState } from "react";

type Props = { skills: string[]; onComplete: () => void };
const ITEMS = [
  { skill: "orden", title: "Ordena la decisión", prompt: "Con 900 €, hay reglas >100 y >500. ¿Cuál debe evaluarse primero?", options: [">100", ">500", "Da igual"], correct: 1 },
  { skill: "detectar", title: "Detecta la regla oculta", prompt: "¿Por qué `if precio > 100` antes de `else if precio > 500` es un problema?", options: ["La regla >500 no llega a evaluarse para 600", "El código usa demasiadas variables", "No existe ningún problema"], correct: 0 },
  { skill: "reparar", title: "Repara la prioridad", prompt: "¿Qué estructura corrige el caso de 600 €?", options: [">500 → 30%; si no, >100 → 10%", ">100 → 10%; si no, >500 → 30%", "solo >100 → 10%"], correct: 0 },
  { skill: "transferir", title: "Transfiere el patrón", prompt: "Si humedad >80 es crítica y >50 es normal, ¿qué condición debe ir primero?", options: [">50", ">80", "ninguna"], correct: 1 },
  { skill: "construir", title: "Construye el orden", prompt: "Tres niveles: >80 alto, >50 medio, resto bajo. ¿Cuál es la secuencia?", options: [">80 → >50 → resto", ">50 → >80 → resto", "resto → >80 → >50"], correct: 0 }
];

export default function ReforzarVariables({ skills, onComplete }: Props) {
  const active = useMemo(() => {
    const selected = skills.map((skill) => ITEMS.find((item) => item.skill === skill)).filter(Boolean) as typeof ITEMS;
    return selected.length ? selected : ITEMS.slice(0, 1);
  }, [skills]);
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const current = active[step];
  const correct = answer === current.correct;
  function next() {
    if (!correct) return;
    if (step === active.length - 1) {
      try { localStorage.removeItem("helikon:last-failed-skills"); } catch {}
      onComplete();
      return;
    }
    setStep((s) => s + 1);
    setAnswer(null);
  }
  return <div className="learn-experience"><div className="learn-top"><div><div className="sheet-eyebrow">REFUERZO ADAPTATIVO · {step + 1}/{active.length}</div><div className="learn-progress"><div style={{width:`${((step+1)/active.length)*100}%`}}/></div></div><div className="learn-tag">habilidad detectada</div></div><div className="learn-icon">🔧</div><div className="sheet-title">{current.title}</div><p className="learn-text">Helikon conserva la habilidad que falló y cambia la situación para comprobar si ahora puedes usarla.</p><div className="learn-challenge"><b>HABILIDAD · {current.skill}</b><br/>{current.prompt}</div><div className="learn-choice-grid">{current.options.map((option,index)=><button key={option} className={`learn-choice ${answer===index?"selected":""}`} onClick={()=>setAnswer(index)}>{option}</button>)}</div>{answer!==null&&<div className={`learn-feedback ${correct?"good":"bad"}`}>{correct?"✓ Evidencia recuperada.":"! Revisa qué condición es más específica."}</div>}<button className="btn" disabled={!correct} onClick={next}>{step===active.length-1?"Volver a demostrar →":"Siguiente refuerzo →"}</button><div className="evidence-note">El refuerzo prepara una nueva demostración; no concede dominio por sí mismo.</div></div>;
}
