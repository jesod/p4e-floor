import Link from "next/link";
export default function NotFound() {
  return (
    <main className="wrap" style={{ paddingBlock: "60px 40px", textAlign: "center" }}>
      <p className="eyebrow">Error 404</p>
      <h1 className="display" style={{ fontSize: 28, margin: "8px 0 10px" }}>Esa página no existe</h1>
      <p style={{ color: "var(--ink-2)", margin: "0 0 22px" }}>
        Puede que el empleador ya no figure en la lista de P4E.
      </p>
      <Link className="btn" href="/">Ver todos los empleadores</Link>
    </main>
  );
}
