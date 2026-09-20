import Link from "next/link";
import type { Metadata } from "next";
import { EMPLOYERS, EVENT, BLOCKING, ELIGIBILITY, host } from "@/lib/data";
import s from "./fuentes.module.css";

export const metadata: Metadata = {
  title: "De dónde sale cada dato — P4E Floor",
  description: "Qué está verificado contra una fuente, qué es clasificación nuestra, y qué decidimos no mostrar.",
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
const restricted = EMPLOYERS.filter((e) => e.el && BLOCKING.has(e.el.v)).sort((a, b) => a.n.localeCompare(b.n, "es"));
const gaps = EMPLOYERS.filter((e) => e.g?.length);

export default function Fuentes() {
  return (
    <>
      <header className={s.top}>
        <div className="wrap">
          <p className="eyebrow" style={{ color: "inherit", opacity: .6 }}>Método</p>
          <h1 className={`display ${s.h1}`}>De dónde sale cada dato</h1>
          <p className={s.lead}>
            Regla única: si un dato no tiene fuente citable, no se muestra. Preferimos un campo
            vacío antes que una afirmación nuestra disfrazada de hecho.
          </p>
        </div>
      </header>

      <main className={`wrap ${s.main}`}>
        <Section title="Verificado contra los PDFs oficiales de P4E">
          <Row k="Nombre y tipo de contratación" v={`${n.total} de ${n.total}`} />
          <Row k="Número de booth" v={`${n.booth} de ${n.total}`} />
          <Row k="Categorías de puesto" v={`${n.cats} de ${n.total}`} />
          <p className={s.note}>
            Fuente datada el {EVENT.source_date}. Los PDFs son multi-columna: las posiciones se
            reconstruyeron por coordenadas de palabra, no por orden de lectura del texto.
          </p>
          <ul className={s.links}>
            {Object.entries(EVENT.sources).map(([k, url]) => (
              <li key={k}><a href={url} target="_blank" rel="noopener noreferrer">{host(url)} · {k} ↗</a></li>
            ))}
          </ul>
        </Section>

        <Section title="Verificado por nosotros, con la fuente citada">
          <Row k="Sitio web (probado por HTTP, no adivinado)" v={`${n.total} de ${n.total}`} />
          <Row k="Cómo se describe la empresa" v={`${n.site} de ${n.total}`} />
          <Row k="Elegibilidad legal" v={`${n.elig} de ${n.total}`} />
          <Row k="Requisito de seguridad" v={`${n.sec} de ${n.total}`} />
          <Row k="Sede" v={`${n.hq} de ${n.total}`} />
          <Row k="Sectores a los que dice servir" v={`${n.sd} de ${n.total}`} />
          <p className={s.note}>
            Cada uno de estos campos lleva la cita textual y el link en la ficha del empleador.
            Si el número no llega a {n.total}, es porque del resto no encontramos fuente.
          </p>
        </Section>

        <Section title="Clasificación nuestra, no un hecho">
          <p className={s.body}>
            <b>Industria</b> y <b>sector</b> son etiquetas editoriales para que los filtros sirvan.
            No salen de ninguna fuente oficial y no deberías tomarlas como dato duro sobre la empresa.
          </p>
        </Section>

        <Section title="Lo que decidimos no mostrar">
          <p className={s.body}>
            Teníamos sedes y tamaños de empresa inferidos para los {n.total}. Al contrastar las
            sedes contra el sitio real de cada empresa, <b>18% estaban mal</b>. Sacamos el tamaño
            por completo y dejamos solo las {n.hq} sedes con dirección citable — por eso el filtro
            de sede local KW muestra {n.kw} empresas y no las 40 que habríamos afirmado.
          </p>
          <p className={s.body}>
            También sacamos tres empleadores que habíamos marcado con restricción de nacionalidad
            por inferencia, al no encontrar la política publicada.
          </p>
        </Section>

        <Section title={`Los ${restricted.length} con restricción legal de nacionalidad`}>
          <p className={s.body}>
            Ninguna fuente oficial de la feria publica esto. Verificado el 20 de septiembre de 2026.
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
            Un requisito de <b>security clearance</b> no es lo mismo que una restricción de
            nacionalidad: aplica por puesto. Lo mostramos como campo aparte.
          </p>
        </Section>

        <Section title="Gaps de la fuente oficial">
          <ul className={s.gaps}>
            {gaps.map((e) => (
              <li key={e.i}>
                <Link href={`/e/${e.i}`}>{e.n}</Link>{" — "}
                {e.g!.map((g) => g === "no_booth_in_floorplan"
                  ? "está en las listas de empleadores pero no en el floorplan"
                  : "no figura en el PDF de categorías de puesto").join("; ")}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Qué no tenemos">
          <p className={s.body}>
            No sabemos <b>de qué programas contrata</b> cada empleador, porque nadie lo publica.
            Las 21 categorías oficiales de P4E son demasiado gruesas para eso: “Engineering” cubre
            96 de {n.total} empresas. Por eso esta app <b>no te da un puntaje de match</b> — cuando
            una empresa aparece en tu búsqueda, te decimos qué texto exacto la hizo aparecer y de
            dónde salió, y vos decidís.
          </p>
        </Section>

        <p className={s.foot}>
          Esto no es un sitio oficial de P4E. Para accesibilidad y consultas del evento:{" "}
          <a href={`mailto:${EVENT.accessibility_contact}`}>{EVENT.accessibility_contact}</a> ·{" "}
          <a href={EVENT.website} target="_blank" rel="noopener noreferrer">{host(EVENT.website)} ↗</a>
        </p>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className={s.section}><h2 className="eyebrow">{title}</h2>{children}</section>;
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className={s.row}>
      <span>{k}</span>
      <span className={`mono ${s.rowV}`}>{v}</span>
    </div>
  );
}
