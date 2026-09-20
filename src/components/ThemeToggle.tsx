"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => {
    const saved = (() => { try { return localStorage.getItem("p4e.theme"); } catch { return null; } })();
    if (saved === "dark" || saved === "light") {
      document.documentElement.dataset.theme = saved;
      setDark(saved === "dark");
    } else {
      setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);
  const flip = () => {
    const next = !dark;
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try { localStorage.setItem("p4e.theme", next ? "dark" : "light"); } catch {}
    setDark(next);
  };
  return (
    <button onClick={flip} aria-label="Switch between light and dark"
      style={{ background: "none", border: 0, color: "inherit", opacity: .7,
        width: 44, height: 44, display: "grid", placeContent: "center" }}>
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.6v2M12 19.4v2M21.4 12h-2M4.6 12h-2M18.6 5.4l-1.4 1.4M6.8 17.2l-1.4 1.4M18.6 18.6l-1.4-1.4M6.8 6.8 5.4 5.4" />
      </svg>
    </button>
  );
}
