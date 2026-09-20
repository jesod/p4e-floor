"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useProfile, FIELDS } from "@/lib/profile";
import { buildPresets } from "@/lib/presets";
import s from "./ProfileCard.module.css";

export default function ProfileCard() {
  const { profile, ready } = useProfile();
  const { total, excluded } = useMemo(() => buildPresets(profile), [profile]);
  if (!ready) return null;

  if (!profile.done) {
    return (
      <Link href="/perfil" className={s.card} data-empty="true">
        <div>
          <p className={`display ${s.title}`}>Armá tu recorrido en 4 preguntas</p>
          <p className={s.sub}>
            Decinos qué buscás y con qué podés trabajar en Canadá, y te dejamos
            recorridos listos para usar el miércoles.
          </p>
        </div>
        <span className={s.arrow} aria-hidden="true">→</span>
      </Link>
    );
  }

  const fields = FIELDS.filter((f) => profile.fields.includes(f.k)).map((f) => f.label);
  return (
    <Link href="/perfil" className={s.card}>
      <div>
        <p className={s.eyebrowRow}>
          <span className="eyebrow">Tu perfil</span>
          <span className={`mono ${s.count}`}>{total} te calzan</span>
        </p>
        <p className={s.sub}>
          {fields.length ? fields.join(" · ") : "Sin áreas elegidas"}
          {excluded.length > 0 && <> · {excluded.length} quedan afuera por elegibilidad</>}
        </p>
      </div>
      <span className={s.arrow} aria-hidden="true">→</span>
    </Link>
  );
}
