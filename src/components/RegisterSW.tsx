"use client";
import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (window.location.hostname === "localhost") return;
    const id = setTimeout(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }, 1200);
    return () => clearTimeout(id);
  }, []);
  return null;
}
