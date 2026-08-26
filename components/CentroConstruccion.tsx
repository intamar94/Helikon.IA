"use client";

import React from "react";

type Estado = "pendiente" | "en_construccion" | "validado" | "requiere_correccion";

type Etapa = { nombre: string; estado: Estado };
type Reto = { numero: number; nombre: string; etapas: Etapa[] };

const RETOS: Reto[] = [
  { numero: 1, nombre: "Lógica", etapas: etapas("validado") },
  { numero: 2, nombre: "Variables y control de flujo", etapas: etapas("validado") },
  { numero: 3, nombre: "Funciones y estructuras de datos", etapas: etapas("validado") },
  { numero: 4, nombre: "Programación orientada a objetos", etapas: etapas("validado") },
  { numero: 5, nombre: "Testing", etapas: etapas("en_construccion", 5) },
  { numero: 6, nombre: "Manejo de errores", etapas: etapas("pendiente") },
  { numero: 7, nombre: "Algoritmos", etapas: etapas("pendiente") },
];

const NOMBRES = ["Diseño", "Contenido", "Aprender", "Practicar", "Evaluar", "Adaptación", "Integración", "Build", "Validación"];

function etapas(estado: Estado, hasta = estado === "validado" ? 9 : 0): Etapa[] {
  return NOMBRES.map((nombre, i) => ({ nombre, estado: estado === "validado" ? "validado" : i < hasta ? "validado" : i === hasta ? "en_construccion" : "pendiente" }));
}

function pct(reto: Reto) { return Math.round((reto.etapas.filter((e) => e.estado === "validado").length / reto.etapas.length) * 100); }
function icon(estado: Estado) { return estado === "validado" ? "✓" : estado === "en_construccion" ? "◐" : estado === "requiere_correccion" ? "⚠" : "○"; }

export default function CentroConstruccion({ onClose }: { onClose: () => void }) {
  const total = RETOS.reduce((a, r) => a + r.etapas.length, 0);
  const done = RETOS.reduce((a, r) => a + r.etapas.filter((e) => e.estado === "validado").length, 0);
  const global = Math.round((done / total) * 100);

  return <div className="build-overlay">
    <div className="build-sheet">
      <button className="close" onClick={onClose}>✕</button>
      <div className="sheet-eyebrow">CENTRO DE CONSTRUCCIÓN</div>
      <div className="sheet-title">Estado real de Helikon</div>
      <p className="build-intro">Aquí el progreso representa etapas verificadas, no código simplemente escrito.</p>
      <div className="build-global"><div className="build-global-head"><b>Motor de aprendizaje</b><span>{global}%</span></div><div className="build-bar"><div style={{ width: `${global}%` }} /></div></div>
      <div className="build-legend"><span>✓ Validado</span><span>◐ En construcción</span><span>○ Pendiente</span><span>⚠ Corrección</span></div>
      <div className="build-list">{RETOS.map((reto) => <details key={reto.numero} open={reto.numero === 5} className="build-reto"><summary><span className="build-reto-id">{String(reto.numero).padStart(2, "0")}</span><b>{reto.nombre}</b><span className="build-pct">{pct(reto)}%</span></summary><div className="build-stages">{reto.etapas.map((etapa) => <div className="build-stage" key={etapa.nombre}><span className={`build-state ${etapa.estado}`}>{icon(etapa.estado)}</span><span>{etapa.nombre}</span><span className="build-stage-state">{etapa.estado.replace("_", " ")}</span></div>)}</div></details>)}</div>
      <div className="build-current"><span>ACTUALMENTE</span><b>Reto 05 · Testing</b><small>Construyendo experiencia y evaluación adaptativa.</small></div>
    </div>
  </div>;
}
