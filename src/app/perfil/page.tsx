"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProfile, SCHOOLS, AUTHS, SEEKING, FIELDS, EMPTY_PROFILE, type Profile } from "@/lib/profile";
import { buildPresets } from "@/lib/presets";
import { usePlan } from "@/lib/store";
import { byId } from "@/lib/data";
import s from "./perfil.module.css";

export default function Perfil() {
  const { profile, ready, save, clear } = useProfile();
  const { plan, toggleSaved } = usePlan();
  const router = useRouter();
  const [draft, setDraft] = useState<Profile | null>(null);
  const p = draft ?? profile;
  const set = (patch: Partial<Profile>) => setDraft({ ...p, ...patch, done: true });
  const toggle = <K extends "seeking" | "fields">(key: K, v: string) => {
    const cur = p[key] as string[];
    set({ [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] } as Partial<Profile>);
  };

  const { presets, excluded, total } = useMemo(() => buildPresets(p), [p]);

  if (!ready) return <main className="wrap"><p className={s.quiet}>Cargando…</p></main>;

  const apply = (ids: string[]) => {
    for (const id of ids) if (!plan[id]?.saved) toggleSaved(id);
    save({ ...p, done: true });
    router.push("/ruta");
  };

  return (
    <>
      <header className={s.top}>
        <div className="wrap">
          <p className="eyebrow" style={{ color: "inherit", opacity: .6 }}>Tu perfil</p>
          <h1 className={`display ${s.h1}`}>Decinos quién sos</h1>
          <p className={s.lead}>
            Con esto armamos recorridos listos para usar. Todo se guarda solo en este teléfono
            y podés borrarlo cuando quieras.
          </p>
        </div>
      </header>

      <main className="wrap">
        <Q n={1} title="¿Qué estás buscando?" hint="Podés marcar más de uno.">
          {SEEKING.map((o) => (
            <button key={o.k} className="chip" aria-pressed={p.seeking.includes(o.k)}
              onClick={() => toggle("seeking", o.k)}>{o.label}</button>
          ))}
        </Q>

        <Q n={2} title="¿Con qué podés trabajar en Canadá?"
           hint="Es el único filtro que puede sacarte empleadores de encima. Lo cruzamos contra las políticas publicadas que pudimos verificar.">
          <div className={s.stack}>
            {AUTHS.map((o) => (
              <button key={o.k} className={s.radio} aria-pressed={p.auth === o.k}
                onClick={() => set({ auth: o.k })}>
                <span className={s.radioLabel}>{o.label}</span>
                <span className={s.radioSub}>{o.sub}</span>
              </button>
            ))}
          </div>
          {p.auth && excluded.length > 0 && (
            <p className={s.excluded}>
              Con eso quedan afuera <b>{excluded.length}</b>{" "}
              {excluded.length === 1 ? "empleador" : "empleadores"}:{" "}
              {excluded.map((e, i) => (
                <span key={e.i}>
                  {i > 0 && ", "}
                  <Link href={`/e/${e.i}`}>{e.n}</Link>
                </span>
              ))}
              . Podés verlos igual — solo no entran en los recorridos sugeridos.
            </p>
          )}
        </Q>

        <Q n={3} title="¿En qué áreas estás?" hint="Marcá las que te representen. Sin esto, te mostramos todo.">
          {FIELDS.map((f) => (
            <button key={f.k} className="chip" aria-pressed={p.fields.includes(f.k)}
              onClick={() => toggle("fields", f.k)}>{f.label}</button>
          ))}
          {p.fields.includes("design") && (
            <p className={s.caveat}>
              Ojo con <b>Diseño y UX</b>: P4E no tiene una categoría oficial de diseño de producto,
              así que acá usamos lo que cada empresa dice en su propio sitio. Cada coincidencia
              muestra la cita.
            </p>
          )}
        </Q>

        <Q n={4} title="¿Querés quedarte en la región?" hint="Usa las sedes que pudimos verificar con fuente.">
          <button className="chip" aria-pressed={p.localOnly} onClick={() => set({ localOnly: !p.localOnly })}>
            Priorizar empresas con sede en KW
          </button>
        </Q>

        <section className={s.results}>
          <h2 className="eyebrow">Recorridos listos para vos</h2>
          {presets.length === 0 ? (
            <p className={s.none}>
              Con esa combinación no queda nadie. Probá con menos condiciones —
              por ejemplo, sin marcar un tipo de puesto.
            </p>
          ) : (
            <>
              <p className={s.totalLine}>
                <b className="mono">{total}</b> empleadores pasan tus filtros.
              </p>
              {presets.map((pr) => (
                <div key={pr.k} className={s.preset}>
                  <div className={s.presetHead}>
                    <h3 className={`display ${s.presetTitle}`}>{pr.title}</h3>
                    <span className={`mono ${s.presetN}`}>{pr.count}</span>
                  </div>
                  <p className={s.presetWhy}>{pr.why}</p>
                  <p className={s.presetWho}>
                    {pr.ids.slice(0, 5).map((id) => byId.get(id)?.n).filter(Boolean).join(" · ")}
                    {pr.ids.length > 5 && ` · y ${pr.ids.length - 5} más`}
                  </p>
                  <button className="btn btn--primary btn--block" onClick={() => apply(pr.ids)}>
                    Usar este recorrido
                  </button>
                </div>
              ))}
            </>
          )}
        </section>

        <div className={s.foot}>
          <button className="btn" onClick={() => { save({ ...p, done: true }); router.push("/"); }}>
            Guardar y ver empleadores
          </button>
          {(profile.done || draft) && (
            <button className={s.clear} onClick={() => { clear(); setDraft({ ...EMPTY_PROFILE }); }}>
              Borrar mi perfil
            </button>
          )}
        </div>
      </main>
    </>
  );
}

function Q({ n, title, hint, children }:
  { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className={s.q}>
      <div className={s.qHead}>
        <span className={`mono ${s.qN}`}>{n}</span>
        <div>
          <h2 className={`display ${s.qTitle}`}>{title}</h2>
          {hint && <p className={s.qHint}>{hint}</p>}
        </div>
      </div>
      <div className={s.chips}>{children}</div>
    </section>
  );
}
