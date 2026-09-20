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

/** Someone you actually spoke to at the booth. */
export type Contact = { name: string; role: string; info: string };

/**
 * What you found out about work authorisation yourself.
 * Deliberately separate from the employer's `el` field, which only ever holds
 * cases we could source and cite. This one is your own note, shown as such,
 * and never presented as evidence.
 */
export type MyEl = "" | "open" | "needs";

export type Stop = {
  saved: boolean;
  visited: boolean;
  note: string;
  tags: Outcome[];
  visitedAt?: number;   // drives the 48-hour follow-up window
  stage?: Stage;
  contacts: Contact[];
  myEl: MyEl;
};
export type Plan = Record<string, Stop>;

const KEY = "p4e.plan.v1";
const EMPTY: Stop = { saved: false, visited: false, note: "", tags: [], contacts: [], myEl: "" };

/** Older saved plans predate tags, timestamps, contacts and myEl. */
function normalise(v: Partial<Stop> | undefined): Stop {
  return {
    ...EMPTY, ...v,
    tags: Array.isArray(v?.tags) ? (v.tags as Outcome[]) : [],
    contacts: Array.isArray(v?.contacts) ? v.contacts : [],
    myEl: (v?.myEl as MyEl) ?? "",
  };
}
const migrate = (raw: unknown): Plan => {
  const out: Plan = {};
  for (const [id, v] of Object.entries((raw ?? {}) as Record<string, Partial<Stop>>)) {
    out[id] = normalise(v);
  }
  return out;
};

type Ctx = {
  plan: Plan; ready: boolean;
  get: (id: string) => Stop;
  toggleSaved: (id: string) => void;
  toggleVisited: (id: string) => void;
  setVisited: (id: string, visited: boolean) => void;
  toggleTag: (id: string, tag: Outcome) => void;
  setNote: (id: string, note: string) => void;
  setStage: (id: string, stage: Stage) => void;
  setMyEl: (id: string, myEl: MyEl) => void;
  addContact: (id: string, c: Contact) => void;
  removeContact: (id: string, index: number) => void;
  savedIds: string[];
  replaceAll: (plan: Plan) => void;
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
    setPlan((cur) => ({ ...cur, [id]: { ...normalise(cur[id]), ...p } }));
  }, []);

  const value: Ctx = {
    plan, ready,
    get: (id) => normalise(plan[id]),
    toggleSaved: (id) => patch(id, { saved: !(plan[id]?.saved ?? false) }),
    toggleVisited: (id) => {
      const now = !(plan[id]?.visited ?? false);
      patch(id, { visited: now, visitedAt: now ? Date.now() : undefined });
    },
    // Keeps the original stamp when a stop is already visited, so the
    // follow-up window counts from the conversation and not from a re-tap.
    setVisited: (id, visited) => patch(id, {
      visited, visitedAt: visited ? (plan[id]?.visitedAt ?? Date.now()) : undefined,
    }),
    toggleTag: (id, tag) => {
      const cur = plan[id]?.tags ?? [];
      patch(id, { tags: cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag] });
    },
    setNote: (id, note) => patch(id, { note }),
    setStage: (id, stage) => patch(id, { stage }),
    setMyEl: (id, myEl) => patch(id, { myEl }),
    addContact: (id, c) => patch(id, { contacts: [...normalise(plan[id]).contacts, c] }),
    removeContact: (id, index) =>
      patch(id, { contacts: normalise(plan[id]).contacts.filter((_, i) => i !== index) }),
    savedIds: Object.keys(plan).filter((k) => plan[k]?.saved),
    replaceAll: (next) => setPlan(next),
    reset: () => setPlan({}),
  };
  return <PlanCtx.Provider value={value}>{children}</PlanCtx.Provider>;
}

export function usePlan() {
  const c = useContext(PlanCtx);
  if (!c) throw new Error("usePlan used outside PlanProvider");
  return c;
}

/** Exposed so callers never hand-roll a second, drifting copy of this. */
export { normalise as normaliseStop };

/** Whether a stop holds anything worth keeping in a backup. */
export function isEmptyStop(s: Stop): boolean {
  return !s.saved && !s.visited && !s.myEl && !s.stage &&
    s.tags.length === 0 && !s.note.trim() && s.contacts.length === 0;
}

/**
 * Merge an imported plan into the current one, so two phones can be combined
 * after the fair. Nothing is discarded: flags OR together, differing notes are
 * concatenated, tags union, and contacts de-duplicate on name + info.
 */
export function mergePlans(current: Plan, incoming: Plan): { plan: Plan; added: number } {
  const out: Plan = { ...current };
  let added = 0;
  for (const [id, raw] of Object.entries(incoming)) {
    const inc = normalise(raw);
    const cur = normalise(out[id]);
    const note = inc.note.trim() && inc.note.trim() !== cur.note.trim()
      ? [cur.note.trim(), inc.note.trim()].filter(Boolean).join("\n---\n")
      : cur.note;
    const contacts = [...cur.contacts];
    for (const c of inc.contacts) {
      if (!contacts.some((x) => x.name === c.name && x.info === c.info)) {
        contacts.push(c);
        added++;
      }
    }
    // Earliest stamp wins, so an imported visit can't push a follow-up later.
    const times = [cur.visitedAt, inc.visitedAt].filter((t): t is number => typeof t === "number");
    out[id] = {
      saved: cur.saved || inc.saved,
      visited: cur.visited || inc.visited,
      myEl: cur.myEl || inc.myEl,
      stage: cur.stage ?? inc.stage,
      tags: [...new Set([...cur.tags, ...inc.tags])],
      visitedAt: times.length ? Math.min(...times) : undefined,
      note, contacts,
    };
  }
  return { plan: out, added };
}
