"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUsuarioId } from "@/lib/useUsuarioId";
import AprenderLogica from "@/components/AprenderLogica";
import type { Estado, EvaluacionNodo, Nodo, Pregunta } from "@/types/nodo";

const MAX_INTENTOS = 3;
type Fase = "aprender" | "practicando" | "evaluando" | "resultado";

export default function Home() {
  const usuarioId = useUsuarioId();
  const [nodos, setNodos] = useState<Nodo[] | null>(null);
  const [dominados, setDominados] = useState<Set<string>>(new Set());
  const [estados, setEstados] = useState<Record<string, Estado>>({});
  const [intentos, setIntentos] = useState<Record<string, number>>({});
  const [evaluaciones, setEvaluaciones] = useState<Record<string, EvaluacionNodo>>({});
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [fase, setFase] = useState<Fase>("aprender");
  const [mapaAbierto, setMapaAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) { setError("Supabase no está configurado."); return; }
    async function cargar() {
      const [nodosResult, aristasResult, evalResult] = await Promise.all([
        supabase!.from("helikon_nodos").select("*").order("numero", { ascending: true }),
        supabase!.from("helikon_aristas").select("origen,destino").eq("tipo", "prerrequisito"),
        supabase!.from("helikon_evaluaciones").select("nodo_id,practica,preguntas"),
      ]);
      if (nodosResult.error || aristasResult.error) {
        setError((nodosResult.error || aristasResult.error)?.message ?? "Error cargando datos"); return;
      }
      const prereqsPorNodo = new Map<string, string[]>();
      (aristasResult.data ?? []).forEach((a) => {
        const lista = prereqsPorNodo.get(a.destino) ?? [];
        lista.push(a.origen); prereqsPorNodo.set(a.destino, lista);
      });
      const completos: Nodo[] = (nodosResult.data ?? []).map((n) => ({ ...n, prerequisitos: prereqsPorNodo.get(n.id) ?? [] }));
      const evaluacionesDB: Record<string, EvaluacionNodo> = {};
      (evalResult.data ?? []).forEach((e) => {
        evaluacionesDB[e.nodo_id] = { nodo_id: e.nodo_id, practica: e.practica ?? [], preguntas: e.preguntas ?? [] };
      });
      setNodos(completos); setEvaluaciones(evaluacionesDB);
    }
    cargar();
  }, []);

  useEffect(() => {
    if (!supabase || !usuarioId) return;
    async function cargarProgreso() {
      const { data, error: progresoError } = await supabase!
        .from("helikon_usuario_progreso")
        .select("nodo_id,estado,nivel_dominio,evidencia")
        .eq("usuario_id", usuarioId);
      if (progresoError) { setError(progresoError.message); return; }
      const nextStates: Record<string, Estado> = {};
      const nextAttempts: Record<string, number> = {};
      const nextDominados = new Set<string>();
      (data ?? []).forEach((r) => {
        nextStates[r.nodo_id] = r.estado as Estado;
        if (r.estado === "dominado") nextDominados.add(r.nodo_id);
        try {
          const evidence = r.evidencia ? JSON.parse(r.evidencia) : null;
          if (evidence?.intentos) nextAttempts[r.nodo_id] = evidence.intentos;
        } catch {}
      });
      setEstados(nextStates); setDominados(nextDominados); setIntentos(nextAttempts);
    }
    cargarProgreso();
  }, [usuarioId]);

  const estadoDe = (nodo: Nodo): Estado => {
    if (dominados.has(nodo.id)) return "dominado";
    if (["en_aprendizaje", "practicando", "evaluando"].includes(estados[nodo.id])) return estados[nodo.id];
    return nodo.prerequisitos.every((p) => dominados.has(p)) ? "disponible" : "bloqueado";
  };

  const disponibles = useMemo(() => (nodos ?? []).filter((n) => estadoDe(n) !== "bloqueado"), [nodos, dominados, estados]);
  const mision = useMemo(() => {
    const enCurso = disponibles.find((n) => estadoDe(n) !== "dominado");
    return enCurso ?? disponibles[0] ?? null;
  }, [disponibles, dominados, estados]);
  const nodoSeleccionado = nodos?.find((n) => n.id === seleccionado) ?? null;
  const total = nodos?.length ?? 0;
  const done = dominados.size;

  function abrirNodo(id: string) {
    const nodo = nodos?.find((n) => n.id === id);
    if (!nodo || estadoDe(nodo) === "bloqueado") return;
    setSeleccionado(id); setFase("aprender");
  }

  async function guardarEstado(id: string, estado: Estado, evidencia?: object) {
    if (!supabase || !usuarioId) return false;
    const { error: upsertError } = await supabase.from("helikon_usuario_progreso").upsert({
      usuario_id: usuarioId, nodo_id: id, estado,
      nivel_dominio: estado === "dominado" ? "confirmado" : "inicial",
      evidencia: evidencia ? JSON.stringify(evidencia) : null,
      fecha: new Date().toISOString(),
    }, { onConflict: "usuario_id,nodo_id" });
    if (upsertError) { setError(upsertError.message); return false; }
    setEstados((prev) => ({ ...prev, [id]: estado }));
    if (estado === "dominado") setDominados((prev) => new Set(prev).add(id));
    return true;
  }

  async function comenzar() {
    if (!nodoSeleccionado) return;
    await guardarEstado(nodoSeleccionado.id, "en_aprendizaje", { aprendizajeCompletado: true, fecha: new Date().toISOString() });
    setFase("practicando");
  }

  async function completarPractica(correctas: number, totalPreguntas: number) {
    if (!nodoSeleccionado || !usuarioId) return;
    if (correctas !== totalPreguntas) {
      await guardarEstado(nodoSeleccionado.id, "en_aprendizaje"); setFase("resultado"); return;
    }
    await guardarEstado(nodoSeleccionado.id, "evaluando"); setFase("evaluando");
  }

  async function finalizarEvaluacion(correctas: number, totalPreguntas: number) {
    if (!nodoSeleccionado || !usuarioId) return;
    const numeroIntento = (intentos[nodoSeleccionado.id] ?? 0) + 1;
    setIntentos((prev) => ({ ...prev, [nodoSeleccionado.id]: numeroIntento }));
    await supabase!.from("helikon_intentos").insert({
      usuario_id: usuarioId, nodo_id: nodoSeleccionado.id, tipo: "evaluacion", numero: numeroIntento,
      resultado: Math.round((correctas / totalPreguntas) * 100), completado: correctas === totalPreguntas,
      respuestas: { correctas, total: totalPreguntas },
    });
    if (correctas === totalPreguntas) {
      await guardarEstado(nodoSeleccionado.id, "dominado", { intentos: numeroIntento, resultado: 100, demostrado: ["aprendizaje", "practica", "evaluacion"] });
      setFase("resultado"); return;
    }
    await guardarEstado(nodoSeleccionado.id, "en_aprendizaje", { intentos: numeroIntento, ultimoResultado: Math.round((correctas / totalPreguntas) * 100) });
    setFase("resultado");
  }

  if (error) return <div className="app"><div className="estadoMsg error">{error}</div></div>;
  if (!nodos) return <div className="app"><div className="estadoMsg">Cargando ruta de aprendizaje…</div></div>;

  return <div className="app">
    <header className="topbar"><div className="brand"><b>Helikon.IA</b><span> · Ingeniería de Software</span></div><div className="stat">{done}/{total}</div></header>
    <div className="progressbar" aria-label="progreso global"><div className="progressfill" style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
    {mision ? <section className="mission">
      <div className="mission-k">TU SIGUIENTE MISIÓN</div>
      <div className="mission-num">RETO {String(mision.numero).padStart(2, "0")} · {mision.rama}</div>
      <h1>{mision.nombre}</h1><p>{mision.objetivo}</p>
      <div className="mission-meta"><span>📚 aprender</span><span>🛠 practicar</span><span>🧪 evaluar</span></div>
      <button className="btn" onClick={() => abrirNodo(mision.id)}>{estadoDe(mision) === "dominado" ? "Revisar reto" : "Continuar →"}</button>
    </section> : <section className="mission empty"><div className="mission-k">RUTA COMPLETA</div><h1>Has demostrado todas las competencias disponibles.</h1></section>}
    <section className="section-block">
      <div className="section-head"><div><div className="section-k">MI RUTA</div><div className="section-title">Conocimiento desbloqueado</div></div><button className="map-link" onClick={() => setMapaAbierto(true)}>🗺 Ver mapa completo</button></div>
      <div className="ruta-list">{disponibles.filter((n) => n.id !== mision?.id).map((n) => { const est = estadoDe(n); return <button className={`ruta-item ${est}`} key={n.id} onClick={() => abrirNodo(n.id)}><span className="ruta-num">{String(n.numero).padStart(2, "0")}</span><span className="ruta-name">{n.nombre}</span><span className="ruta-state">{est === "dominado" ? "✓" : est === "disponible" ? "→" : "●"}</span></button>; })}</div>
      {!disponibles.filter((n) => n.id !== mision?.id).length && <div className="empty-list">Aún no hay más conocimientos desbloqueados.</div>}
    </section>
    <div className="footnote mono">El desbloqueo depende de evidencia, no de un botón.</div>
    {mapaAbierto && <MapaCompleto nodos={nodos} estadoDe={estadoDe} onClose={() => setMapaAbierto(false)} onOpen={abrirNodo} />}
    <div className={`overlay ${nodoSeleccionado ? "open" : ""}`}>
      {nodoSeleccionado && <div className="sheet"><button className="close" onClick={() => setSeleccionado(null)}>✕</button>
        <Reto nodo={nodoSeleccionado} nodos={nodos} fase={fase} evaluacion={evaluaciones[nodoSeleccionado.id] ?? crearEvaluacion(nodoSeleccionado, nodos)} intento={intentos[nodoSeleccionado.id] ?? 0} onComenzar={comenzar} onPractica={completarPractica} onEvaluar={finalizarEvaluacion} onReforzar={() => setFase("aprender")} dominado={dominados.has(nodoSeleccionado.id)} />
      </div>}
    </div>
  </div>;
}

function crearEvaluacion(nodo: Nodo, nodos: Nodo[]): EvaluacionNodo {
  const otros = nodos.filter((n) => n.id !== nodo.id); const distractores = otros.slice(0, 2);
  const opciones = (correcta: string | null, campo: keyof Nodo) => [...new Set([correcta, ...distractores.map((n) => n[campo] as string | null)].filter(Boolean) as string[])].slice(0, 3);
  const make = (pregunta: string, correcta: string | null, opts: string[]): Pregunta => ({ pregunta, opciones: opts, correcta: Math.max(0, opts.indexOf(correcta ?? "")) });
  return {
    nodo_id: nodo.id,
    practica: [make("¿Cuál es la capacidad que este reto busca desarrollar?", nodo.objetivo, opciones(nodo.objetivo, "objetivo")), make("¿Qué vas a construir o practicar primero?", nodo.construir, opciones(nodo.construir, "construir"))],
    preguntas: [make("¿Qué objetivo debes poder demostrar al terminar?", nodo.objetivo, opciones(nodo.objetivo, "objetivo")), make("¿Qué situación representa el fallo que debes saber detectar?", nodo.romper, opciones(nodo.romper, "romper")), make("¿Qué idea explica la resolución del reto?", nodo.resolver, opciones(nodo.resolver, "resolver"))],
  };
}

function Reto({ nodo, nodos, fase, evaluacion, intento, onComenzar, onPractica, onEvaluar, onReforzar, dominado }: { nodo: Nodo; nodos: Nodo[]; fase: Fase; evaluacion: EvaluacionNodo; intento: number; onComenzar: () => void; onPractica: (correctas: number, total: number) => void; onEvaluar: (correctas: number, total: number) => void; onReforzar: () => void; dominado: boolean }) {
  const prereqNames = nodo.prerequisitos.map((p) => nodos.find((x) => x.id === p)?.nombre).filter(Boolean).join(", ") || "ninguno";

  if (fase === "aprender" && nodo.id === "L") return <AprenderLogica onComplete={onComenzar} />;
  if (fase === "practicando") return <Cuestionario titulo="PRÁCTICA GUIADA" preguntas={evaluacion.practica} boton="Pasar a evaluación →" onFinish={onPractica} />;
  if (fase === "evaluando") return <Cuestionario titulo={`EVALUACIÓN · INTENTO ${Math.min(intento + 1, MAX_INTENTOS)}/${MAX_INTENTOS}`} preguntas={evaluacion.preguntas} boton="Evaluar resultado" onFinish={onEvaluar} />;
  if (fase === "resultado") {
    if (dominado) return <div><div className="success-mark">✓</div><div className="sheet-eyebrow ok">COMPETENCIA CONFIRMADA</div><div className="sheet-title">{nodo.nombre}</div><p className="result-text">Has demostrado la competencia mediante aprendizaje, práctica y evaluación. El siguiente nodo ya puede desbloquearse.</p><button className="btn" onClick={onReforzar}>Revisar lo aprendido</button></div>;
    return <div><div className="failure-mark">!</div><div className="sheet-eyebrow danger">NECESITA REFUERZO</div><div className="sheet-title">Todavía no hay dominio suficiente</div><p className="result-text">Helikon te devuelve al contenido para reforzar el concepto antes de permitir otro intento.</p><button className="btn" onClick={onReforzar}>Volver a aprender</button></div>;
  }

  return <>
    <div className="sheet-eyebrow">Reto {String(nodo.numero).padStart(2, "0")} · {nodo.rama}</div>
    <div className="sheet-title">{nodo.nombre}</div>
    <div className="prereq-list">Prerrequisitos: {prereqNames}</div>
    <div className="phase-track"><span className="active">1 Aprender</span><span>2 Practicar</span><span>3 Evaluar</span></div>
    <div className="campo"><div className="k">🎯 Objetivo</div><div className="v">{nodo.objetivo || "—"}</div></div>
    <div className="learn-box"><div className="k">QUÉ VAS A HACER</div><div className="v">{nodo.construir || "Aplicar el concepto en una situación práctica."}</div></div>
    <div className="campo"><div className="k">💥 QUÉ PUEDE FALLAR</div><div className="v">{nodo.romper || "Un caso límite pondrá a prueba tu comprensión."}</div></div>
    <div className="campo"><div className="k">🔎 QUÉ DEBES ENTENDER</div><div className="v">{nodo.resolver || "Explicar por qué la solución funciona."}</div></div>
    <div className="evidence-note">Para desbloquear el siguiente reto tendrás que completar la práctica y aprobar la evaluación. No existe un botón para marcarlo manualmente.</div>
    <button className="btn" onClick={onComenzar}>{dominado ? "Rehacer práctica" : "Empezar práctica →"}</button>
  </>;
}

function Cuestionario({ titulo, preguntas, boton, onFinish }: { titulo: string; preguntas: Pregunta[]; boton: string; onFinish: (correctas: number, total: number) => void }) {
  const [respuestas, setRespuestas] = useState<Record<number, number>>({});
  const completo = preguntas.length > 0 && preguntas.every((_, i) => respuestas[i] !== undefined);
  function finalizar() { const correctas = preguntas.reduce((sum, p, i) => sum + (respuestas[i] === p.correcta ? 1 : 0), 0); onFinish(correctas, preguntas.length); }
  return <><div className="sheet-eyebrow">{titulo}</div><div className="sheet-title">Demuestra lo que entiendes</div><div className="question-list">{preguntas.map((p, i) => <div className="question" key={i}><div className="question-n">0{i + 1}</div><div className="question-text">{p.pregunta}</div><div className="options">{p.opciones.map((op, j) => <button key={j} className={`option ${respuestas[i] === j ? "selected" : ""}`} onClick={() => setRespuestas((r) => ({ ...r, [i]: j }))}>{op}</button>)}</div></div>)}</div><button className="btn" disabled={!completo} onClick={finalizar}>{boton}</button></>;
}

function MapaCompleto({ nodos, estadoDe, onClose, onOpen }: { nodos: Nodo[]; estadoDe: (n: Nodo) => Estado; onClose: () => void; onOpen: (id: string) => void }) {
  const ramas = useMemo(() => { const grupos: Record<string, Nodo[]> = {}; nodos.forEach((n) => (grupos[n.rama] ??= []).push(n)); return grupos; }, [nodos]);
  return <div className="map-overlay"><div className="map-sheet"><div className="map-head"><div><div className="section-k">EXPLORACIÓN</div><div className="sheet-title">Mapa completo</div></div><button className="close" onClick={onClose}>✕</button></div><p className="map-help">Aquí puedes explorar lo bloqueado. El mapa no permite saltar la ruta: solo muestra cómo se conectan las competencias.</p>{Object.entries(ramas).map(([rama, items]) => <div className="map-rama" key={rama}><div className="rama-title">{rama}</div><div className="map-grid">{items.map((n) => { const e = estadoDe(n); return <button key={n.id} className={`map-node ${e}`} onClick={() => e !== "bloqueado" && onOpen(n.id)}><span>{String(n.numero).padStart(2, "0")}</span><b>{n.nombre}</b><small>{e === "dominado" ? "✓ dominado" : e === "disponible" ? "desbloqueado" : "bloqueado"}</small></button>; })}</div></div>)}</div></div>;
}
