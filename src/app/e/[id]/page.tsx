import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EMPLOYERS, byId } from "@/lib/data";
import Detail from "./Detail";

export function generateStaticParams() {
  return EMPLOYERS.map((e) => ({ id: e.i }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const e = byId.get(id);
  if (!e) return { title: "Empleador no encontrado" };
  return {
    title: `${e.n} — booth ${e.b ?? "sin asignar"} · P4E Floor`,
    description: e.t || `${e.sec}. Booth ${e.b ?? "sin asignar"} en la P4E Fall Job Fair 2026.`,
  };
}

export default async function EmployerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = byId.get(id);
  if (!e) notFound();
  return <Detail e={e} />;
}
