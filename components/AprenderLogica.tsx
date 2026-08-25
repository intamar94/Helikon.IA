"use client";

import { useMemo, useState } from "react";

const totalSteps = 6;

export default function AprenderLogica({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [temperature, setTemperature] = useState(35);
  const [decision, setDecision] = useState<boolean | null>(null);
  const [loopAnswer, setLoopAnswer] = useState<number | null>(null);
  const [memoryAnswer, setMemoryAnswer] = useState<number | null>(null);
  const [caseAnswers, setCaseAnswers] = useState<Record<number, boolean>>({});
  const [hint, setHint] = useState(false);

  const caseItems = useMemo(() => [
    { label: "temperatura = 32", valid: true },
    { label: "temperatura = -5", valid: true },
    { label: 'temperatura = "treinta"', valid: false },
  ], []);

  const next = () => {
    setHint(false);
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  };

  const previous = () => {
    setHint(false);
    setStep((s) => Math.max(0, s - 1));
  };

  const decisionCorrect = decision === (temperature > 30);
  const memoryCorrect = memoryAnswer === 1;
  const loopCorrect = loopAnswer === 5;
  const casesDone = Object.keys(caseAnswers).length === caseItems.length;
  const casesCorrect = caseItems.every((item, i) => caseAnswers[i] === item.valid);

  return (
    <div className="learn-experience">
      <div className="learn-top">
        <div>
          <div className="sheet-eyebrow">APRENDER · {step + 1}/{totalSteps}</div>
          <div className="learn-progress"><div style={{ width: `${((step + 1) / totalSteps) * 100}%` }} /></div>
        </div>
        <div className="learn-tag">+comprensión</div>
      </div>

      {step === 0 && <>
        <div className="learn-icon">🤖</div>
        <div className="sheet-title">Enséñale a una máquina a decidir</div>
        <p className="learn-text">Una estación recibe objetos. Algunos deben pasar y otros necesitan una acción diferente. Tu trabajo es darle una regla.</p>
        <div className="learn-scene">
          <div className="learn-scene-label">REGLA</div>
          <div className="learn-big">Si temperatura &gt; 30</div>
          <div className="learn-arrow">↓</div>
          <div className="learn-action">❄️ enfriar</div>
        </div>
        <p className="learn-question">¿Qué acabas de construir?</p>
        <div className="learn-choice-grid">
          <button className="learn-choice" onClick={next}>Una condición: si ocurre algo, toma una decisión</button>
          <button className="learn-choice" onClick={() => setHint(true)}>Una repetición automática</button>
        </div>
        {hint && <div className="learn-feedback">Casi. La repetición aparece cuando queremos hacer una acción varias veces. Aquí la máquina decide según una condición.</div>}
      </>}

      {step === 1 && <>
        <div className="learn-icon">🎚️</div>
        <div className="sheet-title">Ahora haz que la regla cambie</div>
        <p className="learn-text">Mueve la temperatura. La máquina debe enfriar solamente cuando sea mayor que 30.</p>
        <div className="learn-slider-card">
          <div className="learn-temperature">{temperature}°</div>
          <input type="range" min="15" max="45" value={temperature} onChange={(e) => { setTemperature(Number(e.target.value)); setDecision(null); }} />
          <div className="learn-range"><span>15°</span><span>30°</span><span>45°</span></div>
        </div>
        <div className="learn-question">Con {temperature}°, ¿la máquina debe enfriar?</div>
        <div className="learn-choice-grid two">
          <button className={`learn-choice ${decision === true ? "selected" : ""}`} onClick={() => setDecision(true)}>Sí</button>
          <button className={`learn-choice ${decision === false ? "selected" : ""}`} onClick={() => setDecision(false)}>No</button>
        </div>
        {decision !== null && <div className={`learn-feedback ${decisionCorrect ? "good" : "bad"}`}>{decisionCorrect ? "✓ Correcto. La condición convierte un dato en una decisión." : "No todavía. Compara el valor con 30: ¿es realmente mayor?"}</div>}
        <button className="btn" disabled={!decisionCorrect} onClick={next}>Entendí la condición →</button>
      </>}

      {step === 2 && <>
        <div className="learn-icon">🔁</div>
        <div className="sheet-title">Ahora la máquina repite</div>
        <p className="learn-text">Hay 5 objetos en la bandeja. Queremos revisar cada uno. No queremos escribir la misma instrucción cinco veces.</p>
        <div className="learn-loop">
          <div className="learn-code-line"><span>for</span> cada objeto <span>en</span> bandeja:</div>
          <div className="learn-code-line indent">→ revisar(objeto)</div>
        </div>
        <div className="learn-question">¿Cuántas veces se ejecuta <span className="mono">revisar(objeto)</span>?</div>
        <div className="learn-choice-grid">
          {[1, 4, 5].map((n) => <button key={n} className={`learn-choice ${loopAnswer === n ? "selected" : ""}`} onClick={() => setLoopAnswer(n)}>{n} veces</button>)}
        </div>
        {loopAnswer !== null && <div className={`learn-feedback ${loopCorrect ? "good" : "bad"}`}>{loopCorrect ? "✓ Exacto. Un loop repite una acción para cada elemento." : "Mira cuántos objetos hay en la bandeja. El loop recorre todos."}</div>}
        <button className="btn" disabled={!loopCorrect} onClick={next}>Seguir →</button>
      </>}

      {step === 3 && <>
        <div className="learn-icon">🧠</div>
        <div className="sheet-title">Sin mirar: recupera la idea</div>
        <p className="learn-text">No buscamos memoria literal. Queremos comprobar que puedes reconstruir el concepto.</p>
        <div className="learn-memory">Una <b>_____</b> decide entre caminos. Un <b>_____</b> repite una acción.</div>
        <div className="learn-choice-grid">
          <button className={`learn-choice ${memoryAnswer === 0 ? "selected" : ""}`} onClick={() => setMemoryAnswer(0)}>variable / función</button>
          <button className={`learn-choice ${memoryAnswer === 1 ? "selected" : ""}`} onClick={() => setMemoryAnswer(1)}>condición / loop</button>
          <button className={`learn-choice ${memoryAnswer === 2 ? "selected" : ""}`} onClick={() => setMemoryAnswer(2)}>loop / condición</button>
        </div>
        {memoryAnswer !== null && <div className={`learn-feedback ${memoryCorrect ? "good" : "bad"}`}>{memoryCorrect ? "✓ Lo recuperaste sin volver a leer la explicación." : "Pista: una decide; el otro repite."}</div>}
        <button className="btn" disabled={!memoryCorrect} onClick={next}>Lo tengo →</button>
      </>}

      {step === 4 && <>
        <div className="learn-icon">💥</div>
        <div className="sheet-title">Ahora rompe tu propia regla</div>
        <p className="learn-text">Una buena solución también sabe reconocer entradas que no puede tratar como números.</p>
        <div className="learn-cases">
          {caseItems.map((item, i) => <div className="learn-case" key={item.label}>
            <span className="mono">{item.label}</span>
            <div className="learn-case-actions">
              <button className={caseAnswers[i] === true ? "selected" : ""} onClick={() => setCaseAnswers((a) => ({ ...a, [i]: true }))}>válido</button>
              <button className={caseAnswers[i] === false ? "selected" : ""} onClick={() => setCaseAnswers((a) => ({ ...a, [i]: false }))}>no válido</button>
            </div>
          </div>)}
        </div>
        {casesDone && <div className={`learn-feedback ${casesCorrect ? "good" : "bad"}`}>{casesCorrect ? "✓ Bien. Validar la entrada evita operar con un tipo que el programa no espera." : "Revisa los tipos: un texto no es un número, aunque describa un número."}</div>}
        <button className="btn" disabled={!casesCorrect} onClick={next}>Prepararme para practicar →</button>
      </>}

      {step === 5 && <>
        <div className="learn-icon">🎯</div>
        <div className="sheet-title">Ya tienes las piezas</div>
        <p className="learn-text">Antes de practicar, quédate con estas tres ideas. La práctica será la primera vez que tendrás que construirlas tú.</p>
        <div className="learn-summary">
          <div><span>01</span><b>Condición</b><p>decide según un dato</p></div>
          <div><span>02</span><b>Loop</b><p>repite una acción</p></div>
          <div><span>03</span><b>Validación</b><p>comprueba la entrada antes de operar</p></div>
        </div>
        <div className="learn-challenge">⚡ La explicación termina aquí. Ahora Helikon te pedirá que lo hagas.</div>
        <button className="btn" onClick={onComplete}>Empezar práctica →</button>
      </>}

      <div className="learn-nav">
        <button className="learn-back" disabled={step === 0} onClick={previous}>← Atrás</button>
        <button className="learn-hint" onClick={() => setHint((h) => !h)}>💡 Pista</button>
      </div>
      {hint && step > 0 && <div className="learn-global-hint">Piensa en qué dato cambia la decisión. Después pregunta: ¿necesito hacerlo una vez o para cada elemento?</div>}
    </div>
  );
}
