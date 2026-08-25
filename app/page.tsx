"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { useUsuarioId } from "@/lib/useUsuarioId";
import type { Estado, Nodo } from "@/types/nodo";

export default function Home() {
  const usuarioId = useUsuarioId();
  const [nodos, setNodos] = useState<Nodo[] | null>(null);
  const [dominados, setDominados] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setError(
        "Supabase no está configurado. Definí NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
      return;
    }

    async function cargar() {
      const [{ data: nodosData, error: nodosError }, { data: aristasData, error: aristasError }] =
        await Promise.all([
          supabase!.from("nodos").select("*").order("numero", { ascending: true }),
          supabase!.from("aristas").select("origen,destino").eq("tipo", "prerrequisito"),
        ]);

      if (nodosError || aristasError) {
        setError((nodosError || aristasError)?.message ?? "Error cargando datos");
        return;
      }

      const prereqsPorNodo = new Map<string, string[]>();
      (aristasData ?? []).forEach((a) => {
        const lista = prereqsPorNodo.get(a.destino) ?? [];
        lista.push(a.origen);
        prereqsPorNodo.set(a.destino, lista);
      });

      const nodosCompletos: Nodo[] = (nodosData ?? []).map((n) => ({
        ...n,
        prerequisitos: prereqsPorNodo.get(n.id) ?? [],
      }));

      setNodos(nodosCompletos);
    }

    cargar();
  }, []);

  useEffect(() => {
    if (!supabase || !usuarioId) return;

    async function cargarProgreso() {
      const { data, error: progresoError } = await supabase!
        .from("usuario_progreso")
        .select("nodo_id")
        .eq("usuario_id", usuarioId)
        .eq("estado", "dominado");

      if (progresoError) {
        setError(progresoError.message);
        return;
      }
      setDominados(new Set((data ?? []).map((r) => r.nodo_id)));
    }

    cargarProgreso();
  }, [usuarioId]);

  const estadoDe = (nodo: Nodo): Estado => {
    if (dominados.has(nodo.id)) return "dominado";
    const prereqsOk = nodo.prerequisitos.every((p) => dominados.has(p));
    return prereqsOk ? "disponible" : "bloqueado";
  };

  const ramas = useMemo(() => {
    const grupos: Record<string, Nodo[]> = {};
    (nodos ?? []).forEach((n) => {
      (grupos[n.rama] ??= []).push(n);
    });
    return grupos;
  }, [nodos]);

  const nodoSeleccionado = nodos?.find((n) => n.id === seleccionado) ?? null;

  async function marcarDominado(id: string) {
    if (!supabase || !usuarioId) return;
    const { error: upsertError } = await supabase.from("usuario_progreso").upsert(
      {
        usuario_id: usuarioId,
        nodo_id: id,
        estado: "dominado",
        fecha: new Date().toISOString(),
      },
      { onConflict: "usuario_id,nodo_id" }
    );
    if (upsertError) {
      setError(upsertError.message);
      return;
    }
    setDominados((prev) => new Set(prev).add(id));
    setSeleccionado(null);
  }

  if (error) {
    return (
      <div className="app">
        <div className="estadoMsg error">{error}</div>
      </div>
    );
  }

  if (!nodos) {
    return (
      <div className="app">
        <div className="estadoMsg">Cargando mapa de aprendizaje…</div>
      </div>
    );
  }

  const total = nodos.length;
  const done = dominados.size;

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          🏔 <b>Helikon.IA</b> — Ingeniería de Software + Biología vegetal
        </div>
        <div className="stat">
          {done}/{total} dominados
        </div>
      </div>
      <div className="progressbar">
        <div className="progressfill" style={{ width: `${(done / total) * 100}%` }} />
      </div>

      <div>
        {Object.entries(ramas).map(([rama, nodosRama]) => (
          <div className="rama" key={rama}>
            <div className="rama-title">{rama}</div>
            <div className="nodos">
              {nodosRama.map((n) => {
                const est = estadoDe(n);
                const label =
                  est === "dominado" ? "✓ dominado" : est === "disponible" ? "● disponible" : "○ bloqueado";
                return (
                  <div
                    key={n.id}
                    className={`nodo ${est}`}
                    onClick={() => est !== "bloqueado" && setSeleccionado(n.id)}
                  >
                    <div className="num">{String(n.numero).padStart(2, "0")}</div>
                    <div className="nom">{n.nombre}</div>
                    <div className="estado">{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="footnote mono">datos en vivo desde Supabase</div>

      <div className={`overlay ${nodoSeleccionado ? "open" : ""}`}>
        {nodoSeleccionado && (
          <div className="sheet">
            <button className="close" onClick={() => setSeleccionado(null)}>
              ✕
            </button>
            <SheetContent
              nodo={nodoSeleccionado}
              nodos={nodos}
              estado={estadoDe(nodoSeleccionado)}
              onDominar={() => marcarDominado(nodoSeleccionado.id)}
            />
          </div>
        )}
      </div>

      {!supabaseConfigured && (
        <div className="estadoMsg error">
          Falta configurar las variables de entorno de Supabase (ver .env.local.example)
        </div>
      )}
    </div>
  );
}

function SheetContent({
  nodo,
  nodos,
  estado,
  onDominar,
}: {
  nodo: Nodo;
  nodos: Nodo[];
  estado: Estado;
  onDominar: () => void;
}) {
  const prereqNames =
    nodo.prerequisitos.map((p) => nodos.find((x) => x.id === p)?.nombre).filter(Boolean).join(", ") ||
    "ninguno";

  return (
    <>
      <div className="sheet-eyebrow">
        Reto {String(nodo.numero).padStart(2, "0")} · {nodo.rama}
      </div>
      <div className="sheet-title">{nodo.nombre}</div>
      <div className="prereq-list">Prerrequisitos: {prereqNames}</div>
      <div className="campo">
        <div className="k">🎯 Objetivo</div>
        <div className="v">{nodo.objetivo || "—"}</div>
      </div>
      {nodo.construir && (
        <div className="campo">
          <div className="k">Construir</div>
          <div className="v">{nodo.construir}</div>
        </div>
      )}
      {nodo.romper && (
        <div className="campo">
          <div className="k">Romper</div>
          <div className="v">{nodo.romper}</div>
        </div>
      )}
      {nodo.resolver && (
        <div className="campo">
          <div className="k">Resolver</div>
          <div className="v">{nodo.resolver}</div>
        </div>
      )}
      <button className="btn" onClick={onDominar} disabled={estado === "dominado"}>
        {estado === "dominado" ? "✓ Ya dominado" : "Marcar como dominado"}
      </button>
    </>
  );
}
