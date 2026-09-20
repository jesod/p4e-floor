"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Employer } from "@/lib/types";
import { HIRING, BLOCKING, ELIGIBILITY, SECURITY, AISLE_LABEL, PAIRED, host } from "@/lib/data";
import { usePlan } from "@/lib/store";
import s from "./detail.module.css";

export default function Detail({ e }: { e: Employer }) {
  const router = useRouter();
  const { get, toggleSaved, toggleVisited, setNote, ready } = usePlan();
  const st = get(e.i);
  const blocked = e.el && BLOCKING.has(e.el.v);

  return (
    <>
      <div className={s.navbar}>
        <div className={`wrap ${s.navIn}`}>
          <button className={s.back} onClick={() => router.back()}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14.5 5 8 12l6.5 7" />
            </svg>
            Volver
          </button>
          <button className={s.saveBtn} aria-pressed={ready && st.saved} onClick={() => toggleSaved(e.i)}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"
              fill={ready && st.saved ? "currentColor" : "none"} stroke="currentColor"
              strokeWidth="1.9" strokeLinejoin="round">
              <path d="M6.5 3.8h11a1 1 0 0 1 1 1v15.4l-6.5-4-6.5 4V4.8a1 1 0 0 1 1-1Z" />
            </svg>
            {ready && st.saved ? "En mi recorrido" : "Agregar al recorrido"}
          </button>
        </div>
      </div>

      <header className={s.hero}>
        <div className="wrap">
          <div className={s.heroTop}>
            {e.b ? (
              <div>
                <p className={s.boothLabel}>Booth</p>
                <p className={`mono ${s.booth}`}>{e.b}</p>
              </div>
            ) : (
              <p className={s.noBooth}>Sin booth asignado en el plano de P4E</p>
            )}
            {e.a && (
              <p className={s.where}>
                {AISLE_LABEL[e.a]}
                {e.b && PAIRED[e.b[0]] && <><br />isla con la columna {PAIRED[e.b[0]]}</>}
              </p>
            )}
          </div>
          <h1 className={`display ${s.h1}`}>{e.n}</h1>
          <p className={s.sector}>
            {e.sec}
            {e.hq && <> · {e.hq.c}, {e.hq.r}</>}
          </p>
          <div className="tags">
            {HIRING.filter((h) => e.h[h.i]).map((h) => (
              <span key={h.k} className="tag tag--hire">{h.label}</span>
            ))}
            {e.kw === 1 && <span className="tag tag--kw">Sede local KW</span>}
          </div>
        </div>
      </header>

      <main className={`wrap ${s.main}`}>
        {blocked && (
          <div className="alert" style={{ marginBottom: 22 }}>
            <b>{ELIGIBILITY[e.el!.v]}</b>
            <p className="quote">“{e.el!.q}”</p>
            <p style={{ margin: "9px 0 0" }}>
              <a className="src" href={e.el!.s} target="_blank" rel="noopener noreferrer">
                {host(e.el!.s)} ↗
              </a>
            </p>
          </div>
        )}

        {e.el && !blocked && (
          <Section title="Elegibilidad · verificada con fuente">
            <p className={s.strong}>{ELIGIBILITY[e.el.v]}</p>
            <p className="quote">“{e.el.q}”</p>
            <Source url={e.el.s} />
          </Section>
        )}

        {e.sr && (
          <Section title="Requisito de seguridad">
            <p className={s.strong}>{SECURITY[e.sr.v] ?? e.sr.v}</p>
            <p className={s.note}>Aplica por puesto. No implica restricción de nacionalidad.</p>
            <p className="quote">“{e.sr.q}”</p>
            <Source url={e.sr.s} />
          </Section>
        )}

        <Section title="Categorías de puesto · PDF oficial de P4E">
          {e.c.length ? (
            <div className="tags" style={{ marginTop: 0 }}>
              {e.c.map((c) => <span key={c} className="tag">{c}</span>)}
            </div>
          ) : (
            <p className={s.note}>No figura en el PDF de categorías de puesto de P4E.</p>
          )}
        </Section>

        {e.t && (
          <Section title="Cómo se describe la empresa">
            <p style={{ margin: 0 }}>{e.t}</p>
            <Source url={e.w} />
          </Section>
        )}

        {e.sd && e.sd.length > 0 && (
          <Section title="Sectores a los que dice servir">
            <p className={s.note}>
              Sale del texto de su propio sitio. Describe a quién le <b>vende</b> la empresa, no
              necesariamente qué perfiles <b>contrata</b>.
            </p>
            {e.sd.slice(0, 5).map((d) => (
              <div key={d.d} className={s.domain}>
                <p className={s.strong}>{d.d}</p>
                <p className="quote">“{d.q}”</p>
                <Source url={d.s} />
              </div>
            ))}
          </Section>
        )}

        {e.hq && (
          <Section title="Sede · verificada con fuente">
            <p style={{ margin: 0 }}>{e.hq.c}, {e.hq.r}</p>
            <Source url={e.hq.s} />
          </Section>
        )}

        {e.g && e.g.length > 0 && (
          <Section title="Gaps de la fuente oficial">
            {e.g.map((g) => (
              <p key={g} className={s.note} style={{ margin: 0 }}>
                {g === "no_booth_in_floorplan"
                  ? "Aparece en las listas de empleadores de P4E pero no en el floorplan. Confirmá el booth en el mostrador de registro."
                  : "No figura en el PDF de categorías de puesto de P4E."}
              </p>
            ))}
          </Section>
        )}

        <Section title="Tus notas">
          <textarea className={s.textarea} value={st.note} rows={3}
            placeholder="Con quién hablaste, qué te pidieron, qué seguir…"
            onChange={(ev) => setNote(e.i, ev.target.value)} />
          <label className={s.check}>
            <input type="checkbox" checked={ready && st.visited} onChange={() => toggleVisited(e.i)} />
            Ya visité este booth
          </label>
          <p className={s.note} style={{ marginTop: 10 }}>
            Se guarda solo en este teléfono. No se envía a ningún lado.
          </p>
        </Section>

        <p className={s.siteLink}>
          <a href={e.w} target="_blank" rel="noopener noreferrer">{host(e.w)} ↗</a>
        </p>
        <p className={s.backLink}><Link href="/">← Todos los empleadores</Link></p>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={s.section}>
      <h2 className="eyebrow">{title}</h2>
      {children}
    </section>
  );
}
function Source({ url }: { url: string }) {
  return (
    <p style={{ margin: "8px 0 0" }}>
      <a className="src" href={url} target="_blank" rel="noopener noreferrer">{host(url)} ↗</a>
    </p>
  );
}
