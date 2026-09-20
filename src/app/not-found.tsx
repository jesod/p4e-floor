import Link from "next/link";
export default function NotFound() {
  return (
    <main className="wrap" style={{ paddingBlock: "60px 40px", textAlign: "center" }}>
      <p className="eyebrow">Error 404</p>
      <h1 className="display" style={{ fontSize: 28, margin: "8px 0 10px" }}>This page doesn’t exist</h1>
      <p style={{ color: "var(--ink-2)", margin: "0 0 22px" }}>
        The employer may no longer be on P4E’s list.
      </p>
      <Link className="btn" href="/">See all employers</Link>
    </main>
  );
}
