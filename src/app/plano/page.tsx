"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { EMPLOYERS, FLOORPLAN, byWalk, BLOCKING, HIRING } from "@/lib/data";
import { usePlan } from "@/lib/store";
import s from "./plano.module.css";

const PAD = 130;
const BOOTH = 34;
const HIT = 74;   // area de toque invisible: el booth dibujado es chico, el dedo no

export default function Plano() {
  const { plan, ready } = usePlan();
  const [sel, setSel] = useState<string | null>(null);
  const [onlyMine, setOnlyMine] = useState(false);

  const route = useMemo(
    () => EMPLOYERS.filter((e) => plan[e.i]?.saved).sort(byWalk),
    [plan]
  );
  const order = useMemo(() => new Map(route.map((e, i) => [e.i, i + 1])), [route]);
  const selected = sel ? EMPLOYERS.find((e) => e.i === sel) : null;

  // Encuadre elegido a mano: cubre los booths y deja entrar la Hall Entrance,
  // que es por donde llega la gente y es la referencia para orientarse.
  const { x0, y0, w, h } = useMemo(() => {
    const ex = FLOORPLAN.extent;
    const top = 560;
    return { x0: ex.x0 - PAD, y0: top, w: ex.x1 - ex.x0 + PAD * 2, h: ex.y1 + PAD - top };
  }, []);
  const [zoom, setZoom] = useState(false);

  return (
    <>
      <header className={s.top}>
        <div className="wrap">
          <p className="eyebrow" style={{ color: "inherit", opacity: .6 }}>Plano del recinto</p>
          <h1 className={`display ${s.h1}`}>RIM Park</h1>
          <p className={s.lead}>
            Cada booth en su posición real. Tocá uno para ver quién está ahí.
          </p>
        </div>
      </header>

      <main className="wrap">
        <div className={s.controls}>
          <div className={s.chipRow}>
            <button className="chip" aria-pressed={onlyMine} onClick={() => setOnlyMine(!onlyMine)}>
              Solo mi recorrido<span className="n">{ready ? route.length : 0}</span>
            </button>
            <button className="chip" aria-pressed={zoom} onClick={() => setZoom(!zoom)}>
              {zoom ? "Ver todo el piso" : "Ampliar"}
            </button>
          </div>
          <div className={s.legend}>
            <span><i style={{ background: "var(--court)" }} />mi recorrido</span>
            <span><i style={{ background: "var(--flag)" }} />pide ciudadanía o PR</span>
            <span><i style={{ background: "var(--rule)" }} />resto</span>
          </div>
        </div>

        <div className={s.scroll} data-zoom={zoom}>
          <svg viewBox={`${x0} ${y0} ${w} ${h}`} className={s.svg}
            role="img" aria-label="Plano de los booths del recinto">
            {FLOORPLAN.landmarks
              .filter((l) => l.n !== "Employer Loading")
              .filter((l) => l.x >= x0 && l.x <= x0 + w && l.y >= y0 + 30 && l.y <= y0 + h)
              .map((l) => (
                <text key={l.n} x={l.x} y={l.y} className={s.landmark}
                  textAnchor={l.x < 700 ? "start" : "middle"}>{l.n.toUpperCase()}</text>
              ))}
            <text x={x0 + 24} y={y0 + h - 30} className={s.landmark} textAnchor="start">
              ↓ BUS ENTRANCE
            </text>
            {EMPLOYERS.map((e) => {
              if (e.x == null || e.y == null) return null;
              const n = ready ? order.get(e.i) : undefined;
              const blocked = e.el && BLOCKING.has(e.el.v);
              const dim = onlyMine && !n;
              const fill = n ? "var(--court)" : blocked ? "var(--flag)" : "var(--rule)";
              return (
                <g key={e.i} className={s.booth} data-on={sel === e.i}
                  onClick={() => setSel(sel === e.i ? null : e.i)}>
                  <rect x={e.x - HIT / 2} y={e.y - HIT / 2} width={HIT} height={HIT} fill="transparent" />
                  <rect x={e.x - BOOTH / 2} y={e.y - BOOTH / 2} width={BOOTH} height={BOOTH}
                    rx={5} fill={fill} opacity={dim ? .2 : 1} className={s.boothFill} />
                  <title>{e.b} — {e.n}</title>
                </g>
              );
            })}
            {ready && route.map((e, i) => (e.x == null || e.y == null) ? null : (
              <g key={e.i} pointerEvents="none">
                <circle cx={e.x} cy={e.y} r={46} fill="var(--court)" stroke="var(--surface)" strokeWidth={7} />
                <text x={e.x} y={e.y + 19} textAnchor="middle" className={s.num}>{i + 1}</text>
              </g>
            ))}
          </svg>
        </div>

        <p className={s.method}>
          Las posiciones salen de las coordenadas de cada etiqueta de booth en el PDF del floorplan
          de P4E. Es un esquema de ubicación, no un dibujo a escala. Las letras del código son
          <b> columnas del plano, no zonas</b>: D y E, F y G, H e I, J y K son islas de booths
          espalda con espalda.
        </p>
      </main>

      {selected && (
        <div className={s.peek} role="status">
          <div className={`wrap ${s.peekIn}`}>
            <span className="booth booth--sm">{selected.b}</span>
            <div className={s.peekBody}>
              <p className={s.peekName}>{selected.n}</p>
              <p className={s.peekSub}>
                {selected.sec}
                {" · "}
                {HIRING.filter((x) => selected.h[x.i]).map((x) => x.label).join(", ") || "sin tipo declarado"}
              </p>
            </div>
            <Link href={`/e/${selected.i}`} className="btn" style={{ minHeight: 40, padding: "0 13px" }}>
              Ver
            </Link>
            <button className={s.peekClose} onClick={() => setSel(null)} aria-label="Cerrar">✕</button>
          </div>
        </div>
      )}
    </>
  );
}
