"use client";

import { useState, useEffect } from "react";
import { getAnonymousId } from "@/lib/anonymous";

/**
 * Hook que provee el UUID anónimo del usuario.
 * Retorna null durante SSR / hasta que hydrate.
 */
export function useAnonymousId(): string | null {
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    setUid(getAnonymousId());
  }, []);

  return uid;
}
