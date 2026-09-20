"use client";
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

/** One-tap outcomes. Typing in a loud gym with one hand does not happen. */
export const OUTCOMES = [
  { k: "resume", label: "Took my résumé", follow: true },
  { k: "contact", label: "Gave me a contact", follow: true },
  { k: "apply", label: "Said apply online", follow: true },
  { k: "strong", label: "Strong conversation", follow: true },
  { k: "back", label: "Come back later", follow: false },
  { k: "nofit", label: "Not hiring my program", follow: false },
] as const;
export type Outcome = (typeof OUTCOMES)[number]["k"];
export const FOLLOW_WORTHY: Set<string> = new Set(OUTCOMES.filter((o) => o.follow).map((o) => o.k));
export const OUTCOME_LABEL: Record<string, string> =
  Object.fromEntries(OUTCOMES.map((o) => [o.k, o.label]));

/** Where a conversation stands after the fair. */
export const STAGES = [
  { k: "todo", label: "To contact" },
  { k: "applied", label: "Applied" },
  { k: "replied", label: "They replied" },
  { k: "interview", label: "Interview" },
  { k: "closed", label: "Closed" },
] as const;
export type Stage = (typeof STAGES)[number]["k"];
export const STAGE_LABEL: Record<string, string> =
  Object.fromEntries(STAGES.map((s) => [s.k, s.label]));

export type Stop = {
  saved: boolean;
  visited: boolean;
  note: string;
  tags: Outcome[];
  visitedAt?: number;   // drives the 48-hour follow-up window
  stage?: Stage;
};
type Plan = Record<string, Stop>;

const KEY = "p4e.plan.v1";
const EMPTY: Stop = { saved: false, visited: false, note: "", tags: [] };

/** Older saved plans predate tags and timestamps. */
const migrate = (raw: unknown): Plan => {
  const out: Plan = {};
  for (const [id, v] of Object.entries((raw ?? {}) as Record<string, Partial<Stop>>)) {
    out[id] = { ...EMPTY, ...v, tags: Array.isArray(v?.tags) ? (v.tags as Outcome[]) : [] };
  }
  return out;
};

type Ctx = {
  plan: Plan; ready: boolean;
  get: (id: string) => Stop;
  toggleSaved: (id: string) => void;
  toggleVisited: (id: string) => void;
  toggleTag: (id: string, tag: Outcome) => void;
  setNote: (id: string, note: string) => void;
  setStage: (id: string, stage: Stage) => void;
  savedIds: string[];
  reset: () => void;
};
const PlanCtx = createContext<Ctx | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<Plan>({});
  const [ready, setReady] = useState(false);

  // The first render must match the server HTML, so we read storage after mount.
  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v) setPlan(migrate(JSON.parse(v)));
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
    toggleVisited: (id) => {
      const now = !(plan[id]?.visited ?? false);
      patch(id, { visited: now, visitedAt: now ? Date.now() : undefined });
    },
    toggleTag: (id, tag) => {
      const cur = plan[id]?.tags ?? [];
      patch(id, { tags: cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag] });
    },
    setNote: (id, note) => patch(id, { note }),
    setStage: (id, stage) => patch(id, { stage }),
    savedIds: Object.keys(plan).filter((k) => plan[k]?.saved),
    reset: () => setPlan({}),
  };
  return <PlanCtx.Provider value={value}>{children}</PlanCtx.Provider>;
}

export function usePlan() {
  const c = useContext(PlanCtx);
  if (!c) throw new Error("usePlan used outside PlanProvider");
  return c;
}
