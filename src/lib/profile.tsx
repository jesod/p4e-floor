"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/** Autorización de trabajo. Cruza contra work_eligibility, que solo tiene casos con fuente. */
export type Auth = "citizen" | "pr" | "permit" | "unsure";
export type Seeking = "coop" | "summer" | "ft27" | "ftal";

export type Profile = {
  school?: "conestoga" | "guelph" | "waterloo" | "laurier";
  auth?: Auth;
  seeking: Seeking[];
  fields: string[];      // claves de FIELDS
  localOnly: boolean;    // prioriza sede verificada en la región KW
  done: boolean;
};

export const EMPTY_PROFILE: Profile = { seeking: [], fields: [], localOnly: false, done: false };

export const SCHOOLS = [
  { k: "conestoga", label: "Conestoga College" },
  { k: "guelph", label: "University of Guelph" },
  { k: "waterloo", label: "University of Waterloo" },
  { k: "laurier", label: "Wilfrid Laurier" },
] as const;

export const AUTHS: { k: Auth; label: string; sub: string }[] = [
  { k: "citizen", label: "Ciudadanía canadiense", sub: "Ningún empleador te queda afuera por nacionalidad" },
  { k: "pr", label: "Residencia permanente", sub: "Quedan afuera los que exigen ciudadanía" },
  { k: "permit", label: "Permiso de estudio o trabajo", sub: "Incluye co-op work permit y PGWP" },
  { k: "unsure", label: "Prefiero no decirlo", sub: "No filtramos nada por este campo" },
];

export const SEEKING: { k: Seeking; label: string }[] = [
  { k: "coop", label: "Co-op" },
  { k: "summer", label: "Verano" },
  { k: "ft27", label: "Full-time, me gradúo en 2027" },
  { k: "ftal", label: "Full-time, ya me gradué" },
];

/**
 * Áreas en el idioma del estudiante, mapeadas a las categorías oficiales de P4E.
 * `domains` usa lo que la propia empresa dice en su sitio: es el único camino para
 * áreas que P4E no contempla, como diseño de producto.
 */
export const FIELDS: { k: string; label: string; cats: string[]; domains: string[] }[] = [
  { k: "eng", label: "Ingeniería", cats: ["Engineering"], domains: ["Mechanical Engineering", "Civil / Structural", "Electrical / Power", "Chemical / Process"] },
  { k: "soft", label: "Software y computación", cats: ["Information Technology/Software Development"], domains: ["Software Engineering", "Cloud / DevOps", "Embedded / Firmware"] },
  { k: "data", label: "Datos e inteligencia artificial", cats: ["Information Technology/Software Development", "Research"], domains: ["AI / Machine Learning", "Data Science / Analytics"] },
  { k: "design", label: "Diseño y UX", cats: [], domains: ["UX / Product Design", "Product Management"] },
  { k: "biz", label: "Negocios y finanzas", cats: ["Finance/Accounting/Insurance", "Management/Consulting", "Sales/Business Development"], domains: ["Finance / Investment", "Accounting / Audit", "Insurance"] },
  { k: "mkt", label: "Marketing y comunicación", cats: ["Marketing/Advertising", "Communications/Public Relations"], domains: ["Marketing / Communications"] },
  { k: "sci", label: "Ciencias y salud", cats: ["Scientific/Healthcare", "Research"], domains: ["Healthcare / Clinical", "Nuclear"] },
  { k: "env", label: "Ambiente y sustentabilidad", cats: ["Environmental/Resource Management"], domains: ["Environmental / Sustainability", "GIS / Geomatics"] },
  { k: "ops", label: "Logística y operaciones", cats: ["Supply Chain/Operations Management"], domains: ["Supply Chain / Logistics", "Manufacturing / Lean"] },
  { k: "hr", label: "Recursos humanos", cats: ["Human Resources"], domains: ["Human Resources"] },
  { k: "trades", label: "Oficios y construcción", cats: ["Trades", "Architecture/Interior Design"], domains: ["Construction Management"] },
  { k: "social", label: "Social, educación y comunidad", cats: ["Social Service", "Teaching", "Recreation/Leisure/Tourism"], domains: ["Social Services", "Education / Teaching"] },
  { k: "safety", label: "Seguridad pública", cats: ["Police/Security"], domains: [] },
  { k: "aero", label: "Aeroespacial y defensa", cats: [], domains: ["Aerospace / Space", "Telecom / Networks", "Robotics / Automation"] },
];

const KEY = "p4e.profile.v1";
type Ctx = { profile: Profile; ready: boolean; save: (p: Profile) => void; clear: () => void };
const C = createContext<Ctx | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const v = localStorage.getItem(KEY); if (v) setProfile(JSON.parse(v) as Profile); } catch {}
    setReady(true);
  }, []);
  const save = (p: Profile) => {
    setProfile(p);
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
  };
  const clear = () => { setProfile(EMPTY_PROFILE); try { localStorage.removeItem(KEY); } catch {} };
  return <C.Provider value={{ profile, ready, save, clear }}>{children}</C.Provider>;
}
export function useProfile() {
  const c = useContext(C);
  if (!c) throw new Error("useProfile fuera de ProfileProvider");
  return c;
}
