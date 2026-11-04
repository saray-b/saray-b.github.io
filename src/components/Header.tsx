"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SITE } from "@/data";

export default function Header() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // ?tema=oscuro o ?tema=claro fuerza un modo para pruebas
    const tema = new URLSearchParams(location.search).get("tema");
    if (tema === "oscuro" || tema === "claro")
      document.documentElement.dataset.theme = tema === "oscuro" ? "dark" : "light";
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  const toggle = () => {
    const next = !dark;
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem("tema", next ? "dark" : "light");
    } catch {
      /* sin almacenamiento: solo dura esta visita */
    }
    setDark(next);
  };

  return (
    <header className="site-header" id="site-header">
      <div className="wrap">
        <Link className="brand" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-logo" src="/assets/logo.svg" alt="" width={36} height={36} />
          <span className="brand-name">{SITE.shortName}</span>
        </Link>
        <div className="header-right">
          <nav className="nav" aria-label="Principal">
            <Link href="/#proyectos">Proyectos</Link>
            <Link href="/#sobre-mi">Sobre mí</Link>
            <Link href="/#contacto">Contacto</Link>
          </nav>
          <button
            className="theme-toggle"
            id="theme-toggle"
            type="button"
            aria-label="Modo oscuro"
            aria-pressed={dark}
            onClick={toggle}
          >
            <svg className="i-moon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            <svg className="i-sun" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="2" />
              <path
                d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
