"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import EmployerRow from "@/components/EmployerRow";
import { EMPLOYERS, byWalk, AISLE_ORDER, AISLE_LABEL, AISLE_SHORT, BLOCKING, ELIGIBILITY, host } from "@/lib/data";
import { usePlan } from "@/lib/store";
import s from "./route.module.css";

export default function Route() {
  const { plan, get, ready, setVisited, setNote, reset } = usePlan();
  const [focus, setFocus] = useState(false);
  // Booths deferred during this walk. Skipping must not claim you were there,
  // so it parks the stop here instead of marking it visited.
  const [skipped, setSkipped] = useState<string[]>([]);

  const route = useMemo(
    () => EMPLOYERS.filter((e) => plan[e.i]?.saved).sort(byWalk),
    [plan]
  );
  const done = route.filter((e) => plan[e.i]?.visited).length;
  const unvisited = route.filter((e) => !plan[e.i]?.visited);
  const remaining = unvisited.filter((e) => !skipped.includes(e.i));
  const next = remaining[0];

  // The rail: how many of your stops fall in each real aisle of the hall.
  const rail = useMemo(
    () => AISLE_ORDER.map((id) => {
      const inAisle = route.filter((e) => e.a === id);
      return { id, total: inAisle.length, done: inAisle.filter((e) => plan[e.i]?.visited).length };
    }),
    [route, plan]
  );

  if (!ready) return <main className="wrap"><p className={s.quiet}>Loading your route…</p></main>;

  if (route.length === 0) {
    return (
      <main className={`wrap ${s.empty}`}>
        <p className="eyebrow">My route</p>
        <h1 className="display" style={{ fontSize: 27, margin: "8px 0 12px", lineHeight: 1.12 }}>
          You haven’t picked any booths yet
        </h1>
        <p style={{ color: "var(--ink-2)", margin: "0 0 24px", lineHeight: 1.55 }}>
          Bookmark employers and we’ll put them in the order it actually makes sense to
          walk them: aisle by aisle, without doubling back.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link className="btn btn--primary" href="/profile">Build it in 4 questions</Link>
          <Link className="btn" href="/">Pick them yourself</Link>
        </div>
      </main>
    );
  }

  if (focus && next) {
    const st = get(next.i);
    const blocked = next.el && BLOCKING.has(next.el.v);
    const pos = route.indexOf(next) + 1;
    return (
      <main className={s.focus}>
        <div className="wrap">
          <div className={s.focusHead}>
            <button className={s.close} onClick={() => setFocus(false)} aria-label="Leave route mode">
              ✕ Exit
            </button>
            <p className={`mono ${s.pos}`}>{pos} / {route.length}</p>
          </div>
          <Rail rail={rail} activeAisle={next.a} />

          <div className={s.card}>
            <p className={s.aisle}>{next.a ? AISLE_LABEL[next.a] : "No location"}</p>
            <p className={`mono ${s.bigBooth}`}>{next.b ?? "—"}</p>
            <h1 className={`display ${s.focusName}`}>{next.n}</h1>
            <p className={s.focusSector}>{next.sec}</p>

            {blocked && (
              <div className="alert" style={{ marginTop: 18 }}>
                <b>{ELIGIBILITY[next.el!.v]}</b>
                <p className="quote">“{next.el!.q}”</p>
                <p style={{ margin: "8px 0 0" }}>
                  <a className="src" href={next.el!.s} target="_blank" rel="noopener noreferrer">
                    {host(next.el!.s)} ↗
                  </a>
                </p>
              </div>
            )}

            <textarea className={s.note} rows={3} value={st.note}
              placeholder="Who you spoke to, what they asked for…"
              onChange={(ev) => setNote(next.i, ev.target.value)} />
            <p className={s.detailLink}><Link href={`/e/${next.i}`}>See the full profile →</Link></p>
          </div>
        </div>

        <div className={s.actions}>
          <div className={`wrap ${s.actionsIn}`}>
            <button className="btn" onClick={() => {
              // Nothing left to come back to, so end the walk rather than
              // parking the last stop where it can never resurface.
              if (remaining.length <= 1) { setSkipped([]); setFocus(false); }
              else setSkipped((prev) => [...prev, next.i]);
            }}>Skip for now</button>
            <button className="btn btn--primary" style={{ flex: 1 }} onClick={() => setVisited(next.i, true)}>
              Visited
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <header className={s.top}>
        <div className="wrap">
          <p className="eyebrow" style={{ color: "inherit", opacity: .6 }}>My route</p>
          <h1 className={`display ${s.h1}`}>
            {route.length} {route.length === 1 ? "stop" : "stops"}
          </h1>
          <p className={s.lead}>
            In real sweep order: aisle by aisle, alternating direction, so you never
            double back on yourself.
          </p>
          <Rail rail={rail} dark />
          <p className={`mono ${s.progress}`}>{done} of {route.length} visited</p>
        </div>
      </header>

      <main className="wrap">
        {unvisited.length > 0 && (
          <div className={s.cta}>
            {/* Start each walk from a clean slate, so anything skipped last time
                comes back around instead of disappearing. */}
            <button className="btn btn--primary btn--block"
              onClick={() => { setSkipped([]); setFocus(true); }}>
              {done === 0 ? "Start walking" : "Continue from booth " + (unvisited[0].b ?? "—")}
            </button>
          </div>
        )}
        <ul className={s.list}>
          {route.map((e, i) => <EmployerRow key={e.i} e={e} stop={i + 1} />)}
        </ul>
        <button className={s.reset} onClick={() => {
          if (confirm("Clear your route, notes and visited marks?")) reset();
        }}>Clear my route</button>
      </main>
    </>
  );
}

/** Each cell is a real aisle in the hall; its width is how many of your stops land there. */
function Rail({ rail, dark, activeAisle }:
  { rail: { id: string; total: number; done: number }[]; dark?: boolean; activeAisle?: string }) {
  const max = Math.max(1, ...rail.map((r) => r.total));
  const total = rail.reduce((a, r) => a + r.total, 0);
  return (
    <div className={s.railWrap} data-dark={dark}>
      <p className={s.railTitle}>
        Your stops by aisle <span aria-hidden="true">·</span> in the order you’ll walk them
      </p>
      <div className={s.rail}
        role="img"
        aria-label={`Your ${total} stops across the aisles: ` +
          rail.map((r) => `${AISLE_LABEL[r.id]}, ${r.total} ${r.total === 1 ? "stop" : "stops"}, ${r.done} visited`).join("; ")}>
        {rail.map((r) => (
          <div key={r.id} className={s.railCell} data-active={r.id === activeAisle}
            data-empty={r.total === 0} style={{ flexGrow: Math.max(0.5, r.total / max) }}>
            <div className={s.railBar}>
              <div className={s.railFill}
                style={{ width: r.total ? `${(r.done / r.total) * 100}%` : "0%" }} />
            </div>
            <span className={s.railName}>{AISLE_SHORT[r.id]}</span>
            <span className={`mono ${s.railN}`}>{r.total || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
