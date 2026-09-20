"use client";
import { useState } from "react";
import { EMPLOYERS } from "@/lib/data";
import s from "./HereNow.module.css";

const AT_BOOTH = new Map(EMPLOYERS.filter((e) => e.b).map((e) => [e.b as string, e.n]));
const BOOTHS = [...AT_BOOTH.keys()].sort((a, b) =>
  a[0] === b[0] ? parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10) : a.localeCompare(b));

export default function HereNow({ value, onChange }:
  { value: string | null; onChange: (b: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const atName = value ? AT_BOOTH.get(value) : null;

  const commit = (raw: string) => {
    const code = raw.trim().toUpperCase();
    if (!code) { onChange(null); setOpen(false); setDraft(""); return; }
    if (BOOTHS.includes(code)) { onChange(code); setOpen(false); setDraft(""); }
  };

  if (value && !open) {
    return (
      <div className={s.active}>
        <div>
          <p className={s.activeLabel}>Reordered from booth <b className="mono">{value}</b></p>
          {atName && <p className={s.activeSub}>{atName}</p>}
        </div>
        <button className={s.reset} onClick={() => { onChange(null); setDraft(""); }}>
          Undo
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button className={s.trigger} onClick={() => setOpen(true)}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" />
        </svg>
        I&rsquo;m somewhere else &mdash; reorder from where I am
      </button>
    );
  }

  return (
    <div className={s.panel}>
      <label className={s.label} htmlFor="here-booth">
        Which booth are you at or next to?
      </label>
      <div className={s.row}>
        <input id="here-booth" list="booth-codes" className={s.input}
          value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(draft); }}
          placeholder="H11" autoComplete="off" autoCapitalize="characters"
          inputMode="text" enterKeyHint="done" />
        <datalist id="booth-codes">
          {BOOTHS.map((b) => (
            <option key={b} value={b}>{AT_BOOTH.get(b)}</option>
          ))}
        </datalist>
        <button className="btn btn--primary" onClick={() => commit(draft)}>Use it</button>
      </div>
      <p className={s.hint}>
        We&rsquo;ll carry on the sweep from there and leave whatever you skipped for the end.
      </p>
      <button className={s.cancel} onClick={() => { setOpen(false); setDraft(""); }}>Cancel</button>
    </div>
  );
}
