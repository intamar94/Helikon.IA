"use client";

import { useState } from "react";

type Props = { onComplete: () => void };

export default function AprenderVariables({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [value, setValue] = useState(70);

  const next = () => { if (answer === null) return; setAnswer(null); setStep((s) => s + 1); };
  const choose = (i: number) => setAnswer(i);

  if (step === 0) return <Shell step={step} total={6} title="Una decisión puede tener más de una regla" text="Un sistema real no suele tener una sola condición. Puede decidir primero una cosa y después otra según el resultado anterior."><div className="learn-scene"><div className="learn-scene-label">SITUACIÓN</div><div className="learn-big">precio = 120 €</div><div className="learn-arrow">↓</div><div className="learn-action">¿qué descuento corresponde?</div></div><p className="learn-question">¿Qué necesitas para que el sistema pueda elegir entre distintos descuentos?</p><Choices options={["Una sola acción fija", "Reglas que se evalúan según los datos", "Un loop infinito"]} answer={answer} choose={choose}/><Continue disabled={answer !== 1} onClick={next} label="Descubrir el orden de las reglas →"/></Shell>;

  if (step === 1) return <Shell step={step} total={6} title="El orden cambia el resultado" text="Dos reglas pueden ser correctas por separado y aun así producir un resultado incorrecto si se evalúan en un orden equivocado."><div className="learn-challenge"><b>REGLAS</b><br/>si precio > 100 → descuento 10%<br/>si precio > 500 → descuento 30%</div><p className="learn-question">Con precio = 600, ¿qué regla debe comprobarse primero?</p><Choices options={["> 100", "> 500", "Da igual"]} answer={answer} choose={choose}/><Continue disabled={answer !== 1} onClick={next} label="Ver el problema de una regla demasiado amplia →"/></Shell>;

  if (step === 2) return <Shell step={step} total={6} title="Una regla puede ocultar otra" text="Si compruebas primero una condición amplia, una condición más específica puede quedar inaccesible."><div className="learn-code">if precio &gt; 100:\n    descuento = 10\nelse if precio &gt; 500:\n    descuento = 30</div><p className="learn-question">¿Qué ocurre con 600 €?</p><Choices options={["30%", "10%", "No hay descuento"]} answer={answer} choose={choose}/><Continue disabled={answer !== 1} onClick={next} label="Detectar la contradicción →"/></Shell>;

  if (step === 3) return <Shell step={step} total={6} title="Corrige la estructura" text="La condición específica debe tener prioridad sobre la general."><div className="learn-code">if precio &gt; 500:\n    descuento = 30\nelse if precio &gt; 100:\n    descuento = 10</div><p className="learn-question">Con 600 €, ¿qué descuento obtienes?</p><Choices options={["10%", "30%", "0%"]} answer={answer} choose={choose}/><Continue disabled={answer !== 1} onClick={next} label="Transferir el patrón →"/></Shell>;

  if (step === 4) return <Shell step={step} total={6} title="El mismo patrón aparece fuera de precios" text="Ahora controla la velocidad de un ventilador. Cambia el dominio, pero conserva la idea de reglas ordenadas."><div className="learn-slider-card"><div className="learn-temperature">{value}%</div><input type="range" min="0" max="100" value={value} onChange={(e) => setValue(Number(e.target.value))}/><div className="learn-range"><span>0</span><span>50</span><span>100</span></div></div><p className="learn-question">Si la humedad supera 80%, ¿qué regla específica debe evaluarse antes que una regla para &gt; 50%?</p><Choices options={["> 50", "> 80", "Ninguna"]} answer={answer} choose={choose}/><Continue disabled={answer !== 1} onClick={next} label="Reconstruir la idea esencial →"/></Shell>;

  return <Shell step={step} total={6} title="Ya no basta con reconocer una regla" text="Debes poder construir un orden de decisiones y detectar cuándo una condición general bloquea una más específica."><div className="learn-summary"><div><span>01</span><b>Orden</b><p>las reglas específicas pueden ir primero</p></div><div><span>02</span><b>Contradicción</b><p>una condición amplia puede ocultar otra</p></div><div><span>03</span><b>Transferencia</b><p>el patrón funciona en otro dominio</p></div></div><div className="learn-challenge"><b>PRÓXIMA FASE</b><br/>Ahora construirás y repararás reglas sin que Helikon te dé el orden.</div><button className="btn" onClick={onComplete}>Empezar práctica →</button></Shell>;
}

function Shell({ step, total, title, text, children }: { step:number; total:number; title:string; text:string; children:React.ReactNode }) {
  return <div className="learn-experience"><div className="learn-top"><div><div className="sheet-eyebrow">APRENDER · {step + 1}/{total}</div><div className="learn-progress"><div style={{width:`${((step+1)/total)*100}%`}}/></div></div><div className="learn-tag">reglas + control de flujo</div></div><div className="learn-icon">🧭</div><div className="sheet-title">{title}</div><p className="learn-text">{text}</p>{children}<div className="learn-nav"><button className="learn-back" disabled={step===0} onClick={()=>{}}>← Atrás</button><span className="learn-tag">evidencia de comprensión</span></div></div>;
}
function Choices({options,answer,choose}:{options:string[];answer:number|null;choose:(i:number)=>void}) { return <div className="learn-choice-grid">{options.map((x,i)=><button key={x} className={`learn-choice ${answer===i?"selected":""}`} onClick={()=>choose(i)}>{x}</button>)}</div>; }
function Continue({disabled,onClick,label}:{disabled:boolean;onClick:()=>void;label:string}) { return <button className="btn" disabled={disabled} onClick={onClick}>{label}</button>; }
