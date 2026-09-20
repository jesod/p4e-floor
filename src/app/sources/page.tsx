import Link from "next/link";
import type { Metadata } from "next";
import { EMPLOYERS, EVENT, BLOCKING, ELIGIBILITY, host } from "@/lib/data";
import s from "./sources.module.css";

export const metadata: Metadata = {
  title: "Where every fact comes from — P4E Floor",
  description: "What's verified against a source, what's our own labelling, and what we chose not to show.",
};

const n = {
  total: EMPLOYERS.length,
  booth: EMPLOYERS.filter((e) => e.b).length,
  cats: EMPLOYERS.filter((e) => e.c.length).length,
  elig: EMPLOYERS.filter((e) => e.el).length,
  sec: EMPLOYERS.filter((e) => e.sr).length,
  hq: EMPLOYERS.filter((e) => e.hq).length,
  kw: EMPLOYERS.filter((e) => e.kw === 1).length,
  sd: EMPLOYERS.filter((e) => e.sd?.length).length,
  site: EMPLOYERS.filter((e) => e.t).length,
};
const restricted = EMPLOYERS.filter((e) => e.el && BLOCKING.has(e.el.v))
  .sort((a, b) => a.n.localeCompare(b.n, "en"));
const gaps = EMPLOYERS.filter((e) => e.g?.length);

const SOURCE_LABEL: Record<string, string> = {
  employer_list: "Employer list by employment type",
  jobs_available: "Employer list by jobs available",
  booths: "Floorplan with booth numbers",
};

export default function Sources() {
  return (
    <>
      <header className={s.top}>
        <div className="wrap">
          <p className="eyebrow" style={{ color: "inherit", opacity: .6 }}>Method</p>
          <h1 className={`display ${s.h1}`}>Where every fact comes from</h1>
          <p className={s.lead}>
            One rule: if a fact has no citable source, we don&rsquo;t show it. We&rsquo;d rather
            leave a field empty than dress up our own guess as a fact.
          </p>
        </div>
      </header>

      <main className={`wrap ${s.main}`}>
        <Section title="Verified against P4E&rsquo;s official PDFs">
          <Row k="Name and role types offered" v={`${n.total} of ${n.total}`} />
          <Row k="Booth number" v={`${n.booth} of ${n.total}`} />
          <Row k="Job categories" v={`${n.cats} of ${n.total}`} />
          <p className={s.note}>
            Source dated {EVENT.source_date}. Those PDFs are multi-column, so we rebuilt the
            layout from each label&rsquo;s coordinates rather than trusting the text&rsquo;s
            reading order.
          </p>
          <ul className={s.links}>
            {Object.entries(EVENT.sources).map(([k, url]) => (
              <li key={k}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {SOURCE_LABEL[k] ?? k} · {host(url)} ↗
                </a>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Verified by us, with the source cited">
          <Row k="Website (tested over HTTP, not guessed)" v={`${n.total} of ${n.total}`} />
          <Row k="How the company describes itself" v={`${n.site} of ${n.total}`} />
          <Row k="Legal eligibility" v={`${n.elig} of ${n.total}`} />
          <Row k="Security requirement" v={`${n.sec} of ${n.total}`} />
          <Row k="Head office" v={`${n.hq} of ${n.total}`} />
          <Row k="Sectors they say they serve" v={`${n.sd} of ${n.total}`} />
          <p className={s.note}>
            Every one of these carries the exact quote and a link on the employer&rsquo;s page.
            Where a count falls short of {n.total}, it&rsquo;s because we found no source for
            the rest.
          </p>
        </Section>

        <Section title="Our labelling, not a fact">
          <p className={s.body}>
            <b>Industry</b> and <b>sector</b> are editorial labels that exist so the filters
            are useful. They come from no official source, and you shouldn&rsquo;t read them as
            hard facts about a company.
          </p>
        </Section>

        <Section title="What we chose not to show">
          <p className={s.body}>
            We had inferred head offices and company sizes for all {n.total}. Checking those
            addresses against each company&rsquo;s own website, <b>18% were wrong</b>. We dropped
            company size entirely and kept only the {n.hq} head offices with a citable address —
            which is why the &ldquo;based in KW&rdquo; filter shows {n.kw} employers instead of
            the 40 we would otherwise have claimed.
          </p>
          <p className={s.body}>
            We also removed three employers we had flagged with a nationality restriction by
            inference, once we couldn&rsquo;t find the policy published anywhere.
          </p>
        </Section>

        <Section title={`The ${restricted.length} with a legal nationality requirement`}>
          <p className={s.body}>
            No official source for the fair publishes this. Verified September 20, 2026.
          </p>
          <ul className={s.restricted}>
            {restricted.map((e) => (
              <li key={e.i}>
                <Link href={`/e/${e.i}`}>
                  <span className={s.rName}>{e.n}</span>
                  <span className={s.rWhat}>{ELIGIBILITY[e.el!.v]}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className={s.note}>
            A <b>security clearance</b> requirement is not the same as a nationality
            requirement — it applies per role. We keep it as a separate field.
          </p>
        </Section>

        <Section title="Gaps in the official source">
          <ul className={s.gaps}>
            {gaps.map((e) => (
              <li key={e.i}>
                <Link href={`/e/${e.i}`}>{e.n}</Link>{" — "}
                {e.g!.map((g) => g === "no_booth_in_floorplan"
                  ? "on P4E's employer lists but missing from the floorplan"
                  : "not listed in P4E's job-category PDF").join("; ")}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="What we don&rsquo;t have">
          <p className={s.body}>
            We don&rsquo;t know <b>which programs each employer hires from</b>, because nobody
            publishes it. P4E&rsquo;s 21 official categories are far too coarse for that:
            &ldquo;Engineering&rdquo; covers 96 of {n.total} companies. That&rsquo;s why this app
            gives you <b>no match score</b> — when an employer turns up in your search, we tell
            you the exact text that surfaced it and where it came from, and you decide.
          </p>
        </Section>

        <p className={s.foot}>
          This is not an official P4E site. For accessibility and event questions:{" "}
          <a href={`mailto:${EVENT.accessibility_contact}`}>{EVENT.accessibility_contact}</a> ·{" "}
          <a href={EVENT.website} target="_blank" rel="noopener noreferrer">{host(EVENT.website)} ↗</a>
        </p>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={s.section}>
      <h2 className="eyebrow" dangerouslySetInnerHTML={{ __html: title }} />
      {children}
    </section>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className={s.row}>
      <span>{k}</span>
      <span className={`mono ${s.rowV}`}>{v}</span>
    </div>
  );
}
