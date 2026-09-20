"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import EmployerRow from "@/components/EmployerRow";
import { EMPLOYERS, byWalk, AISLE_ORDER, AISLE_LABEL, BLOCKING, ELIGIBILITY, host } from "@/lib/data";
import { usePlan } from "@/lib/store";
import s from "./ruta.module.css";

export default function Ruta() {
  const { plan, get, ready, toggleVisited, setNote, reset } = usePlan();
  const [focus, setFocus] = useState(false);

  const route = useMemo(
    () => EMPLOYERS.filter((e) => plan[e.i]?.saved).sort(byWalk),
    [plan]
  );
  const done = route.filter((e) => plan[e.i]?.visited).length;
  const next = route.find((e) => !plan[e.i]?.visited);

  // El riel: cuántas paradas tuyas caen en cada pasillo real del recinto.
  const rail = useMemo(
    () => AISLE_ORDER.map((id) => {
      const inAisle = route.filter((e) => e.a === id);
      return { id, total: inAisle.length, done: inAisle.filter((e) => plan[e.i]?.visited).length };
    }),
    [route, plan]
  );

  if (!ready) return <main className="wrap"><p className={s.quiet}>Cargando tu recorrido…</p></main>;

  if (route.length === 0) {
    return (
      <main className={`wrap ${s.empty}`}>
        <p className="eyebrow">Mi recorrido</p>
        <h1 className="display" style={{ fontSize: 27, margin: "8px 0 12px", lineHeight: 1.12 }}>
          Todavía no elegiste ningún booth
        </h1>
        <p style={{ color: "var(--ink-2)", margin: "0 0 24px", lineHeight: 1.55 }}>
          Marcá empleadores con el señalador y acá te los ordenamos en el orden real
          en que conviene caminarlos: pasillo por pasillo, sin volver sobre tus pasos.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link className="btn btn--primary" href="/perfil">Armarlo en 4 preguntas</Link>
          <Link className="btn" href="/">Elegirlos a mano</Link>
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
            <button className={s.close} onClick={() => setFocus(false)} aria-label="Salir del recorrido">
              ✕ Salir
            </button>
            <p className={`mono ${s.pos}`}>{pos} / {route.length}</p>
          </div>
          <Rail rail={rail} activeAisle={next.a} />

          <div className={s.card}>
            <p className={s.aisle}>{next.a ? AISLE_LABEL[next.a] : "Sin ubicación"}</p>
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
              placeholder="Con quién hablaste, qué te pidieron…"
              onChange={(ev) => setNote(next.i, ev.target.value)} />
            <p className={s.detailLink}><Link href={`/e/${next.i}`}>Ver ficha completa →</Link></p>
          </div>
        </div>

        <div className={s.actions}>
          <div className={`wrap ${s.actionsIn}`}>
            <button className="btn" onClick={() => {
              const after = route.slice(pos);
              const skip = after.find((e) => !plan[e.i]?.visited);
              if (!skip) setFocus(false);
              else toggleVisited(next.i);
            }}>Saltar</button>
            <button className="btn btn--primary" style={{ flex: 1 }} onClick={() => toggleVisited(next.i)}>
              Ya lo visité
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
          <p className="eyebrow" style={{ color: "inherit", opacity: .6 }}>Mi recorrido</p>
          <h1 className={`display ${s.h1}`}>
            {route.length} {route.length === 1 ? "parada" : "paradas"}
          </h1>
          <p className={s.lead}>
            En orden real de barrido: pasillo por pasillo, alternando el sentido.
            Así no volvés sobre tus pasos.
          </p>
          <Rail rail={rail} dark />
          <p className={`mono ${s.progress}`}>{done} de {route.length} visitados</p>
        </div>
      </header>

      <main className="wrap">
        {next && (
          <div className={s.cta}>
            <button className="btn btn--primary btn--block" onClick={() => setFocus(true)}>
              {done === 0 ? "Empezar el recorrido" : "Seguir desde el booth " + (next.b ?? "—")}
            </button>
          </div>
        )}
        <ul className={s.list}>
          {route.map((e, i) => <EmployerRow key={e.i} e={e} stop={i + 1} />)}
        </ul>
        <button className={s.reset} onClick={() => {
          if (confirm("¿Borrar tu recorrido, notas y marcas de visitado?")) reset();
        }}>Borrar mi recorrido</button>
      </main>
    </>
  );
}

const RAIL_SHORT: Record<string, string> = {
  P0: "Entr", P1: "P1", P2: "P2", P3: "P3", P4: "P4", P5: "P5",
};

/** Cada celda es un pasillo real del recinto; su ancho es cuántas paradas tuyas caen ahí. */
function Rail({ rail, dark, activeAisle }:
  { rail: { id: string; total: number; done: number }[]; dark?: boolean; activeAisle?: string }) {
  const max = Math.max(1, ...rail.map((r) => r.total));
  const total = rail.reduce((a, r) => a + r.total, 0);
  return (
    <div className={s.railWrap} data-dark={dark}>
      <p className={s.railTitle}>
        Tus paradas por pasillo <span aria-hidden="true">·</span> en el orden en que los vas a caminar
      </p>
      <div className={s.rail}
        role="img"
        aria-label={`Tus ${total} paradas repartidas por pasillo: ` +
          rail.map((r) => `${AISLE_LABEL[r.id]}, ${r.total} ${r.total === 1 ? "parada" : "paradas"}, ${r.done} visitadas`).join("; ")}>
        {rail.map((r) => (
          <div key={r.id} className={s.railCell} data-active={r.id === activeAisle}
            data-empty={r.total === 0} style={{ flexGrow: Math.max(0.5, r.total / max) }}>
            <div className={s.railBar}>
              <div className={s.railFill}
                style={{ width: r.total ? `${(r.done / r.total) * 100}%` : "0%" }} />
            </div>
            <span className={s.railName}>{RAIL_SHORT[r.id]}</span>
            <span className={`mono ${s.railN}`}>{r.total || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
