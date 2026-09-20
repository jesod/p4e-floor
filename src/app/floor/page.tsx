"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  EMPLOYERS, FLOORPLAN, byWalk, BLOCKING, ELIGIBILITY, HIRING,
  AISLE_X, AISLE_ORDER,
} from "@/lib/data";
import { usePlan } from "@/lib/store";
import { useProfile } from "@/lib/profile";
import { scoreAll } from "@/lib/presets";
import s from "./floor.module.css";

const BOOTH = 34;      // el cuadrado dibujado
const HIT = 76;        // el área de toque: el dedo es más grande que el cuadrado
const LANE_W = 88;     // ancho del carril de pasillo

/** Encuadre fijo: cubre los booths y deja entrar la Hall Entrance, que es la referencia. */
const FRAME = { x: 112, y: 560, w: 1620, h: 1580 };

export default function Floor() {
  const { plan, ready, toggleSaved } = usePlan();
  const { profile } = useProfile();
  const [sel, setSel] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  const [showMatches, setShowMatches] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);

  const route = useMemo(() => EMPLOYERS.filter((e) => plan[e.i]?.saved).sort(byWalk), [plan]);
  const order = useMemo(() => new Map(route.map((e, i) => [e.i, i + 1])), [route]);

  const matchIds = useMemo(() => {
    if (!profile.done) return null;
    return new Set(scoreAll(profile).hits.map((h) => h.e.i));
  }, [profile]);

  const selected = sel ? EMPLOYERS.find((e) => e.i === sel) : null;
  const selStop = selected ? order.get(selected.i) : undefined;

  const path = useMemo(() => {
    const pts = route.filter((e) => e.x != null && e.y != null);
    return pts.length > 1 ? pts.map((e) => `${e.x},${e.y}`).join(" ") : null;
  }, [route]);

  const lanes = useMemo(
    () => AISLE_ORDER.filter((id) => id !== "P0").map((id, i) => ({ id, x: AISLE_X[id], n: i + 1 })),
    []
  );

  // Al ampliar, el plano es mas ancho que la pantalla. Arrancar en el borde izquierdo
  // deja al usuario mirando piso vacio: centramos en su primera parada.
  useEffect(() => {
    const el = scroller.current;
    if (!el || !zoom) return;
    const first = route[0] ?? EMPLOYERS.find((e) => e.x != null);
    if (!first?.x) return;
    const frac = (first.x - FRAME.x) / FRAME.w;
    el.scrollLeft = Math.max(0, frac * el.scrollWidth - el.clientWidth / 2);
  }, [zoom, route]);

  return (
    <>
      <header className={s.top}>
        <div className="wrap">
          <p className="eyebrow" style={{ color: "inherit", opacity: .6 }}>Floorplan</p>
          <h1 className={`display ${s.h1}`}>RIM Park</h1>
          <p className={s.lead}>
            Every booth where it actually sits. Tap one to see who&rsquo;s there.
          </p>
        </div>
      </header>

      <main className="wrap">
        <div className={s.controls}>
          <div className={s.chipRow}>
            <button className="chip" aria-pressed={zoom} onClick={() => setZoom(!zoom)}>
              {zoom ? "Fit the whole floor" : "Zoom in for booth codes"}
            </button>
            {matchIds && (
              <button className="chip" aria-pressed={showMatches} onClick={() => setShowMatches(!showMatches)}>
                Highlight my matches<span className="n">{matchIds.size}</span>
              </button>
            )}
          </div>
          <div className={s.legend}>
            <span><i style={{ background: "var(--court)" }} />on my route</span>
            {matchIds && showMatches && <span><i style={{ background: "var(--court-wash)", boxShadow: "inset 0 0 0 1.5px var(--court)" }} />fits my profile</span>}
            <span><i style={{ background: "var(--flag)" }} />citizenship or PR</span>
            <span><i style={{ background: "var(--map-dim)" }} />everything else</span>
          </div>
        </div>

        <div className={s.scroll} data-zoom={zoom} ref={scroller}>
          <svg viewBox={`${FRAME.x} ${FRAME.y} ${FRAME.w} ${FRAME.h}`} className={s.svg}
            role="img" aria-label="Floorplan showing every booth in the hall">

            {/* Carriles: por acá se camina. Cada uno sirve las dos columnas que lo flanquean. */}
            {lanes.map((l) => (
              <g key={l.id}>
                <rect x={l.x - LANE_W / 2} y={884} width={LANE_W} height={1146} rx={40}
                  className={s.lane} />
                <circle cx={l.x} cy={838} r={30} className={s.laneBadge} />
                <text x={l.x} y={850} textAnchor="middle" className={s.laneLabel}>{l.n}</text>
              </g>
            ))}

            {/* Referencias del recinto */}
            {FLOORPLAN.landmarks
              .filter((l) => l.n !== "Employer Loading")
              .filter((l) => l.y >= FRAME.y + 20 && l.y <= FRAME.y + FRAME.h - 20)
              .map((l) => (
                <text key={l.n} x={l.x} y={l.y} className={s.landmark}
                  textAnchor={l.x < 700 ? "start" : "middle"}>{l.n.toUpperCase()}</text>
              ))}
            <text x={FRAME.x + 26} y={FRAME.y + FRAME.h - 26} className={s.landmark} textAnchor="start">
              ↓ BUS ENTRANCE
            </text>

            {/* El camino que vas a caminar, en orden */}
            {path && (
              <polyline points={path} className={s.path} fill="none"
                strokeLinecap="round" strokeLinejoin="round" />
            )}

            {EMPLOYERS.map((e) => {
              if (e.x == null || e.y == null) return null;
              const stop = ready ? order.get(e.i) : undefined;
              const isMatch = !!(matchIds && showMatches && matchIds.has(e.i));
              const blocked = e.el && BLOCKING.has(e.el.v);
              const fill = stop ? "var(--court)"
                : blocked ? "var(--flag)"
                : isMatch ? "var(--court-wash)"
                : "var(--map-dim)";
              return (
                <g key={e.i} className={s.booth} data-on={sel === e.i}
                  onClick={() => setSel(sel === e.i ? null : e.i)}>
                  <rect x={e.x - HIT / 2} y={e.y - HIT / 2} width={HIT} height={HIT} fill="transparent" />
                  <rect x={e.x - BOOTH / 2} y={e.y - BOOTH / 2} width={BOOTH} height={BOOTH}
                    rx={5} fill={fill} className={s.boothFill}
                    stroke={isMatch && !stop ? "var(--court)" : "none"} strokeWidth={isMatch ? 4 : 0} />
                  {zoom && !stop && (
                    <text x={e.x} y={e.y + 7} textAnchor="middle" className={s.code}>{e.b}</text>
                  )}
                  <title>{e.b} — {e.n}</title>
                </g>
              );
            })}

            {/* Tus paradas, numeradas en orden de recorrido */}
            {ready && route.map((e, i) => (e.x == null || e.y == null) ? null : (
              <g key={e.i} pointerEvents="none">
                <circle cx={e.x} cy={e.y} r={46} fill="var(--court)"
                  stroke="var(--surface)" strokeWidth={7} />
                <text x={e.x} y={e.y + 19} textAnchor="middle" className={s.num}>{i + 1}</text>
              </g>
            ))}
          </svg>
        </div>

        <p className={s.method}>
          Positions come from the coordinates of every booth label in P4E&rsquo;s floorplan PDF.
          It&rsquo;s a locator diagram, not a scale drawing. The letter in a booth code is a
          <b> column of the plan, not a zone</b>: D and E, F and G, H and I, J and K are
          back-to-back islands, and the numbered lanes are the aisles you actually walk down.
        </p>
      </main>

      {selected && (
        <div className={s.peek} role="status">
          <div className={`wrap ${s.peekIn}`}>
            <span className="booth booth--sm">{selected.b}</span>
            <div className={s.peekBody}>
              <p className={s.peekName}>{selected.n}</p>
              <p className={s.peekSub}>
                {selStop ? `Stop ${selStop} on your route · ` : ""}
                {selected.el && BLOCKING.has(selected.el.v)
                  ? ELIGIBILITY[selected.el.v]
                  : HIRING.filter((x) => selected.h[x.i]).map((x) => x.label).join(", ") || selected.sec}
              </p>
            </div>
            <button className={s.peekSave} aria-pressed={!!selStop}
              aria-label={selStop ? "Remove from my route" : "Add to my route"}
              onClick={() => toggleSaved(selected.i)}>
              <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"
                fill={selStop ? "currentColor" : "none"} stroke="currentColor"
                strokeWidth="2" strokeLinejoin="round">
                <path d="M6.5 3.8h11a1 1 0 0 1 1 1v15.4l-6.5-4-6.5 4V4.8a1 1 0 0 1 1-1Z" />
              </svg>
            </button>
            <Link href={`/e/${selected.i}`} className="btn" style={{ minHeight: 40, padding: "0 13px" }}>
              Open
            </Link>
            <button className={s.peekClose} onClick={() => setSel(null)} aria-label="Close">✕</button>
          </div>
        </div>
      )}
    </>
  );
}
