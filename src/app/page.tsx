"use client";
import { useMemo, useState } from "react";
import Masthead from "@/components/Masthead";
import EmployerRow from "@/components/EmployerRow";
import FilterSheet, { NO_FILTERS, countFilters, type Filters } from "@/components/FilterSheet";
import { EMPLOYERS, HIRING, PAIRED, byName, byWalk, match, type Why } from "@/lib/data";
import { blockedFor } from "@/lib/presets";
import { useProfile } from "@/lib/profile";
import { usePlan, isEmptyStop, normaliseStop } from "@/lib/store";
import ProfileCard from "@/components/ProfileCard";
import SheetExport from "@/components/SheetExport";
import type { Employer } from "@/lib/types";
import s from "./page.module.css";

type Sort = "walk" | "col" | "name";
const SORTS: { k: Sort; label: string }[] = [
  { k: "walk", label: "Walking order" },
  { k: "col", label: "Column" },
  { k: "name", label: "A–Z" },
];

export default function Home() {
  const [q, setQ] = useState("");
  const [rawFilters, setFilters] = useState<Filters>(NO_FILTERS);
  const [sheet, setSheet] = useState(false);
  const [sort, setSort] = useState<Sort>("walk");
  const { profile } = useProfile();
  const { plan } = usePlan();

  // If they already answered the authorisation question on /profile, start the
  // list filtered the same way rather than making them say it twice. Derived
  // rather than copied into state, so there is nothing to keep in sync.
  const [authTouched, setAuthTouched] = useState(false);
  const autoAuth = !authTouched && profile.auth && profile.auth !== "unsure" ? profile.auth : "";
  const filters: Filters = useMemo(
    () => ({ ...rawFilters, auth: rawFilters.auth || autoAuth }),
    [rawFilters, autoAuth]
  );

  const hits = useMemo(() => {
    const blocked = filters.auth ? blockedFor(filters.auth) : null;
    const out: { e: Employer; why?: Why }[] = [];
    for (const e of EMPLOYERS) {
      if (filters.hire.length) {
        const has: Record<string, boolean> = {};
        HIRING.forEach((h) => (has[h.k] = e.h[h.i]));
        if (!filters.hire.every((k) => has[k])) continue;
      }
      if (filters.ind.length && !filters.ind.includes(e.ind)) continue;
      if (filters.cat.length && !e.c.some((c) => filters.cat.includes(c))) continue;
      if (filters.kw && e.kw !== 1) continue;
      if (blocked && e.el && blocked.has(e.el.v)) continue;
      if (filters.mine.length) {
        const m = plan[e.i]?.myEl ?? "";
        if (!filters.mine.includes(m === "" ? "none" : m)) continue;
      }
      const m = match(e, q.trim());
      if (m.ok) out.push({ e, why: m.why });
    }
    return out;
  }, [q, filters, plan]);

  // Everything you have written down, whatever the filters are set to right
  // now: a filter is a way of looking at the fair, not a way of choosing what
  // to keep. In walking order, so the file reads like the floor.
  const recorded = useMemo(
    () => EMPLOYERS.filter((e) => plan[e.i] && !isEmptyStop(normaliseStop(plan[e.i]))).sort(byWalk),
    [plan]
  );

  const nf = countFilters(filters);
  const sorted = useMemo(() => {
    const c = [...hits];
    if (sort === "name") c.sort((a, b) => byName(a.e, b.e));
    else c.sort((a, b) => byWalk(a.e, b.e));
    return c;
  }, [hits, sort]);

  const groups = useMemo(() => {
    if (sort !== "col") return null;
    const g = new Map<string, typeof sorted>();
    for (const h of [...hits].sort((a, b) =>
      (parseInt((a.e.b ?? "0").slice(1), 10) || 0) - (parseInt((b.e.b ?? "0").slice(1), 10) || 0))) {
      const k = h.e.b ? h.e.b[0] : "—";
      if (!g.has(k)) g.set(k, []);
      g.get(k)!.push(h);
    }
    return [...g.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [hits, sort]);

  return (
    <>
      <Masthead lead="All 160 employers on the real floorplan. Filter here, build your route, and walk the floor once on Wednesday." />

      <div className={s.bar}>
        <div className={`wrap ${s.barIn}`}>
          <div className={s.search}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.6-3.6" />
            </svg>
            <input value={q} onChange={(ev) => setQ(ev.target.value)} type="search"
              placeholder="UX, machine learning, telecom, nuclear…" aria-label="Search employers"
              enterKeyHint="search" autoComplete="off" />
            {q && <button className={s.x} onClick={() => setQ("")} aria-label="Clear search">×</button>}
          </div>
          <button className={`btn ${nf ? "btn--primary" : ""} ${s.filterBtn}`} onClick={() => setSheet(true)}>
            Filters{nf > 0 && <span className="mono" style={{ fontSize: 12 }}>{nf}</span>}
          </button>
        </div>
      </div>

      <main className="wrap">
        <ProfileCard />
        <div className={s.status}>
          <p className={s.count}>
            <b className="mono">{hits.length}</b> of {EMPLOYERS.length}
            {q && <> for <b>“{q}”</b></>}
          </p>
          <div className={s.seg} role="group" aria-label="Sort">
            {SORTS.map((o) => (
              <button key={o.k} className={s.segBtn} aria-pressed={sort === o.k}
                onClick={() => setSort(o.k)}>{o.label}</button>
            ))}
          </div>
        </div>

        {hits.length === 0 ? (
          <div className={s.empty}>
            <p className="display" style={{ fontSize: 19, margin: "0 0 6px" }}>Nothing matches those filters</p>
            <p style={{ margin: "0 0 18px", color: "var(--ink-2)", fontSize: 14.5 }}>
              Try fewer conditions, or search by booth (“H11”) or by what you do.
            </p>
            <button className="btn" onClick={() => { setQ(""); setFilters(NO_FILTERS); }}>
              Clear everything
            </button>
          </div>
        ) : groups ? (
          groups.map(([col, rows]) => (
            <section key={col}>
              <h2 className={s.group}>
                <span className="display">{col === "—" ? "No booth" : `Column ${col}`}</span>
                <span className={s.groupSub}>
                  {rows.length} {rows.length === 1 ? "employer" : "employers"}
                  {PAIRED[col] && <> · shares an island with column {PAIRED[col]}</>}
                </span>
              </h2>
              <ul className={s.list}>
                {rows.map(({ e, why }) => <EmployerRow key={e.i} e={e} why={why} />)}
              </ul>
            </section>
          ))
        ) : (
          <ul className={s.list}>
            {sorted.map(({ e, why }) => <EmployerRow key={e.i} e={e} why={why} />)}
          </ul>
        )}

        <SheetExport
          employers={recorded}
          file="p4e-my-notes"
          title="Take your notes with you"
          note="Everything you’ve written down — what happened at each booth, your notes, the
                people you met, and where each employer stands — as one spreadsheet you keep.
                It ignores the filters above and includes every employer you recorded
                something for."
        />
      </main>

      <FilterSheet open={sheet} onClose={() => setSheet(false)} value={filters}
        onChange={(f) => { setAuthTouched(true); setFilters(f); }} resultCount={hits.length} />
    </>
  );
}
