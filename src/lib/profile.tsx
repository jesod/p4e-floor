"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Employer } from "./types";

/** Work authorization. Cross-checked against work_eligibility, which only holds sourced cases. */
export type Auth = "citizen" | "pr" | "permit" | "unsure";
export type Seeking = "coop" | "summer" | "ft27" | "ftal";

/** Where you'd rather end up. Favours, never hides. */
export type Region = "kw" | "toronto" | "brantford";

export type Profile = {
  school?: "conestoga" | "guelph" | "waterloo" | "laurier";
  auth?: Auth;
  seeking: Seeking[];
  fields: string[];      // keys from FIELDS
  regions: Region[];     // favour employers with a verified head office there
  done: boolean;
};

export const EMPTY_PROFILE: Profile = { seeking: [], fields: [], regions: [], done: false };

/**
 * Etobicoke, North York, Scarborough and East York have been the City of
 * Toronto since the 1998 amalgamation, so a head office there is a head office
 * in Toronto. Mississauga, Brampton, Vaughan, Markham, Oakville and Burlington
 * are separate cities: near Toronto, not in it, and not counted here.
 */
const TORONTO = new Set(["Toronto", "Etobicoke", "North York", "Scarborough", "East York"]);

/**
 * Each region matches on the head office we verified against the company's own
 * site. That is why the counts are small: the dataset only claims what it can
 * cite, and an employer with no sourced address belongs to no region.
 */
export const REGIONS: {
  k: Region; label: string; where: string; routeTitle: string; reason: string;
  match: (e: Employer) => boolean;
}[] = [
  {
    k: "kw", label: "KW region", where: "Kitchener–Waterloo and nearby",
    routeTitle: "The ones based in KW",
    reason: "Verified head office in the KW region",
    match: (e) => e.kw === 1,
  },
  {
    k: "toronto", label: "Toronto", where: "the City of Toronto",
    routeTitle: "The ones based in Toronto",
    reason: "Verified head office in Toronto",
    match: (e) => TORONTO.has(e.hq?.c ?? ""),
  },
  {
    k: "brantford", label: "Brantford", where: "Brantford",
    routeTitle: "The ones based in Brantford",
    reason: "Verified head office in Brantford",
    match: (e) => e.hq?.c === "Brantford",
  },
];

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

/**
 * Profiles saved before "the region" could be more than one carry `localOnly`.
 * Rebuilt field by field rather than spread, so a stale key can't ride along
 * into storage and nothing downstream has to guard against a missing array.
 */
export function migrateProfile(raw: unknown): Profile {
  const v = (raw ?? {}) as Partial<Profile> & { localOnly?: boolean };
  const regions = Array.isArray(v.regions)
    ? v.regions.filter((r): r is Region => REGIONS.some((x) => x.k === r))
    : v.localOnly ? (["kw"] as Region[]) : [];
  return {
    school: v.school,
    auth: v.auth,
    seeking: Array.isArray(v.seeking) ? v.seeking : [],
    fields: Array.isArray(v.fields) ? v.fields : [],
    regions,
    done: Boolean(v.done),
  };
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const v = localStorage.getItem(KEY); if (v) setProfile(migrateProfile(JSON.parse(v))); } catch {}
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
