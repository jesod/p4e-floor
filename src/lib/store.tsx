"use client";
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export type Stop = { saved: boolean; visited: boolean; note: string };
type Plan = Record<string, Stop>;

const KEY = "p4e.plan.v1";
const EMPTY: Stop = { saved: false, visited: false, note: "" };

type Ctx = {
  plan: Plan; ready: boolean;
  get: (id: string) => Stop;
  toggleSaved: (id: string) => void;
  toggleVisited: (id: string) => void;
  setNote: (id: string, note: string) => void;
  savedIds: string[];
  reset: () => void;
};
const PlanCtx = createContext<Ctx | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<Plan>({});
  const [ready, setReady] = useState(false);

  // El primer render debe coincidir con el HTML del servidor, asi que
  // leemos el almacenamiento despues de montar.
  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v) setPlan(JSON.parse(v) as Plan);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(plan)); } catch {}
  }, [plan, ready]);

  const patch = useCallback((id: string, p: Partial<Stop>) => {
    setPlan((cur) => ({ ...cur, [id]: { ...EMPTY, ...cur[id], ...p } }));
  }, []);

  const value: Ctx = {
    plan, ready,
    get: (id) => plan[id] ?? EMPTY,
    toggleSaved: (id) => patch(id, { saved: !(plan[id]?.saved ?? false) }),
    toggleVisited: (id) => patch(id, { visited: !(plan[id]?.visited ?? false) }),
    setNote: (id, note) => patch(id, { note }),
    savedIds: Object.keys(plan).filter((k) => plan[k]?.saved),
    reset: () => setPlan({}),
  };
  return <PlanCtx.Provider value={value}>{children}</PlanCtx.Provider>;
}

export function usePlan() {
  const c = useContext(PlanCtx);
  if (!c) throw new Error("usePlan fuera de PlanProvider");
  return c;
}
