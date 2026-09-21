import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EMPLOYERS, byId } from "@/lib/data";
import EmployerDetail from "@/components/EmployerDetail";

export function generateStaticParams() {
  return EMPLOYERS.map((e) => ({ id: e.i }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const e = byId.get(id);
  if (!e) return { title: "Employer not found" };
  return {
    title: `${e.n} — booth ${e.b ?? "unassigned"} · P4E Floor`,
    description: e.t || `${e.sec}. Booth ${e.b ?? "unassigned"} at the P4E Fall Job Fair 2026.`,
  };
}

export default async function EmployerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = byId.get(id);
  if (!e) notFound();
  return <EmployerDetail e={e} />;
}
