"use client";
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

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
  saved: boolean; visited: boolean; note: string;
  contacts: Contact[]; myEl: MyEl;
};
export type Plan = Record<string, Stop>;

const KEY = "p4e.plan.v1";
const EMPTY: Stop = { saved: false, visited: false, note: "", contacts: [], myEl: "" };

/** Saves made before contacts and myEl existed, filled in on read. */
function normalise(s: Partial<Stop> | undefined): Stop {
  return {
    ...EMPTY, ...s,
    contacts: Array.isArray(s?.contacts) ? s.contacts : [],
    myEl: (s?.myEl as MyEl) ?? "",
  };
}

type Ctx = {
  plan: Plan; ready: boolean;
  get: (id: string) => Stop;
  toggleSaved: (id: string) => void;
  toggleVisited: (id: string) => void;
  setVisited: (id: string, visited: boolean) => void;
  setNote: (id: string, note: string) => void;
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

  // The first render has to match the server HTML, so read storage after mount.
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
    setPlan((cur) => ({ ...cur, [id]: { ...normalise(cur[id]), ...p } }));
  }, []);

  const value: Ctx = {
    plan, ready,
    get: (id) => normalise(plan[id]),
    toggleSaved: (id) => patch(id, { saved: !(plan[id]?.saved ?? false) }),
    toggleVisited: (id) => patch(id, { visited: !(plan[id]?.visited ?? false) }),
    setVisited: (id, visited) => patch(id, { visited }),
    setNote: (id, note) => patch(id, { note }),
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

/** Whether a stop holds anything worth keeping in a backup. */
export function isEmptyStop(s: Stop): boolean {
  return !s.saved && !s.visited && !s.myEl && !s.note.trim() && s.contacts.length === 0;
}

/**
 * Merge an imported plan into the current one, so two phones can be combined
 * after the fair. Nothing is discarded: flags OR together, differing notes are
 * concatenated, and contacts de-duplicate on name + info.
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
    out[id] = {
      saved: cur.saved || inc.saved,
      visited: cur.visited || inc.visited,
      myEl: cur.myEl || inc.myEl,
      note, contacts,
    };
  }
  return { plan: out, added };
}
