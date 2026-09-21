import { ELIGIBILITY, AISLE_LABEL, HIRING } from "./data";
import { OUTCOME_LABEL, STAGE_LABEL, normaliseStop, type Plan, type Stop } from "./store";
import type { Employer } from "./types";

/**
 * Everything the app knows about a booth, as one row you can open in Excel,
 * Numbers or Sheets. The point is that nothing you wrote down is trapped in
 * this browser: the JSON backup is for putting it back into the app, this is
 * for reading it anywhere, forever, without us.
 */

const MY_EL: Record<string, string> = {
  open: "No PR needed",
  needs: "Needs PR or citizenship",
};

/** Sorts correctly as text, unlike anything locale-formatted. */
function stamp(ms?: number): string {
  if (!ms) return "";
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * A cell that opens as a formula is a real hazard in a file built from text
 * other people handed you at a booth, so anything a spreadsheet would evaluate
 * gets a leading apostrophe — the "this is text" marker, which Excel, Numbers
 * and Sheets all honour and none of them display.
 *
 * Every leading "-", not just the suspicious-looking ones: the textbook payload
 * is `-2+3+cmd|...`, so "a minus followed by a digit is just arithmetic" is
 * precisely the gap worth not leaving.
 */
function defuse(v: string): string {
  return /^[=+@\-\t\r]/.test(v) ? `'${v}` : v;
}

/** RFC 4180. Quote every field: notes carry commas, quotes and line breaks. */
const cell = (v: string | number | undefined | null) =>
  `"${defuse(String(v ?? "")).replace(/"/g, '""')}"`;

export const HEADERS = [
  "Booth", "Employer", "Sector", "Aisle",
  "On my route", "Visited", "Visited at",
  "What happened", "Follow-up stage",
  "Work authorisation (sourced)", "Work authorisation (what I was told)",
  "My note", "Contacts", "Hiring", "Job categories", "Head office", "Website",
] as const;

const yesNo = (b: boolean) => (b ? "Yes" : "No");

function row(e: Employer, st: Stop): string[] {
  return [
    e.b ?? "",
    e.n,
    e.sec,
    e.a ? AISLE_LABEL[e.a] ?? e.a : "",
    yesNo(st.saved),
    yesNo(st.visited),
    stamp(st.visitedAt),
    st.tags.map((t) => OUTCOME_LABEL[t] ?? t).join("; "),
    st.stage ? STAGE_LABEL[st.stage] ?? st.stage : "",
    e.el ? ELIGIBILITY[e.el.v] ?? e.el.v : "",
    st.myEl ? MY_EL[st.myEl] ?? st.myEl : "",
    st.note,
    // One line per contact would need a second sheet; a CSV has one shape, and
    // the employer is the row you look things up by.
    st.contacts
      .map((c) => [c.name || "Someone at the booth", c.role && `(${c.role})`, c.info && `— ${c.info}`]
        .filter(Boolean).join(" "))
      .join("; "),
    HIRING.filter((h) => e.h[h.i]).map((h) => h.label).join("; "),
    e.c.join("; "),
    e.hq ? `${e.hq.c}, ${e.hq.r}` : "",
    e.w,
  ];
}

/**
 * `numbered` prefixes a Stop column: walking order is the whole point of the
 * route export, and it is lost the moment the rows land in a spreadsheet.
 */
export function toCsv(employers: Employer[], plan: Plan, numbered = false): string {
  const head = numbered ? ["Stop", ...HEADERS] : [...HEADERS];
  const lines = [head.map(cell).join(",")];
  employers.forEach((e, i) => {
    const r = row(e, normaliseStop(plan[e.i]));
    lines.push((numbered ? [String(i + 1), ...r] : r).map(cell).join(","));
  });
  // CRLF per the spec, and a BOM so Excel reads it as UTF-8 instead of
  // mangling every accented company name.
  return "﻿" + lines.join("\r\n") + "\r\n";
}

/** Same download path the JSON backup uses, with a date in the name. */
export function download(base: string, body: string, mime: string): boolean {
  try {
    const url = URL.createObjectURL(new Blob([body], { type: mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${base}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}
