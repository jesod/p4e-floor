import { EVENT } from "@/lib/data";
import ThemeToggle from "./ThemeToggle";
import s from "./Masthead.module.css";

export default function Masthead({ lead }: { lead?: string }) {
  return (
    <header className={s.top}>
      <div className="wrap">
        <div className={s.line}>
          <p className="eyebrow" style={{ color: "inherit", opacity: .62, margin: 0 }}>
            {EVENT.organizer}
          </p>
          <ThemeToggle />
        </div>
        <h1 className={`display ${s.h1}`}>Fall Job Fair 2026</h1>
        <p className={s.when}>
          <span>Wednesday, September 23 · 9:30 a.m.–3:30 p.m.</span>
          <span>{EVENT.venue}, Waterloo</span>
        </p>
        {lead && <p className={s.lead}>{lead}</p>}
      </div>
    </header>
  );
}
