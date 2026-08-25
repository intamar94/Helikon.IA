"use client";

import { useState } from "react";

type Props = {
  numero: number;
  rama: string;
  nombre: string;
  objetivo: string | null;
  onStart: () => void;
};

export default function IntroduccionReto({ numero, rama, nombre, objetivo, onStart }: Props) {
  const [ready, setReady] = useState(false);

  return (
    <section style={{ color: "var(--text)" }}>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: ".1em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 8 }}>
        FASE 0 · ENTRAR EN EL MUNDO
      </div>

      <div style={{
        position: "relative", overflow: "hidden", minHeight: 210, borderRadius: 14,
        border: "1px solid rgba(110,140,255,.28)",
        background: "radial-gradient(circle at 50% 25%, rgba(110,140,255,.18), transparent 42%), linear-gradient(160deg,#0d1422,#090b10 72%)",
        marginBottom: 16,
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: .35, backgroundImage: "linear-gradient(rgba(110,140,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(110,140,255,.08) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
        <div style={{ position: "absolute", top: 18, left: 18, fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "var(--muted-2)" }}>MISSION // {String(numero).padStart(2, "0")}</div>
        <div style={{ position: "absolute", top: 18, right: 18, fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "var(--muted-2)" }}>{rama}</div>

        <div style={{ position: "absolute", left: "50%", top: 54, transform: "translateX(-50%)", width: 92, height: 92, borderRadius: 20, background: "linear-gradient(145deg,#171f31,#0d111a)", border: "1px solid rgba(110,140,255,.4)", boxShadow: "0 0 40px rgba(110,140,255,.12), inset 0 0 25px rgba(110,140,255,.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 42 }}>🤖</div>
          <div style={{ position: "absolute", top: 14, right: 14, width: 7, height: 7, borderRadius: "50%", background: "var(--ok)", boxShadow: "0 0 12px var(--ok)" }} />
        </div>

        <div style={{ position: "absolute", left: "16%", bottom: 28, width: 64, height: 44, borderRadius: 9, background: "#121925", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 23 }}>🌡️</div>
        <div style={{ position: "absolute", right: "16%", bottom: 28, width: 64, height: 44, borderRadius: 9, background: "#121925", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 23 }}>🌬️</div>
        <div style={{ position: "absolute", left: "29%", bottom: 47, width: "42%", height: 1, background: "linear-gradient(90deg,transparent,var(--accent),transparent)" }} />
      </div>

      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "var(--muted-2)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>TU MISIÓN</div>
      <h2 style={{ fontSize: 23, lineHeight: 1.18, margin: "0 0 9px", fontWeight: 600 }}>{nombre}</h2>
      <p style={{ fontSize: 13.5, lineHeight: 1.58, color: "var(--muted)", margin: "0 0 12px" }}>
        Hoy no vienes a memorizar una definición. Vas a enseñarle a una máquina a tomar una decisión y descubrirás qué necesita para hacerlo correctamente.
      </p>
      <div style={{ background: "#090B10", border: "1px solid var(--line)", borderRadius: 10, padding: "11px 12px", marginBottom: 12 }}>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "var(--muted-2)", marginBottom: 5 }}>OBJETIVO</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>{objetivo ?? "Comprender y demostrar la competencia de este reto."}</div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {["descubrir", "experimentar", "recordar", "aplicar"].map((x) => <span key={x} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9.5, color: "var(--muted)", background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 5, padding: "5px 7px" }}>{x}</span>)}
      </div>
      <button className="btn" onClick={() => { setReady(true); onStart(); }}>
        {ready ? "Entrando…" : "Comenzar misión →"}
      </button>
      <div style={{ textAlign: "center", fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "var(--muted-2)", marginTop: 9 }}>
        Primero descubrirás. Después tendrás que demostrarlo.
      </div>
    </section>
  );
}
