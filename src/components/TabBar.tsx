"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePlan } from "@/lib/store";

const TABS = [
  { href: "/", label: "Empleadores", icon: "list" },
  { href: "/plano", label: "Plano", icon: "map" },
  { href: "/ruta", label: "Mi recorrido", icon: "route" },
  { href: "/fuentes", label: "Fuentes", icon: "source" },
] as const;

function Icon({ name }: { name: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
      {name === "list" && <g {...p}><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></g>}
      {name === "map" && <g {...p}><path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 7 9 4Z" /><path d="M9 4v13M15 7v12.5" /></g>}
      {name === "route" && <g {...p}><circle cx="6" cy="18" r="2.6" /><circle cx="18" cy="6" r="2.6" /><path d="M8.6 18h5a3.4 3.4 0 0 0 0-6.8h-3a3.4 3.4 0 0 1 0-6.8h3.8" /></g>}
      {name === "source" && <g {...p}><path d="M5 4.6h9.5L19 9v10.4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5.6a1 1 0 0 1 1-1Z" /><path d="M14 4.6V9h4.6M8 13h7M8 16.5h4.5" /></g>}
    </svg>
  );
}

export default function TabBar() {
  const path = usePathname();
  const { savedIds, ready } = usePlan();
  return (
    <nav className="tabbar" aria-label="Secciones">
      <div className="tabbar-in">
        {TABS.map((t) => {
          const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href} className="tab" data-active={active} aria-current={active ? "page" : undefined}>
              <span style={{ position: "relative", display: "grid", placeContent: "center" }}>
                <Icon name={t.icon} />
                {t.icon === "route" && ready && savedIds.length > 0 && (
                  <span className="badge">{savedIds.length}</span>
                )}
              </span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
