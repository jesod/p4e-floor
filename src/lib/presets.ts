import { EMPLOYERS, HIRING, BLOCKING, walkKey, AISLE_LABEL } from "./data";
import { FIELDS, type Profile } from "./profile";
import type { Employer } from "./types";

/** Which eligibility values are ruled out by the declared work authorization. */
export function blockedFor(auth: Profile["auth"]): Set<string> {
  if (auth === "pr") return new Set(["citizen_only"]);
  if (auth === "permit") return new Set(["citizen_only", "pr_or_citizen"]);
  return new Set(); // citizen or "rather not say": we filter nothing
}

export type Scored = { e: Employer; score: number; reasons: string[] };

export function scoreAll(p: Profile): { hits: Scored[]; excluded: Employer[] } {
  const blocked = blockedFor(p.auth);
  const fields = FIELDS.filter((f) => p.fields.includes(f.k));
  const hits: Scored[] = [];
  const excluded: Employer[] = [];

  for (const e of EMPLOYERS) {
    // Hard filter 1: legal eligibility, using only the cases we could source.
    if (e.el && blocked.has(e.el.v)) { excluded.push(e); continue; }

    // Hard filter 2: the kind of role they're after.
    if (p.seeking.length) {
      const has: Record<string, boolean> = {};
      HIRING.forEach((h) => (has[h.k] = e.h[h.i]));
      if (!p.seeking.some((k) => has[k])) continue;
    }

    let score = 0;
    const reasons: string[] = [];
    for (const f of fields) {
      const cats = e.c.filter((c) => f.cats.includes(c));
      if (cats.length) { score += 2 * cats.length; reasons.push(`${f.label}: ${cats.join(", ")}`); }
      const doms = (e.sd ?? []).filter((d) => f.domains.includes(d.d)).map((d) => d.d);
      if (doms.length) { score += doms.length; reasons.push(`${f.label}: their site talks about ${doms.join(", ")}`); }
    }
    if (p.localOnly && e.kw === 1) { score += 2; reasons.push("Verified head office in the KW region"); }

    // With no fields chosen, anything past the hard filters counts equally.
    if (fields.length === 0) score = Math.max(score, 1);
    if (score > 0) hits.push({ e, score, reasons });
  }
  hits.sort((a, b) => b.score - a.score || walkKey(a.e) - walkKey(b.e));
  return { hits, excluded };
}

export type Preset = {
  k: string; title: string; why: string; ids: string[]; count: number;
};

/** Routes built from the profile. Each one explains why it exists. */
export function buildPresets(p: Profile): { presets: Preset[]; excluded: Employer[]; total: number } {
  const { hits, excluded } = scoreAll(p);
  const presets: Preset[] = [];
  const byWalkOrder = [...hits].sort((a, b) => walkKey(a.e) - walkKey(b.e));

  if (hits.length) {
    presets.push({
      k: "base",
      title: "Everything that fits you",
      why: `All ${hits.length} employers that clear your filters, in floor-sweep order.`,
      ids: byWalkOrder.map((h) => h.e.i),
      count: hits.length,
    });
  }

  // One hour: the aisle where your strongest matches cluster.
  if (hits.length > 8) {
    const perAisle = new Map<string, Scored[]>();
    for (const h of hits) {
      const a = h.e.a ?? "P?";
      if (!perAisle.has(a)) perAisle.set(a, []);
      perAisle.get(a)!.push(h);
    }
    let best: [string, Scored[]] | null = null;
    for (const entry of perAisle) {
      const weight = entry[1].reduce((s, h) => s + h.score, 0);
      if (!best || weight > best[1].reduce((s, h) => s + h.score, 0)) best = entry;
    }
    if (best && best[1].length >= 3) {
      const ids = [...best[1]].sort((a, b) => walkKey(a.e) - walkKey(b.e)).slice(0, 9).map((h) => h.e.i);
      presets.push({
        k: "hour",
        title: "If you only have an hour",
        why: `Your strongest matches, clustered in ${AISLE_LABEL[best[0]] ?? "one aisle"}: ${ids.length} stops without crossing the floor.`,
        ids, count: ids.length,
      });
    }
  }

  // Staying in the region.
  const local = byWalkOrder.filter((h) => h.e.kw === 1);
  if (local.length >= 3) {
    presets.push({
      k: "local",
      title: "The ones based in KW",
      why: `${local.length} with a head office we verified in Kitchener–Waterloo and nearby. Each address comes from the company\u2019s own site, linked.`,
      ids: local.map((h) => h.e.i), count: local.length,
    });
  }

  // Top by affinity, when the profile names fields.
  if (p.fields.length && hits.length > 12) {
    const top = hits.slice(0, 12).sort((a, b) => walkKey(a.e) - walkKey(b.e));
    presets.push({
      k: "top",
      title: "Your 12 closest matches",
      why: "The employers that overlap most with the fields you picked, ranked by how many verified matches they have.",
      ids: top.map((h) => h.e.i), count: top.length,
    });
  }

  return { presets, excluded, total: hits.length };
}
