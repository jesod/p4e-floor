"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProfile, AUTHS, SEEKING, FIELDS, EMPTY_PROFILE, type Profile } from "@/lib/profile";
import { buildPresets } from "@/lib/presets";
import { usePlan } from "@/lib/store";
import { byId } from "@/lib/data";
import BackupPanel from "@/components/BackupPanel";
import s from "./profile.module.css";

export default function ProfilePage() {
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

  if (!ready) return <main className="wrap"><p className={s.quiet}>Loading…</p></main>;

  const apply = (ids: string[]) => {
    for (const id of ids) if (!plan[id]?.saved) toggleSaved(id);
    save({ ...p, done: true });
    router.push("/route");
  };

  return (
    <>
      <header className={s.top}>
        <div className="wrap">
          <p className="eyebrow" style={{ color: "inherit", opacity: .6 }}>Your profile</p>
          <h1 className={`display ${s.h1}`}>Tell us who you are</h1>
          <p className={s.lead}>
            We use this to build routes you can walk as-is. Everything stays on this phone
            and you can delete it whenever you want.
          </p>
        </div>
      </header>

      <main className="wrap">
        <Q n={1} title="What are you looking for?" hint="Pick as many as apply.">
          {SEEKING.map((o) => (
            <button key={o.k} className="chip" aria-pressed={p.seeking.includes(o.k)}
              onClick={() => toggle("seeking", o.k)}>{o.label}</button>
          ))}
        </Q>

        <Q n={2} title="What lets you work in Canada?"
           hint="This is the only filter that takes employers away from you. We check it against the published policies we were able to verify.">
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
              That rules out <b>{excluded.length}</b>{" "}
              {excluded.length === 1 ? "employer" : "employers"}:{" "}
              {excluded.map((e, i) => (
                <span key={e.i}>
                  {i > 0 && ", "}
                  <Link href={`/e/${e.i}`}>{e.n}</Link>
                </span>
              ))}
              . You can still open them — they just won’t appear in the suggested routes.
            </p>
          )}
        </Q>

        <Q n={3} title="What fields are you in?" hint="Pick the ones that describe you. Skip it and we’ll show you everything.">
          {FIELDS.map((f) => (
            <button key={f.k} className="chip" aria-pressed={p.fields.includes(f.k)}
              onClick={() => toggle("fields", f.k)}>{f.label}</button>
          ))}
          {p.fields.includes("design") && (
            <p className={s.caveat}>
              A heads-up on <b>Design & UX</b>: P4E has no official product-design category, so
              here we go by what each company says on its own site. Every match shows you the quote.
            </p>
          )}
        </Q>

        <Q n={4} title="Do you want to stay in the region?" hint="Uses the head offices we could verify against a source.">
          <button className="chip" aria-pressed={p.localOnly} onClick={() => set({ localOnly: !p.localOnly })}>
            Favour employers based in KW
          </button>
        </Q>

        <section className={s.results}>
          <h2 className="eyebrow">Routes ready for you</h2>
          {presets.length === 0 ? (
            <p className={s.none}>
              Nothing is left with that combination. Try fewer conditions — for example,
              without picking a role type.
            </p>
          ) : (
            <>
              <p className={s.totalLine}>
                <b className="mono">{total}</b> employers clear your filters.
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
                    {pr.ids.length > 5 && ` · and ${pr.ids.length - 5} more`}
                  </p>
                  <button className="btn btn--primary btn--block" onClick={() => apply(pr.ids)}>
                    Use this route
                  </button>
                </div>
              ))}
            </>
          )}
        </section>

        <div className={s.foot}>
          <button className="btn" onClick={() => { save({ ...p, done: true }); router.push("/"); }}>
            Save and see employers
          </button>
          {(profile.done || draft) && (
            <button className={s.clear} onClick={() => { clear(); setDraft({ ...EMPTY_PROFILE }); }}>
              Delete my profile
            </button>
          )}
        </div>

        <BackupPanel />

        <section className={s.about}>
          <h2 className="eyebrow">About</h2>
          <p className={s.aboutNote}>
            Where every fact in this app comes from, what we verified ourselves, and
            what we deliberately chose not to show.
          </p>
          <Link className={`btn btn--block ${s.aboutLink}`} href="/sources">
            Sources and method
          </Link>
        </section>
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
