"use client";
import { OUTCOMES, usePlan, type Outcome } from "@/lib/store";
import s from "./OutcomeChips.module.css";

/**
 * One-tap capture. Tapping an outcome also marks the booth visited: if you're
 * recording what happened, you were there. Fewer taps standing in a gym.
 */
export default function OutcomeChips({ id, compact }: { id: string; compact?: boolean }) {
  const { get, toggleTag, toggleVisited, ready } = usePlan();
  const st = get(id);

  const tap = (k: Outcome) => {
    toggleTag(id, k);
    if (!st.visited && !st.tags.includes(k)) toggleVisited(id);
  };

  return (
    <div className={s.wrap} data-compact={compact}>
      {!compact && <p className="eyebrow">What happened?</p>}
      <div className={s.chips}>
        {OUTCOMES.map((o) => (
          <button key={o.k} className={s.chip}
            aria-pressed={ready && st.tags.includes(o.k)}
            onClick={() => tap(o.k)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
