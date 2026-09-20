"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { EMPLOYERS, EVENT, host } from "@/lib/data";
import { usePlan, OUTCOME_LABEL, FOLLOW_WORTHY, STAGES, STAGE_LABEL, type Stage } from "@/lib/store";
import s from "./followup.module.css";

/** The fair ends at 3:30 p.m. local. The 48-hour window starts there. */
const FAIR_END = new Date(`${EVENT.date}T${EVENT.end}:00-04:00`).getTime();
const HOUR = 36e5;

function deadlineFor(visitedAt?: number) {
  return (visitedAt ?? FAIR_END) + 48 * HOUR;
}
function humanLeft(ms: number) {
  if (ms <= 0) return { text: "overdue", urgent: true, over: true };
  const h = Math.floor(ms / HOUR);
  if (h < 1) return { text: `${Math.max(1, Math.round(ms / 6e4))} min left`, urgent: true, over: false };
  if (h < 24) return { text: `${h}h left`, urgent: true, over: false };
  return { text: `${Math.floor(h / 24)}d ${h % 24}h left`, urgent: false, over: false };
}

export default function FollowUp() {
  const { plan, ready, setStage, setNote } = usePlan();
  const [showClosed, setShowClosed] = useState(false);

  const rows = useMemo(() => {
    const now = Date.now();
    return EMPLOYERS
      .filter((e) => plan[e.i]?.visited)
      .map((e) => {
        const st = plan[e.i]!;
        const worth = (st.tags ?? []).filter((t) => FOLLOW_WORTHY.has(t));
        return { e, st, worth, left: deadlineFor(st.visitedAt) - now, stage: st.stage ?? "todo" };
      })
      .sort((a, b) => {
        const aOpen = a.stage === "todo" || a.stage === "applied";
        const bOpen = b.stage === "todo" || b.stage === "applied";
        if (aOpen !== bOpen) return aOpen ? -1 : 1;
        if (a.worth.length !== b.worth.length) return b.worth.length - a.worth.length;
        return a.left - b.left;
      });
  }, [plan]);

  const open = rows.filter((r) => r.stage !== "closed");
  const closed = rows.filter((r) => r.stage === "closed");
  const shown = showClosed ? rows : open;
  const urgent = open.filter((r) => r.worth.length > 0 && r.left < 48 * HOUR).length;

  if (!ready) return <main className="wrap"><p className={s.quiet}>Loading…</p></main>;

  if (rows.length === 0) {
    return (
      <main className={`wrap ${s.empty}`}>
        <p className="eyebrow">Follow-up</p>
        <h1 className="display" style={{ fontSize: 26, margin: "8px 0 12px", lineHeight: 1.12 }}>
          Nothing to follow up on yet
        </h1>
        <p style={{ color: "var(--ink-2)", margin: "0 0 24px", lineHeight: 1.55 }}>
          Every booth you mark as visited shows up here after the fair, with what you
          captured and a 48-hour deadline to reach out. That window is where job fairs
          are actually won.
        </p>
        <Link className="btn btn--primary" href="/route">Back to my route</Link>
      </main>
    );
  }

  return (
    <>
      <header className={s.top}>
        <div className="wrap">
          <p className="eyebrow" style={{ color: "inherit", opacity: .6 }}>Follow-up</p>
          <h1 className={`display ${s.h1}`}>
            {open.length} {open.length === 1 ? "person" : "people"} to reach
          </h1>
          <p className={s.lead}>
            {urgent > 0
              ? `${urgent} still inside the 48-hour window. That's the one that matters — after two days a recruiter has met four hundred people.`
              : "Sorted by who you owe the most: strongest conversations first, then by how little time is left."}
          </p>
        </div>
      </header>

      <main className="wrap">
        {closed.length > 0 && (
          <button className={s.toggle} onClick={() => setShowClosed(!showClosed)}>
            {showClosed ? "Hide" : "Show"} {closed.length} closed
          </button>
        )}

        <ul className={s.list}>
          {shown.map(({ e, st, worth, left, stage }) => {
            const t = humanLeft(left);
            const done = stage !== "todo";
            return (
              <li key={e.i} className={s.card} data-done={done}>
                <div className={s.head}>
                  <div className={s.headMain}>
                    <Link href={`/e/${e.i}`} className={s.name}>{e.n}</Link>
                    <p className={s.meta}>
                      {e.b && <span className="mono">{e.b}</span>}
                      {e.b && " · "}{e.sec}
                    </p>
                  </div>
                  {worth.length > 0 && stage === "todo" && (
                    <span className={s.clock} data-urgent={t.urgent} data-over={t.over}>{t.text}</span>
                  )}
                </div>

                {worth.length > 0 && (
                  <div className={s.tags}>
                    {worth.map((w) => <span key={w} className={s.tag}>{OUTCOME_LABEL[w]}</span>)}
                  </div>
                )}

                <div className={s.stages} role="group" aria-label={`Status for ${e.n}`}>
                  {STAGES.map((sg) => (
                    <button key={sg.k} className={s.stageBtn} aria-pressed={stage === sg.k}
                      onClick={() => setStage(e.i, sg.k as Stage)}>
                      {sg.label}
                    </button>
                  ))}
                </div>

                <div className={s.actions}>
                  <a className={s.link} href={e.w} target="_blank" rel="noopener noreferrer">
                    {host(e.w)} ↗
                  </a>
                </div>

                <label className={s.noteLabel} htmlFor={`note-${e.i}`}>Your notes</label>
                <textarea id={`note-${e.i}`} className={s.editNote} rows={2} value={st.note}
                  placeholder="What you talked about, and what you'll say when you reach out…"
                  onChange={(ev) => setNote(e.i, ev.target.value)} />
              </li>
            );
          })}
        </ul>

        <p className={s.footNote}>
          All of this lives on this phone only. Nothing is sent anywhere, and clearing your
          browser data clears it &mdash; so copy anything you can&rsquo;t afford to lose
          somewhere safe.
        </p>
      </main>
    </>
  );
}
