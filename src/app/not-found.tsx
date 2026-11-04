import Link from "next/link";

export const metadata = { title: "Página no encontrada - Saray Berrio", robots: { index: false } };

export default function NotFound() {
  return (
    <main id="main" className="wrap" style={{ padding: "clamp(48px, 12vh, 120px) 0" }}>
      <h1 className="display">Esta página no existe.</h1>
      <p className="lede" style={{ margin: "16px 0 24px" }}>
        Puede que el enlace esté mal escrito o que el contenido se haya movido.
      </p>
      <Link className="btn" href="/">
        Volver al inicio
      </Link>
    </main>
  );
}
