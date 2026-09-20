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
      <Link href="/profile" className={s.card} data-empty="true">
        <div>
          <p className={`display ${s.title}`}>Build your route in 4 questions</p>
          <p className={s.sub}>
            Tell us what you're after and what you can work on in Canada, and we'll
            put together routes you can walk on Wednesday.
          </p>
        </div>
        <span className={s.arrow} aria-hidden="true">→</span>
      </Link>
    );
  }

  const fields = FIELDS.filter((f) => profile.fields.includes(f.k)).map((f) => f.label);
  return (
    <Link href="/profile" className={s.card}>
      <div>
        <p className={s.eyebrowRow}>
          <span className="eyebrow">Your profile</span>
          <span className={`mono ${s.count}`}>{total} fit you</span>
        </p>
        <p className={s.sub}>
          {fields.length ? fields.join(" · ") : "No fields picked"}
          {excluded.length > 0 && <> · {excluded.length} ruled out on eligibility</>}
        </p>
      </div>
      <span className={s.arrow} aria-hidden="true">→</span>
    </Link>
  );
}
