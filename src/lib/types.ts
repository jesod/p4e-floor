export type Sourced = { v: string; q: string; s: string };
export type HQ = { c: string; r: string; s: string };
export type Domain = { d: string; q: string; s: string };

export type Employer = {
  i: string;            // id
  n: string;            // nombre
  b: string | null;     // booth
  c: string[];          // categorias oficiales P4E
  ind: string;          // industria (clasificacion editorial)
  sec: string;          // sector (clasificacion editorial)
  w: string;            // website verificado por HTTP
  t: string;            // como se describe la empresa (meta description real)
  h: [boolean, boolean, boolean, boolean]; // coop, verano, FT2027, FT alumni
  x?: number; y?: number; a?: string;      // posicion real en el plano
  el?: Sourced;         // elegibilidad legal — solo con fuente
  sr?: Sourced;         // requisito de seguridad — solo con fuente
  hq?: HQ;              // sede — solo con fuente
  kw?: number;          // sede local KW verificada
  sd?: Domain[];        // sectores a los que dice servir, con cita
  g?: string[];         // gaps de la fuente oficial
};

export type Floorplan = {
  source: string; method: string; note: string;
  extent: { x0: number; y0: number; x1: number; y1: number };
  landmarks: { n: string; x: number; y: number }[];
  aisles: { id: string; x: number; serves: string[] }[];
};

export type Event = {
  name: string; organizer: string; date: string; start: string; end: string;
  venue: string; address: string; partners: string[]; website: string;
  accessibility_contact: string; sources: Record<string, string>;
  source_date: string; built: string;
};

export type Payload = { ev: Event; fp: Floorplan; e: Employer[] };
