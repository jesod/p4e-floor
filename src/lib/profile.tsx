"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/** Work authorization. Cross-checked against work_eligibility, which only holds sourced cases. */
export type Auth = "citizen" | "pr" | "permit" | "unsure";
export type Seeking = "coop" | "summer" | "ft27" | "ftal";

export type Profile = {
  school?: "conestoga" | "guelph" | "waterloo" | "laurier";
  auth?: Auth;
  seeking: Seeking[];
  fields: string[];      // keys from FIELDS
  localOnly: boolean;    // favour employers with a verified head office in the KW region
  done: boolean;
};

export const EMPTY_PROFILE: Profile = { seeking: [], fields: [], localOnly: false, done: false };

export const SCHOOLS = [
  { k: "conestoga", label: "Conestoga College" },
  { k: "guelph", label: "University of Guelph" },
  { k: "waterloo", label: "University of Waterloo" },
  { k: "laurier", label: "Wilfrid Laurier University" },
] as const;

export const AUTHS: { k: Auth; label: string; sub: string }[] = [
  { k: "citizen", label: "Canadian citizen", sub: "No employer is off-limits to you on nationality" },
  { k: "pr", label: "Permanent resident", sub: "Rules out the ones that require citizenship" },
  { k: "permit", label: "Study or work permit", sub: "Includes co-op work permits and the PGWP" },
  { k: "unsure", label: "Rather not say", sub: "We won't filter anything on this" },
];

export const SEEKING: { k: Seeking; label: string }[] = [
  { k: "coop", label: "Co-op" },
  { k: "summer", label: "Summer" },
  { k: "ft27", label: "Full-time, graduating 2027" },
  { k: "ftal", label: "Full-time, already graduated" },
];

/**
 * Fields in the student's own words, mapped onto P4E's official categories.
 * `domains` uses what the employer says on its own site: that's the only route
 * for fields P4E has no category for, such as product design.
 */
export const FIELDS: { k: string; label: string; cats: string[]; domains: string[] }[] = [
  { k: "eng", label: "Engineering", cats: ["Engineering"], domains: ["Mechanical Engineering", "Civil / Structural", "Electrical / Power", "Chemical / Process"] },
  { k: "soft", label: "Software & computing", cats: ["Information Technology/Software Development"], domains: ["Software Engineering", "Cloud / DevOps", "Embedded / Firmware"] },
  { k: "data", label: "Data & AI", cats: ["Information Technology/Software Development", "Research"], domains: ["AI / Machine Learning", "Data Science / Analytics"] },
  { k: "design", label: "Design & UX", cats: [], domains: ["UX / Product Design", "Product Management"] },
  { k: "biz", label: "Business & finance", cats: ["Finance/Accounting/Insurance", "Management/Consulting", "Sales/Business Development"], domains: ["Finance / Investment", "Accounting / Audit", "Insurance"] },
  { k: "mkt", label: "Marketing & communications", cats: ["Marketing/Advertising", "Communications/Public Relations"], domains: ["Marketing / Communications"] },
  { k: "sci", label: "Science & health", cats: ["Scientific/Healthcare", "Research"], domains: ["Healthcare / Clinical", "Nuclear"] },
  { k: "env", label: "Environment & sustainability", cats: ["Environmental/Resource Management"], domains: ["Environmental / Sustainability", "GIS / Geomatics"] },
  { k: "ops", label: "Supply chain & operations", cats: ["Supply Chain/Operations Management"], domains: ["Supply Chain / Logistics", "Manufacturing / Lean"] },
  { k: "hr", label: "Human resources", cats: ["Human Resources"], domains: ["Human Resources"] },
  { k: "trades", label: "Skilled trades & construction", cats: ["Trades", "Architecture/Interior Design"], domains: ["Construction Management"] },
  { k: "social", label: "Social work, teaching & community", cats: ["Social Service", "Teaching", "Recreation/Leisure/Tourism"], domains: ["Social Services", "Education / Teaching"] },
  { k: "safety", label: "Policing & public safety", cats: ["Police/Security"], domains: [] },
  { k: "aero", label: "Aerospace & defence", cats: [], domains: ["Aerospace / Space", "Telecom / Networks", "Robotics / Automation"] },
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
  if (!c) throw new Error("useProfile used outside ProfileProvider");
  return c;
}
