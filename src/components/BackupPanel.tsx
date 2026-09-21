"use client";
import { useState } from "react";
import { usePlan, mergePlans, isEmptyStop, normaliseStop, type Plan } from "@/lib/store";
import { useProfile, migrateProfile, type Profile } from "@/lib/profile";
import s from "./BackupPanel.module.css";

type Backup = { app: string; exported: string; plan: Plan; profile?: Profile };

export default function BackupPanel() {
  const { plan, replaceAll, ready } = usePlan();
  const { profile, save: saveProfile } = useProfile();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");

  // Empty stops carry nothing, so leave them out and keep the file readable.
  const kept = Object.fromEntries(
    Object.entries(plan).filter(([, v]) => v && !isEmptyStop(normaliseStop(v)))
  );
  const nStops = Object.keys(kept).length;
  const nContacts = Object.values(kept).reduce((a, v) => a + (v.contacts?.length ?? 0), 0);

  const doExport = async () => {
    const payload: Backup = {
      app: "p4e-floor", exported: new Date().toISOString(),
      plan: kept as Plan, profile,
    };
    const body = JSON.stringify(payload, null, 2);
    try { await navigator.clipboard.writeText(body); setMsg("Copied to the clipboard."); }
    catch { setMsg("Downloaded."); }
    try {
      const url = URL.createObjectURL(new Blob([body], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `p4e-notes-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {}
  };

  const doImport = () => {
    try {
      const parsed = JSON.parse(text) as Backup;
      const incoming = (parsed.plan ?? parsed) as Plan;
      if (!incoming || typeof incoming !== "object") throw new Error("shape");
      const { plan: merged, added } = mergePlans(plan, incoming);
      replaceAll(merged);
      // Someone else's answers shouldn't quietly replace yours.
      let note = "";
      // Through the same migration as stored profiles: a file exported by an
      // older build answers question 4 with `localOnly`, not with regions.
      if (parsed.profile && !profile.done) { saveProfile(migrateProfile(parsed.profile)); note = " Profile restored."; }
      else if (parsed.profile) note = " Your own profile was kept.";
      setText(""); setOpen(false);
      setMsg(`Merged ${Object.keys(incoming).length} employers, ${added} new contacts.${note}`);
    } catch {
      setMsg("That doesn’t look like an exported backup.");
    }
  };

  if (!ready) return null;

  return (
    <section className={s.panel}>
      <h2 className="eyebrow">Backup</h2>
      <p className={s.note}>
        Everything you’ve written lives in this browser only. Export a copy so a cleared
        cache can’t take it with it — and so you and a friend can combine what you each
        found out afterwards.
      </p>
      <p className={s.count}>
        <b className="mono">{nStops}</b> {nStops === 1 ? "employer" : "employers"} with
        something saved · <b className="mono">{nContacts}</b> {nContacts === 1 ? "contact" : "contacts"}
      </p>

      <div className={s.row}>
        <button className="btn" onClick={doExport} disabled={nStops === 0}>Export</button>
        <button className="btn" onClick={() => { setOpen((v) => !v); setMsg(""); }}>
          {open ? "Cancel" : "Import"}
        </button>
      </div>

      {open && (
        <div className={s.importBox}>
          <textarea className={s.textarea} value={text} rows={5}
            onChange={(ev) => setText(ev.target.value)}
            placeholder="Paste an exported backup here" aria-label="Exported backup" />
          <button className="btn btn--primary btn--block" disabled={!text.trim()} onClick={doImport}>
            Merge it in
          </button>
          <p className={s.note}>Merging only adds. Nothing you already have is overwritten.</p>
        </div>
      )}

      {msg && <p className={s.msg} role="status">{msg}</p>}
    </section>
  );
}
