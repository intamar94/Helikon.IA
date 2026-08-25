"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "helikon_usuario_id";

export function useUsuarioId() {
  const [usuarioId, setUsuarioId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, id);
    }
    setUsuarioId(id);
  }, []);

  return usuarioId;
}
