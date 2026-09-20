import { EMPLOYERS, HIRING, BLOCKING, walkKey, AISLE_LABEL } from "./data";
import { FIELDS, type Profile } from "./profile";
import type { Employer } from "./types";

/** Qué elegibilidades quedan fuera según la autorización declarada. */
export function blockedFor(auth: Profile["auth"]): Set<string> {
  if (auth === "pr") return new Set(["citizen_only"]);
  if (auth === "permit") return new Set(["citizen_only", "pr_or_citizen"]);
  return new Set(); // ciudadanía o "prefiero no decirlo": no filtramos
}

export type Scored = { e: Employer; score: number; reasons: string[] };

export function scoreAll(p: Profile): { hits: Scored[]; excluded: Employer[] } {
  const blocked = blockedFor(p.auth);
  const fields = FIELDS.filter((f) => p.fields.includes(f.k));
  const hits: Scored[] = [];
  const excluded: Employer[] = [];

  for (const e of EMPLOYERS) {
    // Filtro duro 1: elegibilidad legal, solo con los casos que tienen fuente.
    if (e.el && blocked.has(e.el.v)) { excluded.push(e); continue; }

    // Filtro duro 2: qué tipo de puesto busca.
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
      if (doms.length) { score += doms.length; reasons.push(`${f.label}: su sitio habla de ${doms.join(", ")}`); }
    }
    if (p.localOnly && e.kw === 1) { score += 2; reasons.push("Sede verificada en la región KW"); }

    // Sin áreas elegidas, todo lo que pasó los filtros duros cuenta igual.
    if (fields.length === 0) score = Math.max(score, 1);
    if (score > 0) hits.push({ e, score, reasons });
  }
  hits.sort((a, b) => b.score - a.score || walkKey(a.e) - walkKey(b.e));
  return { hits, excluded };
}

export type Preset = {
  k: string; title: string; why: string; ids: string[]; count: number;
};

/** Recorridos armados a partir del perfil. Cada uno explica por qué existe. */
export function buildPresets(p: Profile): { presets: Preset[]; excluded: Employer[]; total: number } {
  const { hits, excluded } = scoreAll(p);
  const presets: Preset[] = [];
  const byWalkOrder = [...hits].sort((a, b) => walkKey(a.e) - walkKey(b.e));

  if (hits.length) {
    presets.push({
      k: "base",
      title: "Todo lo que te calza",
      why: `Los ${hits.length} empleadores que pasan tus filtros, en orden de barrido del piso.`,
      ids: byWalkOrder.map((h) => h.e.i),
      count: hits.length,
    });
  }

  // Una hora: el pasillo donde se concentran tus mejores coincidencias.
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
        title: "Si solo tenés una hora",
        why: `Tus mejores coincidencias concentradas en ${AISLE_LABEL[best[0]] ?? "un solo pasillo"}: ${ids.length} paradas sin cruzar el piso.`,
        ids, count: ids.length,
      });
    }
  }

  // Quedarse en la región.
  const local = byWalkOrder.filter((h) => h.e.kw === 1);
  if (local.length >= 3) {
    presets.push({
      k: "local",
      title: "Los que se quedan en KW",
      why: `${local.length} con sede verificada en Kitchener–Waterloo y alrededores. La sede sale del sitio de cada empresa, con link.`,
      ids: local.map((h) => h.e.i), count: local.length,
    });
  }

  // Top por afinidad, cuando el perfil declara áreas.
  if (p.fields.length && hits.length > 12) {
    const top = hits.slice(0, 12).sort((a, b) => walkKey(a.e) - walkKey(b.e));
    presets.push({
      k: "top",
      title: "Los 12 más afines",
      why: "Los que más coinciden con las áreas que elegiste, por cantidad de coincidencias verificadas.",
      ids: top.map((h) => h.e.i), count: top.length,
    });
  }

  return { presets, excluded, total: hits.length };
}
