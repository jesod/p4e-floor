"use client";
import { useEffect, useRef } from "react";
import { EMPLOYERS, HIRING, BLOCKING } from "@/lib/data";
import s from "./FilterSheet.module.css";

export type Filters = {
  hire: string[]; ind: string[]; cat: string[]; kw: boolean; noblock: boolean;
};
export const NO_FILTERS: Filters = { hire: [], ind: [], cat: [], kw: false, noblock: false };
export const countFilters = (f: Filters) =>
  f.hire.length + f.ind.length + f.cat.length + (f.kw ? 1 : 0) + (f.noblock ? 1 : 0);

const INDUSTRIES = [...new Set(EMPLOYERS.map((e) => e.ind))].sort();
const CATEGORIES = [...new Set(EMPLOYERS.flatMap((e) => e.c))].sort();
const N_KW = EMPLOYERS.filter((e) => e.kw === 1).length;
const N_BLOCK = EMPLOYERS.filter((e) => e.el && BLOCKING.has(e.el.v)).length;

const toggle = (arr: string[], v: string) =>
  arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

export default function FilterSheet({
  open, onClose, value, onChange, resultCount,
}: {
  open: boolean; onClose: () => void; value: Filters;
  onChange: (f: Filters) => void; resultCount: number;
}) {
  const panel = useRef<HTMLDivElement>(null);

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

          <Group title="Eligibility and location">
            <Chip label="Head office in the KW region" n={N_KW} on={value.kw}
              onClick={() => onChange({ ...value, kw: !value.kw })} />
            <Chip label="Hide the ones requiring citizenship or PR" n={N_BLOCK} on={value.noblock}
              onClick={() => onChange({ ...value, noblock: !value.noblock })} />
            <p className={s.hint}>
              We only count the {N_BLOCK} cases where we found the policy published. We make no
              claim about the rest.
            </p>
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
