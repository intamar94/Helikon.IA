"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUsuarioId } from "@/lib/useUsuarioId";
import AprenderLogica from "@/components/AprenderLogica";
import AprenderVariables from "@/components/AprenderVariables";
import AprenderFunciones from "@/components/AprenderFunciones";
import AprenderPOO from "@/components/AprenderPOO";
import CentroConstruccion from "@/components/CentroConstruccion";
import EvaluacionLogica from "@/components/EvaluacionLogica";
import EvaluacionVariables from "@/components/EvaluacionVariables";
import EvaluacionFunciones from "@/components/EvaluacionFunciones";
import EvaluacionPOO from "@/components/EvaluacionPOO";
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
  const [centroAbierto, setCentroAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [habilidadesFallidas, setHabilidadesFallidas] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!supabase) { setError("Supabase no está configurado."); return; }
    async function cargar() {
      const [nodosResult, aristasResult, evalResult] = await Promise.all([
        supabase!.from("helikon_nodos").select("*").order("numero", { ascending: true }),
        supabase!.from("helikon_aristas").select("origen,destino").eq("tipo", "prerrequisito"),
        supabase!.from("helikon_evaluaciones").select("nodo_id,practica,preguntas"),
      ]);
      if (nodosResult.error || aristasResult.error) { setError((nodosResult.error || aristasResult.error)?.message ?? "Error cargando datos"); return; }
      const prereqsPorNodo = new Map<string, string[]>();
      (aristasResult.data ?? []).forEach((a) => { const lista = prereqsPorNodo.get(a.destino) ?? []; lista.push(a.origen); prereqsPorNodo.set(a.destino, lista); });
      const completos: Nodo[] = (nodosResult.data ?? []).map((n) => ({ ...n, prerequisitos: prereqsPorNodo.get(n.id) ?? [] }));
      const evaluacionesDB: Record<string, EvaluacionNodo> = {};
      (evalResult.data ?? []).forEach((e) => { evaluacionesDB[e.nodo_id] = { nodo_id: e.nodo_id, practica: e.practica ?? [], preguntas: e.preguntas ?? [] }; });
      setNodos(completos); setEvaluaciones(evaluacionesDB);
    }
    cargar();
  }, []);

  useEffect(() => {
    if (!supabase || !usuarioId) return;
    async function cargarProgreso() {
      const { data, error: progresoError } = await supabase!.from("helikon_usuario_progreso").select("nodo_id,estado,nivel_dominio,evidencia").eq("usuario_id", usuarioId);
      if (progresoError) { setError(progresoError.message); return; }
      const nextStates: Record<string, Estado> = {};
      const nextAttempts: Record<string, number> = {};
      const nextDominados = new Set<string>();
      const nextSkills: Record<string, string[]> = {};
      (data ?? []).forEach((r) => {
        nextStates[r.nodo_id] = r.estado as Estado;
        if (r.estado === "dominado") nextDominados.add(r.nodo_id);
        try { const evidence = r.evidencia ? JSON.parse(r.evidencia) : null; if (evidence?.intentos) nextAttempts[r.nodo_id] = evidence.intentos; if (Array.isArray(evidence?.habilidadesFallidas)) nextSkills[r.nodo_id] = evidence.habilidadesFallidas; } catch {}
      });
      setEstados(nextStates); setDominados(nextDominados); setIntentos(nextAttempts); setHabilidadesFallidas(nextSkills);
    }
    cargarProgreso();
  }, [usuarioId]);

  const estadoDe = (nodo: Nodo): Estado => { if (dominados.has(nodo.id)) return "dominado"; if (["en_aprendizaje", "practicando", "evaluando"].includes(estados[nodo.id])) return estados[nodo.id]; return nodo.prerequisitos.every((p) => dominados.has(p)) ? "disponible" : "bloqueado"; };
  const disponibles = useMemo(() => (nodos ?? []).filter((n) => estadoDe(n) !== "bloqueado"), [nodos, dominados, estados]);
  const mision = useMemo(() => { const enCurso = disponibles.find((n) => estadoDe(n) !== "dominado"); return enCurso ?? disponibles[0] ?? null; }, [disponibles, dominados, estados]);
  const nodoSeleccionado = nodos?.find((n) => n.id === seleccionado) ?? null;
  const total = nodos?.length ?? 0; const done = dominados.size;
  function abrirNodo(id: string) { const nodo = nodos?.find((n) => n.id === id); if (!nodo || estadoDe(nodo) === "bloqueado") return; setSeleccionado(id); setFase("aprender"); }
  async function guardarEstado(id: string, estado: Estado, evidencia?: object) { if (!supabase || !usuarioId) return false; const { error: upsertError } = await supabase.from("helikon_usuario_progreso").upsert({ usuario_id: usuarioId, nodo_id: id, estado, nivel_dominio: estado === "dominado" ? "confirmado" : "inicial", evidencia: evidencia ? JSON.stringify(evidencia) : null, fecha: new Date().toISOString() }, { onConflict: "usuario_id,nodo_id" }); if (upsertError) { setError(upsertError.message); return false; } setEstados((prev) => ({ ...prev, [id]: estado })); if (estado === "dominado") setDominados((prev) => new Set(prev).add(id)); return true; }
  async function comenzar() { if (!nodoSeleccionado) return; if (!dominados.has(nodoSeleccionado.id) && (intentos[nodoSeleccionado.id] ?? 0) >= MAX_INTENTOS) { setFase("resultado"); return; } await guardarEstado(nodoSeleccionado.id, "en_aprendizaje", { aprendizajeCompletado: true, fecha: new Date().toISOString() }); setFase("practicando"); }
  async function completarPractica(correctas: number, totalPreguntas: number) { if (!nodoSeleccionado || !usuarioId) return; if (correctas !== totalPreguntas) { await guardarEstado(nodoSeleccionado.id, "en_aprendizaje", { practicaCompletada: false, ultimoResultado: Math.round((correctas / totalPreguntas) * 100) }); setFase("resultado"); return; } await guardarEstado(nodoSeleccionado.id, "evaluando", { practicaCompletada: true, practicaResultado: 100 }); setFase("evaluando"); }
  async function finalizarEvaluacion(correctas: number, totalPreguntas: number) { if (!nodoSeleccionado || !usuarioId || (intentos[nodoSeleccionado.id] ?? 0) >= MAX_INTENTOS) return; const numeroIntento = (intentos[nodoSeleccionado.id] ?? 0) + 1; const resultado = Math.round((correctas / totalPreguntas) * 100); let skills: string[] = habilidadesFallidas[nodoSeleccionado.id] ?? []; try { const raw = localStorage.getItem("helikon:last-failed-skills"); if (raw && ["L","V","F","POO"].includes(nodoSeleccionado.id)) skills = JSON.parse(raw); } catch {} setIntentos((prev) => ({ ...prev, [nodoSeleccionado.id]: numeroIntento })); setHabilidadesFallidas((prev) => ({ ...prev, [nodoSeleccionado.id]: skills })); await supabase!.from("helikon_intentos").insert({ usuario_id: usuarioId, nodo_id: nodoSeleccionado.id, tipo: "evaluacion", numero: numeroIntento, resultado, completado: correctas === totalPreguntas, respuestas: { correctas, total: totalPreguntas, tipo: "demostracion", habilidadesFallidas: skills } }); if (correctas === totalPreguntas) { await guardarEstado(nodoSeleccionado.id, "dominado", { intentos: numeroIntento, resultado: 100, demostrado: ["aprendizaje", "practica", "evaluacion", "transferencia"], evidencia: "demostracion", habilidadesFallidas: [] }); setFase("resultado"); return; } await guardarEstado(nodoSeleccionado.id, "en_aprendizaje", { intentos: numeroIntento, ultimoResultado: resultado, habilidadesFallidas: skills, refuerzoRequerido: true, oportunidadesRestantes: Math.max(0, MAX_INTENTOS - numeroIntento) }); setFase("resultado"); }
  if (error) return <div className="app"><div className="estadoMsg error">{error}</div></div>;
  if (!nodos) return <div className="app"><div className="estadoMsg">Cargando ruta de aprendizaje…</div></div>;
  return <div className="app"><header className="topbar"><div className="brand"><b>Helikon.IA</b><span> · Ingeniería de Software</span></div><div className="stat">{done}/{total}</div></header><div className="progressbar" aria-label="progreso global"><div className="progressfill" style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div><button className="build-link" onClick={() => setCentroAbierto(true)}>⚙ Centro de construcción</button>{mision ? <section className="mission"><div className="mission-k">TU SIGUIENTE MISIÓN</div><div className="mission-num">RETO {String(mision.numero).padStart(2, "0")} · {mision.rama}</div><h1>{mision.nombre}</h1><p>{mision.objetivo}</p><div className="mission-meta"><span>📚 aprender</span><span>🛠 practicar</span><span>🧪 evaluar</span></div><button className="btn" onClick={() => abrirNodo(mision.id)}>{estadoDe(mision) === "dominado" ? "Revisar reto" : "Continuar →"}</button></section> : <section className="mission empty"><div className="mission-k">RUTA COMPLETA</div><h1>Has demostrado todas las competencias disponibles.</h1></section>}<section className="section-block"><div className="section-head"><div><div className="section-k">MI RUTA</div><div className="section-title">Conocimiento desbloqueado</div></div><button className="map-link" onClick={() => setMapaAbierto(true)}>🗺 Ver mapa completo</button></div><div className="ruta-list">{disponibles.filter((n) => n.id !== mision?.id).map((n) => { const est = estadoDe(n); return <button className={`ruta-item ${est}`} key={n.id} onClick={() => abrirNodo(n.id)}><span className="ruta-num">{String(n.numero).padStart(2, "0")}</span><span className="ruta-name">{n.nombre}</span><span className="ruta-state">{est === "dominado" ? "✓" : est === "disponible" ? "→" : "●"}</span></button>; })}</div>{!disponibles.filter((n) => n.id !== mision?.id).length && <div className="empty-list">Aún no hay más conocimientos desbloqueados.</div>}</section><div className="footnote mono">El desbloqueo depende de evidencia, no de un botón.</div>{mapaAbierto && <MapaCompleto nodos={nodos} estadoDe={estadoDe} onClose={() => setMapaAbierto(false)} onOpen={abrirNodo} />}{centroAbierto && <CentroConstruccion onClose={() => setCentroAbierto(false)} />}<div className={`overlay ${nodoSeleccionado ? "open" : ""}`}>{nodoSeleccionado && <div className="sheet"><button className="close" onClick={() => setSeleccionado(null)}>✕</button><Reto nodo={nodoSeleccionado} nodos={nodos} fase={fase} evaluacion={evaluaciones[nodoSeleccionado.id] ?? crearEvaluacion(nodoSeleccionado, nodos)} intento={intentos[nodoSeleccionado.id] ?? 0} onComenzar={comenzar} onPractica={completarPractica} onEvaluar={finalizarEvaluacion} onReforzar={() => setFase("aprender")} dominado={dominados.has(nodoSeleccionado.id)} habilidadesFallidas={habilidadesFallidas[nodoSeleccionado.id] ?? []} /></div>}</div></div>;
}
function crearEvaluacion(nodo: Nodo, nodos: Nodo[]): EvaluacionNodo { const otros = nodos.filter((n) => n.id !== nodo.id); const distractores = otros.slice(0, 2); const opciones = (correcta: string | null, campo: keyof Nodo) => [...new Set([correcta, ...distractores.map((n) => n[campo] as string | null)].filter(Boolean) as string[])].slice(0, 3); const make = (pregunta: string, correcta: string | null, opts: string[]): Pregunta => ({ pregunta, opciones: opts, correcta: Math.max(0, opts.indexOf(correcta ?? "")) }); return { nodo_id: nodo.id, practica: [make("¿Cuál es la capacidad que este reto busca desarrollar?", nodo.objetivo, opciones(nodo.objetivo, "objetivo")), make("¿Qué vas a construir o practicar primero?", nodo.construir, opciones(nodo.construir, "construir"))], preguntas: [make("¿Qué objetivo debes poder demostrar al terminar?", nodo.objetivo, opciones(nodo.objetivo, "objetivo")), make("¿Qué situación representa el fallo que debes saber detectar?", nodo.romper, opciones(nodo.romper, "romper")), make("¿Qué idea explica la resolución del reto?", nodo.resolver, opciones(nodo.resolver, "resolver"))] };
}
function Reto({ nodo, nodos, fase, evaluacion, intento, onComenzar, onPractica, onEvaluar, onReforzar, dominado, habilidadesFallidas }: { nodo: Nodo; nodos: Nodo[]; fase: Fase; evaluacion: EvaluacionNodo; intento: number; onComenzar: () => void; onPractica: (correctas: number, total: number) => void; onEvaluar: (correctas: number, total: number) => void; onReforzar: () => void; dominado: boolean; habilidadesFallidas: string[] }) {
  const prereqNames = nodo.prerequisitos.map((p) => nodos.find((x) => x.id === p)?.nombre).filter(Boolean).join(", ") || "ninguno";
  if (fase === "aprender" && nodo.id === "L") return <AprenderLogica onComplete={onComenzar} />;
  if (fase === "aprender" && nodo.id === "V") return <AprenderVariables onComplete={onComenzar} />;
  if (fase === "aprender" && nodo.id === "F") return <AprenderFunciones onComplete={onComenzar} />;
  if (fase === "aprender" && nodo.id === "POO") return <AprenderPOO onComplete={onComenzar} />;
  if (fase === "practicando") return <Cuestionario titulo="PRÁCTICA GUIADA" preguntas={evaluacion.practica} boton="Pasar a evaluación →" onFinish={onPractica} />;
  if (fase === "evaluando") return nodo.id === "L" ? <EvaluacionLogica onFinish={onEvaluar} /> : nodo.id === "V" ? <EvaluacionVariables onFinish={onEvaluar} /> : nodo.id === "F" ? <EvaluacionFunciones onFinish={onEvaluar} /> : nodo.id === "POO" ? <EvaluacionPOO onFinish={onEvaluar} /> : <Cuestionario titulo="EVALUACIÓN · DEMOSTRACIÓN" preguntas={evaluacion.preguntas} boton="Demostrar competencia →" onFinish={onEvaluar} />;
  if (fase === "resultado") { const exito = dominado; return <div><div className={`sheet-eyebrow ${exito ? "ok" : "danger"}`}>{exito ? "COMPETENCIA DEMOSTRADA" : "REFUERZO NECESARIO"}</div><div className={exito ? "success-mark" : "failure-mark"}>{exito ? "✓" : "!"}</div><div className="sheet-title">{exito ? "Ya puedes usar este conocimiento." : "Todavía hay una parte que debemos reforzar."}</div>{!exito && habilidadesFallidas.length > 0 && <div className="learn-box"><div className="k">HABILIDADES A REFORZAR</div><div className="v">{habilidadesFallidas.join(" · ")}</div></div>}<p className="result-text">{exito ? "La competencia queda registrada y el siguiente conocimiento se desbloquea automáticamente." : `Intento ${intento} de ${MAX_INTENTOS}. Volveremos al aprendizaje y cambiaremos la situación para trabajar la debilidad detectada.`}</p><button className="btn" onClick={exito ? () => setTimeout(() => onReforzar(), 0) : onReforzar}>{exito ? "Continuar →" : "Ir al refuerzo →"}</button></div>; }
  return <div><div className="sheet-eyebrow">RETO {String(nodo.numero).padStart(2, "0")}</div><div className="sheet-title">{nodo.nombre}</div><div className="prereq-list">Prerrequisitos: {prereqNames}</div><div className="phase-track"><span className="active">Aprender</span><span>Practicar</span><span>Evaluar</span><span>Demostrar</span></div><div className="campo"><div className="k">Objetivo</div><div className="v">{nodo.objetivo}</div></div><div className="learn-box"><div className="k">Construir</div><div className="v">{nodo.construir}</div></div><div className="learn-box"><div className="k">Cuando se rompe</div><div className="v">{nodo.romper}</div></div><div className="learn-box"><div className="k">Resolver</div><div className="v">{nodo.resolver}</div></div><button className="btn" onClick={onComenzar}>Comenzar aprendizaje →</button></div>;
}
function Cuestionario({ titulo, preguntas, boton, onFinish }: { titulo: string; preguntas: Pregunta[]; boton: string; onFinish: (correctas: number, total: number) => void }) { const [seleccion, setSeleccion] = useState<Record<number, number>>({}); const complete = preguntas.every((_, i) => seleccion[i] !== undefined); const enviar = () => onFinish(preguntas.reduce((a, p, i) => a + (seleccion[i] === p.correcta ? 1 : 0), 0), preguntas.length); return <div><div className="sheet-eyebrow">{titulo}</div><div className="sheet-title">Comprueba tu comprensión</div><div className="question-list">{preguntas.map((p, i) => <div className="question" key={i}><div className="question-n">{String(i + 1).padStart(2, "0")}</div><div className="question-text">{p.pregunta}</div><div className="options">{p.opciones.map((o, j) => <button className={`option ${seleccion[i] === j ? "selected" : ""}`} key={j} onClick={() => setSeleccion((s) => ({ ...s, [i]: j }))}>{o}</button>)}</div></div>)}</div><button className="btn" disabled={!complete} onClick={enviar}>{boton}</button></div>;
}
function MapaCompleto({ nodos, estadoDe, onClose, onOpen }: { nodos: Nodo[]; estadoDe: (n: Nodo) => Estado; onClose: () => void; onOpen: (id: string) => void }) { const ramas = [...new Set(nodos.map((n) => n.rama))]; return <div className="map-overlay"><div className="map-sheet"><button className="close" onClick={onClose}>✕</button><div className="sheet-eyebrow">MAPA COMPLETO</div><div className="sheet-title">Toda la ruta</div><p className="map-help">Aquí puedes explorar también conocimientos que todavía están bloqueados. El progreso normal solo muestra lo que puedes trabajar ahora.</p>{ramas.map((rama) => <div className="map-rama" key={rama}><div className="rama-title">{rama}</div><div className="map-grid">{nodos.filter((n) => n.rama === rama).map((n) => { const est = estadoDe(n); return <button className={`map-node ${est}`} key={n.id} disabled={est === "bloqueado"} onClick={() => onOpen(n.id)}><span>RETO {String(n.numero).padStart(2, "0")}</span><b>{n.nombre}</b><small>{est === "dominado" ? "✓ dominado" : est === "disponible" ? "disponible" : "🔒 bloqueado"}</small></button>; })}</div></div>)}</div></div>; }
