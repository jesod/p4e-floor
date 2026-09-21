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

// Booths sit 52 apart across a back-to-back island and 62 down a column, so 46
// is the widest square that still leaves a visible gap — and it is wide enough
// to carry a three-character code like L15 inside it.
const BOOTH = 46;      // el cuadrado dibujado
// The touch area cannot exceed the 52-unit column pitch: overlapping targets
// are resolved by paint order, so a wider one silently steals taps aimed at the
// neighbouring booth — and the bigger square makes that easier to hit.
const HIT = 52;
const STOP_R = 14;     // la chapa de parada, sobre la esquina superior derecha
const LANE_W = 88;     // ancho del carril de pasillo

/** Encuadre fijo: cubre los booths y deja entrar la Hall Entrance, que es la referencia. */
const FRAME = { x: 112, y: 560, w: 1620, h: 1580 };

const ZOOM_MIN = 1;    // 1 = the whole plan across the viewport
const ZOOM_MAX = 5;
const ZOOM_STEP = 1.6;

export default function Floor() {
  const { plan, ready, toggleSaved } = usePlan();
  const { profile } = useProfile();
  const [sel, setSel] = useState<string | null>(null);
  const [zoom, setZoom] = useState(ZOOM_MIN);
  const [showMatches, setShowMatches] = useState(true);
  const viewport = useRef<HTMLDivElement>(null);
  /** Where to re-centre once the new zoom has been laid out, as 0..1 of the canvas. */
  const anchor = useRef<{ x: number; y: number } | null>(null);
  const drag = useRef<{ x: number; y: number; sx: number; sy: number } | null>(null);
  const [grabbing, setGrabbing] = useState(false);
  /** Set once a pointer has travelled far enough to be a pan, so it isn't a tap. */
  const panned = useRef(false);

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

  /**
   * Zoom about the middle of what you are already looking at, so the floor does
   * not jump under you. The first step up from Fit is the exception: centring on
   * the middle of the plan would leave you staring at empty floor, so we aim at
   * your first stop instead.
   */
  const applyZoom = (next: number) => {
    const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
    if (z === zoom) return;
    const el = viewport.current;
    const first = route[0] ?? EMPLOYERS.find((e) => e.x != null);
    if (zoom === ZOOM_MIN && z > ZOOM_MIN && first?.x != null && first?.y != null) {
      anchor.current = {
        x: (first.x - FRAME.x) / FRAME.w,
        y: (first.y - FRAME.y) / FRAME.h,
      };
    } else if (el && el.scrollWidth > 0 && el.scrollHeight > 0) {
      anchor.current = {
        x: (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth,
        y: (el.scrollTop + el.clientHeight / 2) / el.scrollHeight,
      };
    }
    setZoom(z);
  };

  useEffect(() => {
    const el = viewport.current;
    const a = anchor.current;
    anchor.current = null;
    if (!el || !a) return;
    el.scrollLeft = Math.max(0, a.x * el.scrollWidth - el.clientWidth / 2);
    el.scrollTop = Math.max(0, a.y * el.scrollHeight - el.clientHeight / 2);
  }, [zoom]);

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
            <div className={s.zoomers} role="group" aria-label="Zoom">
              <button onClick={() => applyZoom(zoom / ZOOM_STEP)}
                disabled={zoom <= ZOOM_MIN} aria-label="Zoom out">−</button>
              <button onClick={() => applyZoom(ZOOM_MIN)} disabled={zoom === ZOOM_MIN}>Fit</button>
              <button onClick={() => applyZoom(zoom * ZOOM_STEP)}
                disabled={zoom >= ZOOM_MAX} aria-label="Zoom in">+</button>
            </div>
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

        <div
          className={s.viewport}
          ref={viewport}
          data-zoomed={zoom > ZOOM_MIN}
          data-drag={grabbing}
          /* The frame's own proportions, so its height never depends on how far
             the plan inside is zoomed. */
          style={{ aspectRatio: `${FRAME.w} / ${FRAME.h}` }}
          onPointerDown={(ev) => {
            panned.current = false;
            if (zoom <= ZOOM_MIN) return;  // fitted: nothing to pan, leave the page alone
            const el = viewport.current;
            if (!el) return;
            drag.current = { x: ev.clientX, y: ev.clientY, sx: el.scrollLeft, sy: el.scrollTop };
          }}
          onPointerMove={(ev) => {
            const d = drag.current;
            const el = viewport.current;
            if (!d || !el) return;
            const dx = ev.clientX - d.x;
            const dy = ev.clientY - d.y;
            // Commit to a pan only once the pointer has really travelled. Capturing
            // on pointerdown would retarget the click away from the booth, so a
            // plain tap would stop selecting anything. Touch pointers are captured
            // implicitly by the browser and reach us by bubbling; a mouse needs to
            // be captured or the drag dies the moment it leaves the frame.
            if (!panned.current) {
              if (Math.abs(dx) <= 4 && Math.abs(dy) <= 4) return;
              panned.current = true;
              setGrabbing(true);
              if (ev.pointerType === "mouse") el.setPointerCapture(ev.pointerId);
            }
            el.scrollLeft = d.sx - dx;
            el.scrollTop = d.sy - dy;
          }}
          onPointerUp={(ev) => {
            drag.current = null;
            setGrabbing(false);
            const el = viewport.current;
            if (el?.hasPointerCapture(ev.pointerId)) el.releasePointerCapture(ev.pointerId);
          }}
          onPointerCancel={() => { drag.current = null; setGrabbing(false); }}
        >
          {/* Growing both axes by the same factor is what makes it a zoom: the SVG
              fills the canvas and scales its drawing uniformly to match. */}
          <div className={s.canvas} style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}>
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
                  onClick={() => { if (!panned.current) setSel(sel === e.i ? null : e.i); }}>
                  <rect x={e.x - HIT / 2} y={e.y - HIT / 2} width={HIT} height={HIT} fill="transparent" />
                  <rect x={e.x - BOOTH / 2} y={e.y - BOOTH / 2} width={BOOTH} height={BOOTH}
                    rx={6} fill={fill} className={s.boothFill}
                    stroke={isMatch && !stop ? "var(--court)" : "none"} strokeWidth={isMatch ? 4 : 0} />
                  {/* The code rides inside the square; its colour follows the
                      fill so it stays readable on court blue and on amber. */}
                  <text x={e.x} y={e.y + 7} textAnchor="middle"
                    className={`${s.code} ${stop ? s.codeOnCourt : blocked ? s.codeOnFlag : ""}`}>
                    {e.b}
                  </text>
                  <title>{e.b} — {e.n}</title>
                </g>
              );
            })}

            {/* Tus paradas: una chapa pequeña en la esquina, para no tapar el código */}
            {ready && route.map((e, i) => (e.x == null || e.y == null) ? null : (
              <g key={e.i} pointerEvents="none">
                {/* Pulled in from the corner: paired columns are only 52 apart,
                    so a badge centred on the corner would sit on its neighbour. */}
                <circle cx={e.x + BOOTH / 2 - 5} cy={e.y - BOOTH / 2 + 5} r={STOP_R}
                  fill="var(--court)" stroke="var(--surface)" strokeWidth={4} />
                <text x={e.x + BOOTH / 2 - 5} y={e.y - BOOTH / 2 + 11} textAnchor="middle"
                  className={s.num}>{i + 1}</text>
              </g>
            ))}
          </svg>
          </div>
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
