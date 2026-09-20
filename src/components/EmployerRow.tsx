"use client";
import Link from "next/link";
import type { Employer } from "@/lib/types";
import { HIRING, BLOCKING, ELIGIBILITY, host, type Why } from "@/lib/data";
import { usePlan } from "@/lib/store";
import s from "./EmployerRow.module.css";

export default function EmployerRow({ e, why, stop }: { e: Employer; why?: Why; stop?: number }) {
  const { get, toggleSaved, ready } = usePlan();
  const st = get(e.i);
  const blocked = e.el && BLOCKING.has(e.el.v);

  return (
    <li className={s.row} data-visited={st.visited}>
      <Link href={`/e/${e.i}`} className={s.hit}>
        {e.b ? (
          <span className="booth booth--sm">
            {stop != null && <span className={s.stop}>{stop}</span>}
            {e.b}
          </span>
        ) : (
          <span className="booth booth--sm booth--none">sin booth</span>
        )}
        <span className={s.body}>
          <span className={s.name}>{e.n}</span>
          <span className={s.sub}>
            {e.sec}
            {e.hq && <> · {e.hq.c}, {e.hq.r}</>}
          </span>
          <span className="tags">
            {blocked && <span className="tag tag--flag">{ELIGIBILITY[e.el!.v]}</span>}
            {e.kw === 1 && <span className="tag tag--kw">Sede local KW</span>}
            {HIRING.filter((h) => e.h[h.i]).map((h) => (
              <span key={h.k} className="tag tag--hire">{h.label}</span>
            ))}
          </span>
          {why && (
            <span className={s.why}>
              <b>{why.k}:</b> {why.t}
              {why.s && <> <span className={s.src}>{host(why.s)}</span></>}
            </span>
          )}
        </span>
      </Link>
      <button
        className={s.save}
        aria-pressed={ready && st.saved}
        aria-label={st.saved ? `Quitar ${e.n} de mi recorrido` : `Agregar ${e.n} a mi recorrido`}
        onClick={() => toggleSaved(e.i)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"
          fill={ready && st.saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round">
          <path d="M6.5 3.8h11a1 1 0 0 1 1 1v15.4l-6.5-4-6.5 4V4.8a1 1 0 0 1 1-1Z" />
        </svg>
      </button>
    </li>
  );
}
