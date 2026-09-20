import raw from "@/data/employers.json";
import type { Employer, Payload } from "./types";

const payload = raw as unknown as Payload;
export const EVENT = payload.ev;
export const FLOORPLAN = payload.fp;
export const EMPLOYERS = payload.e;

export const HIRING = [
  { k: "coop", label: "Co-op", i: 0 },
  { k: "summer", label: "Verano", i: 1 },
  { k: "ft27", label: "Full-time 2027", i: 2 },
  { k: "ftal", label: "Full-time alumni", i: 3 },
] as const;

/** Elegibilidad que bloquea a alguien con permiso de trabajo. */
export const BLOCKING = new Set(["citizen_only", "pr_or_citizen"]);

export const ELIGIBILITY: Record<string, string> = {
  citizen_only: "Exige ciudadanía canadiense",
  pr_or_citizen: "Exige ciudadanía o residencia permanente",
  preference: "Prefiere ciudadanos y PR, pero no bloquea",
  open: "Abierto con permiso de trabajo",
};
export const SECURITY: Record<string, string> = {
  clearance: "Pide security clearance",
  controlled_goods: "Controlled Goods Program / ITAR",
  clearance_some_roles: "Clearance en algunos puestos",
};

/**
 * Orden real de recorrido. Los pasillos son las separaciones de 120px medidas
 * en el plano; se barren en zigzag, que es como se camina una feria.
 */
const SWEEP = ["P0", "P1", "P2", "P3", "P4", "P5"];
const DOWNWARD: Record<string, number> = { P0: 1, P1: 1, P2: -1, P3: 1, P4: -1, P5: 1 };
export const AISLE_LABEL: Record<string, string> = {
  P0: "Entrada", P1: "Pasillo 1", P2: "Pasillo 2",
  P3: "Pasillo 3", P4: "Pasillo 4", P5: "Pasillo 5",
};
export const AISLE_ORDER = SWEEP;

export function walkKey(e: Employer): number {
  if (!e.a || e.y == null) return 1e9;
  const i = SWEEP.indexOf(e.a);
  return i * 1e5 + (DOWNWARD[e.a] > 0 ? e.y : 3000 - e.y);
}
export const byWalk = (a: Employer, b: Employer) => walkKey(a) - walkKey(b);
export const byName = (a: Employer, b: Employer) => a.n.localeCompare(b.n, "es");

/** Islas espalda con espalda, medidas en el plano (40px entre columnas). */
export const PAIRED: Record<string, string> = {
  D: "E", E: "D", F: "G", G: "F", H: "I", I: "H", J: "K", K: "J",
};

export type Why = { k: string; t: string; s?: string };

/** Busqueda con evidencia: devuelve QUE texto hizo aparecer al empleador. */
export function match(e: Employer, q: string): { ok: boolean; why?: Why } {
  if (!q) return { ok: true };
  const n = q.toLowerCase();
  if (e.n.toLowerCase().includes(n)) return { ok: true };
  if (e.b && e.b.toLowerCase() === n) return { ok: true, why: { k: "Booth", t: e.b } };
  const cat = e.c.find((c) => c.toLowerCase().includes(n));
  if (cat) return { ok: true, why: { k: "Categoría oficial P4E", t: cat } };
  if (e.ind.toLowerCase().includes(n)) return { ok: true, why: { k: "Industria", t: e.ind } };
  if (e.sec.toLowerCase().includes(n)) return { ok: true, why: { k: "Sector", t: e.sec } };
  for (const d of e.sd ?? []) {
    if (d.d.toLowerCase().includes(n) || d.q.toLowerCase().includes(n))
      return { ok: true, why: { k: `Su sitio menciona ${d.d}`, t: d.q, s: d.s } };
  }
  if (e.t && e.t.toLowerCase().includes(n))
    return { ok: true, why: { k: "Cómo se describe la empresa", t: e.t, s: e.w } };
  return { ok: false };
}

export const byId = new Map(EMPLOYERS.map((e) => [e.i, e]));
export const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };
