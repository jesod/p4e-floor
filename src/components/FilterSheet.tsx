"use client";
import { useEffect, useRef } from "react";
import { EMPLOYERS, HIRING } from "@/lib/data";
import { blockedFor } from "@/lib/presets";
import { AUTHS, type Auth } from "@/lib/profile";
import { usePlan, type MyEl } from "@/lib/store";
import s from "./FilterSheet.module.css";

export type Filters = {
  hire: string[]; ind: string[]; cat: string[]; kw: boolean;
  /** Declared work authorisation. "" means we filter nothing on eligibility. */
  auth: Auth | "";
  /** What you recorded yourself: "open" | "needs" | "none" (not yet recorded). */
  mine: string[];
};
export const NO_FILTERS: Filters = { hire: [], ind: [], cat: [], kw: false, auth: "", mine: [] };
export const countFilters = (f: Filters) =>
  f.hire.length + f.ind.length + f.cat.length + (f.kw ? 1 : 0) +
  (f.auth && f.auth !== "unsure" ? 1 : 0) + f.mine.length;

const INDUSTRIES = [...new Set(EMPLOYERS.map((e) => e.ind))].sort();
const CATEGORIES = [...new Set(EMPLOYERS.flatMap((e) => e.c))].sort();
const N_KW = EMPLOYERS.filter((e) => e.kw === 1).length;

/** How many of the sourced cases each status actually rules out. */
const RULED_OUT: Record<string, number> = Object.fromEntries(
  AUTHS.map((a) => {
    const blocked = blockedFor(a.k);
    return [a.k, EMPLOYERS.filter((e) => e.el && blocked.has(e.el.v)).length];
  })
);

const MINE: { k: string; label: string }[] = [
  { k: "open", label: "I found: no PR needed" },
  { k: "needs", label: "I found: needs PR or citizenship" },
  { k: "none", label: "I haven’t checked yet" },
];

const toggle = (arr: string[], v: string) =>
  arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

export default function FilterSheet({
  open, onClose, value, onChange, resultCount,
}: {
  open: boolean; onClose: () => void; value: Filters;
  onChange: (f: Filters) => void; resultCount: number;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const { plan } = usePlan();

  useEffect(() => {
    if (!open) return;
    const onKey = (ev: KeyboardEvent) => { if (ev.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  if (!open) return null;
  const n = countFilters(value);

  const mineCount = (k: string) =>
    EMPLOYERS.filter((e) => {
      const m = (plan[e.i]?.myEl ?? "") as MyEl;
      return k === "none" ? m === "" : m === k;
    }).length;

  return (
    <div className={s.scrim} onClick={onClose}>
      <div className={s.sheet} ref={panel} tabIndex={-1} role="dialog" aria-modal="true"
        aria-label="Filters" onClick={(ev) => ev.stopPropagation()}>
        <div className={s.grab} aria-hidden="true" />
        <div className={s.head}>
          <h2 className="display" style={{ fontSize: 20, margin: 0 }}>Filters</h2>
          {n > 0 && (
            <button className={s.clear} onClick={() => onChange(NO_FILTERS)}>
              Clear {n}
            </button>
          )}
        </div>

        <div className={s.scroll}>
          <Group title="What you’re looking for">
            {HIRING.map((h) => (
              <Chip key={h.k} label={h.label} n={EMPLOYERS.filter((e) => e.h[h.i]).length}
                on={value.hire.includes(h.k)}
                onClick={() => onChange({ ...value, hire: toggle(value.hire, h.k) })} />
            ))}
            <p className={s.hint}>With more than one selected, we only show employers offering all of them.</p>
          </Group>

          <Group title="What lets you work in Canada">
            {AUTHS.filter((a) => a.k !== "unsure").map((a) => (
              <Chip key={a.k} label={a.label} n={RULED_OUT[a.k]}
                on={value.auth === a.k}
                onClick={() => onChange({ ...value, auth: value.auth === a.k ? "" : a.k })} />
            ))}
            <p className={s.hint}>
              The number is how many employers that status rules out. We only count the cases
              where we found the policy published and linked it — we make no claim about the rest,
              and nothing here is stored or sent anywhere.
            </p>
          </Group>

          <Group title="What you recorded yourself">
            {MINE.map((m) => (
              <Chip key={m.k} label={m.label} n={mineCount(m.k)}
                on={value.mine.includes(m.k)}
                onClick={() => onChange({ ...value, mine: toggle(value.mine, m.k) })} />
            ))}
            <p className={s.hint}>
              Your own notes from the floor, kept apart from the sourced policies above.
              Set it on any employer’s page.
            </p>
          </Group>

          <Group title="Location">
            <Chip label="Head office in the KW region" n={N_KW} on={value.kw}
              onClick={() => onChange({ ...value, kw: !value.kw })} />
          </Group>

          <Group title="Industry">
            {INDUSTRIES.map((v) => (
              <Chip key={v} label={v} n={EMPLOYERS.filter((e) => e.ind === v).length}
                on={value.ind.includes(v)}
                onClick={() => onChange({ ...value, ind: toggle(value.ind, v) })} />
            ))}
          </Group>

          <Group title="Job category · P4E’s own wording">
            {CATEGORIES.map((v) => (
              <Chip key={v} label={v} n={EMPLOYERS.filter((e) => e.c.includes(v)).length}
                on={value.cat.includes(v)}
                onClick={() => onChange({ ...value, cat: toggle(value.cat, v) })} />
            ))}
          </Group>
        </div>

        <div className={s.foot}>
          <button className="btn btn--primary btn--block" onClick={onClose}>
            Show {resultCount} {resultCount === 1 ? "employer" : "employers"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={s.group}>
      <h3 className="eyebrow">{title}</h3>
      <div className={s.chips}>{children}</div>
    </section>
  );
}
function Chip({ label, n, on, onClick }: { label: string; n: number; on: boolean; onClick: () => void }) {
  return (
    <button className="chip" aria-pressed={on} onClick={onClick}>
      {label}<span className="n">{n}</span>
    </button>
  );
}
