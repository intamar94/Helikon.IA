"use client";

import { useMemo, useState } from "react";

type Props = { onComplete: () => void };

const tarjetas = [
  { titulo: "1 · Qué estás comprobando", texto: "Un test no demuestra que el programa sea perfecto. Comprueba una expectativa concreta: dado un escenario, esperamos un resultado.", ejemplo: "entrada → comportamiento → resultado esperado" },
  { titulo: "2 · El caso normal no basta", texto: "Un buen test también busca límites y fallos: cero, negativos, valores vacíos, tipos inesperados y condiciones extremas.", ejemplo: "edad = -1 → ¿qué debería ocurrir?" },
  { titulo: "3 · Un test debe aislar el problema", texto: "Cuando falla, queremos saber qué comportamiento se rompió. Por eso conviene probar una idea pequeña y observable, no todo el sistema a la vez.", ejemplo: "1 expectativa clara → 1 fallo fácil de localizar" },
];

export default function AprenderTesting({ onComplete }: Props) {
  const [actual, setActual] = useState(0);
  const [respuesta, setRespuesta] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState(false);
  const terminado = actual === tarjetas.length - 1 && confirmado;
  const progreso = useMemo(() => Math.round(((actual + (confirmado ? 1 : 0)) / tarjetas.length) * 100), [actual, confirmado]);

  function avanzar() {
    if (!confirmado) return;
    if (actual < tarjetas.length - 1) { setActual((v) => v + 1); setConfirmado(false); setRespuesta(null); }
    else onComplete();
  }

  return <section style={{ color: "var(--text)" }}>
    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: ".1em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 8 }}>FASE 1 · APRENDER · TESTING BÁSICO</div>
    <div style={{ height: 5, background: "var(--line)", borderRadius: 99, marginBottom: 18, overflow: "hidden" }}><div style={{ width: `${progreso}%`, height: "100%", background: "linear-gradient(90deg,var(--accent),#8a63ff)", transition: "width .25s" }} /></div>
    <div style={{ border: "1px solid rgba(110,140,255,.28)", borderRadius: 14, padding: 18, background: "radial-gradient(circle at 85% 10%,rgba(110,140,255,.14),transparent 35%),var(--panel)" }}>
      <div style={{ fontSize: 11, color: "var(--muted-2)", fontFamily: "'IBM Plex Mono',monospace", marginBottom: 8 }}>{tarjetas[actual].titulo}</div>
      <p style={{ fontSize: 15, lineHeight: 1.65, margin: "0 0 14px" }}>{tarjetas[actual].texto}</p>
      <div style={{ padding: "12px 14px", borderRadius: 9, background: "#090B10", border: "1px solid var(--line)", fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "var(--accent)" }}>{tarjetas[actual].ejemplo}</div>
    </div>
    <div style={{ marginTop: 14, border: "1px solid var(--line)", borderRadius: 12, padding: 14 }}>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "var(--muted-2)", marginBottom: 8 }}>PIENSA ANTES DE CONTINUAR</div>
      <p style={{ margin: "0 0 10px", fontSize: 13, lineHeight: 1.5 }}>{actual === 0 ? "¿Qué hace que una prueba sea útil?" : actual === 1 ? "¿Qué tipo de caso puede revelar un fallo que el caso normal no encuentra?" : "¿Por qué conviene que un test falle de forma fácil de localizar?"}</p>
      {(actual === 0 ? ["Una expectativa concreta", "Probar muchas cosas a la vez"] : actual === 1 ? ["Solo el valor habitual", "Un caso límite"] : ["Porque aísla el comportamiento roto", "Porque evita escribir código"]).map((op) => <button key={op} onClick={() => setRespuesta(op)} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 11px", marginTop: 7, borderRadius: 8, border: `1px solid ${respuesta === op ? "var(--accent)" : "var(--line)"}`, background: respuesta === op ? "rgba(110,140,255,.1)" : "transparent", color: "var(--text)" }}>{op}</button>)}
      {respuesta && <button className="btn" style={{ marginTop: 10 }} onClick={() => setConfirmado(true)}>Confirmar comprensión ✓</button>}
    </div>
    <button className="btn" style={{ marginTop: 14, opacity: confirmado ? 1 : .45 }} disabled={!confirmado} onClick={avanzar}>{terminado ? "Pasar a práctica →" : "Siguiente concepto →"}</button>
    <div style={{ textAlign: "center", fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "var(--muted-2)", marginTop: 9 }}>No avances por velocidad: avanza cuando puedas explicarlo.</div>
  </section>;
}
