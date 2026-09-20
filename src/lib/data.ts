import raw from "@/data/employers.json";
import type { Employer, Payload } from "./types";

const payload = raw as unknown as Payload;
export const EVENT = payload.ev;
export const FLOORPLAN = payload.fp;
export const EMPLOYERS = payload.e;

export const HIRING = [
  { k: "coop", label: "Co-op", i: 0 },
  { k: "summer", label: "Summer", i: 1 },
  { k: "ft27", label: "Full-time, 2027 grads", i: 2 },
  { k: "ftal", label: "Full-time, alumni", i: 3 },
] as const;

/** Eligibility values that rule out someone holding a work or study permit. */
export const BLOCKING = new Set(["citizen_only", "pr_or_citizen"]);

export const ELIGIBILITY: Record<string, string> = {
  citizen_only: "Canadian citizenship required",
  pr_or_citizen: "Canadian citizenship or PR required",
  preference: "Prefers citizens and PRs, but does not rule you out",
  open: "Open to anyone eligible to work in Canada",
};
export const SECURITY: Record<string, string> = {
  clearance: "Security clearance required",
  controlled_goods: "Controlled Goods Program / ITAR",
  clearance_some_roles: "Clearance for some roles",
};

/**
 * Real walking order. The aisles are the 120-unit gaps measured on the floorplan;
 * we sweep them in a serpentine, which is how you actually walk a trade show floor.
 */
const SWEEP = ["P0", "P1", "P2", "P3", "P4", "P5"];
const DOWNWARD: Record<string, number> = { P0: 1, P1: 1, P2: -1, P3: 1, P4: -1, P5: 1 };
export const AISLE_LABEL: Record<string, string> = {
  P0: "By the entrance", P1: "Aisle 1", P2: "Aisle 2",
  P3: "Aisle 3", P4: "Aisle 4", P5: "Aisle 5",
};
export const AISLE_SHORT: Record<string, string> = {
  P0: "Entr", P1: "A1", P2: "A2", P3: "A3", P4: "A4", P5: "A5",
};
/** x of the walking corridor each aisle group sits on, measured on the floorplan. */
export const AISLE_X: Record<string, number> = {
  P0: 700, P1: 900, P2: 1060, P3: 1220, P4: 1380, P5: 1520,
};
export const AISLE_ORDER = SWEEP;

export function walkKey(e: Employer): number {
  if (!e.a || e.y == null) return 1e9;
  const i = SWEEP.indexOf(e.a);
  return i * 1e5 + (DOWNWARD[e.a] > 0 ? e.y : 3000 - e.y);
}
export const byWalk = (a: Employer, b: Employer) => walkKey(a) - walkKey(b);
export const byName = (a: Employer, b: Employer) => a.n.localeCompare(b.n, "es");

/** Back-to-back islands, measured on the floorplan (40 units between columns). */
export const PAIRED: Record<string, string> = {
  D: "E", E: "D", F: "G", G: "F", H: "I", I: "H", J: "K", K: "J",
};

export type Why = { k: string; t: string; s?: string };

/** Search with evidence: returns WHICH text made this employer show up. */
export function match(e: Employer, q: string): { ok: boolean; why?: Why } {
  if (!q) return { ok: true };
  const n = q.toLowerCase();
  if (e.n.toLowerCase().includes(n)) return { ok: true };
  if (e.b && e.b.toLowerCase() === n) return { ok: true, why: { k: "Booth", t: e.b } };
  const cat = e.c.find((c) => c.toLowerCase().includes(n));
  if (cat) return { ok: true, why: { k: "P4E job category", t: cat } };
  if (e.ind.toLowerCase().includes(n)) return { ok: true, why: { k: "Industry", t: e.ind } };
  if (e.sec.toLowerCase().includes(n)) return { ok: true, why: { k: "Sector", t: e.sec } };
  for (const d of e.sd ?? []) {
    if (d.d.toLowerCase().includes(n) || d.q.toLowerCase().includes(n))
      return { ok: true, why: { k: `Their site mentions ${d.d}`, t: d.q, s: d.s } };
  }
  if (e.t && e.t.toLowerCase().includes(n))
    return { ok: true, why: { k: "How they describe themselves", t: e.t, s: e.w } };
  return { ok: false };
}

export const byId = new Map(EMPLOYERS.map((e) => [e.i, e]));
export const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };
