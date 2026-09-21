"use client";
import { useState } from "react";
import { usePlan, normaliseStop } from "@/lib/store";
import { toCsv, download } from "@/lib/sheet";
import type { Employer } from "@/lib/types";
import s from "./SheetExport.module.css";

/**
 * A spreadsheet of what you wrote down, saved to the phone. The JSON backup
 * next to it exists to put your notes back into this app; this one exists so
 * they outlive it — openable in Excel, Numbers or Sheets, by you, with no app
 * in the way.
 */
export default function SheetExport({ employers, file, title, note, numbered }: {
  employers: Employer[];
  /** Filename stem; the date is appended. */
  file: string;
  title: string;
  note: string;
  /** Adds a Stop column: walking order is lost once the rows are in a sheet. */
  numbered?: boolean;
}) {
  const { plan, ready } = usePlan();
  const [msg, setMsg] = useState("");

  if (!ready || employers.length === 0) return null;

  const contacts = employers.reduce((n, e) => n + normaliseStop(plan[e.i]).contacts.length, 0);

  return (
    <section className={s.panel}>
      <h2 className="eyebrow">{title}</h2>
      <p className={s.note}>{note}</p>
      <p className={s.count}>
        <b className="mono">{employers.length}</b> {employers.length === 1 ? "row" : "rows"}
        {contacts > 0 && <> · <b className="mono">{contacts}</b> {contacts === 1 ? "contact" : "contacts"}</>}
        {" "}· CSV
      </p>
      <button className="btn btn--block" onClick={() => {
        const ok = download(file, toCsv(employers, plan, numbered), "text/csv;charset=utf-8");
        setMsg(ok
          ? "Saved. Look in your Downloads, or in Files on an iPhone."
          : "This browser wouldn’t save the file. Try the JSON backup on the Profile tab instead.");
      }}>
        Download the spreadsheet
      </button>
      {msg && <p className={s.msg} role="status">{msg}</p>}
    </section>
  );
}
