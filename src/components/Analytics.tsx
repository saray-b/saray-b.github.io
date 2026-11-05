"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const CODE = "sarayberrio";

type GC = { count: (o: { path?: string; title?: string; event?: boolean }) => void };
/** Devuelve GoatCounter solo cuando el script ya cargó (antes existe un objeto sin `count`). */
const gc = () => {
  const g = (window as unknown as { goatcounter?: Partial<GC> }).goatcounter;
  return typeof g?.count === "function" ? (g as GC) : undefined;
};

/** Respeta Do Not Track y Global Privacy Control. */
const optedOut = () => {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.doNotTrack === "1" || nav.globalPrivacyControl === true;
};

/** Analítica con GoatCounter: sin cookies ni datos personales. Cuenta visitas y unos pocos clics. */
export default function Analytics() {
  const pathname = usePathname();

  // Carga el script una sola vez (si la persona no ha rechazado el rastreo).
  useEffect(() => {
    if (optedOut() || document.getElementById("goatcounter")) return;
    const s = document.createElement("script");
    s.id = "goatcounter";
    s.async = true;
    s.src = "https://gc.zgo.at/count.js";
    s.dataset.goatcounter = `https://${CODE}.goatcounter.com/count`;
    s.dataset.goatcounterSettings = JSON.stringify({ no_onload: true });
    s.onload = () => gc()?.count({ path: location.pathname + location.search });
    document.head.appendChild(s);
  }, []);

  // Cuenta cada cambio de página (la primera carga la cuenta onload).
  useEffect(() => {
    if (!gc()) return;
    gc()?.count({ path: pathname });
  }, [pathname]);

  // Eventos: solo los clics que importan.
  useEffect(() => {
    const send = (name: string) => gc()?.count({ path: "evento/" + name, title: name, event: true });
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      const mark = el.closest<HTMLElement>("[data-evento]");
      if (mark) return send(mark.dataset.evento!);
      const a = el.closest<HTMLAnchorElement>("a[href]");
      if (!a) return;
      if (a.href.startsWith("mailto:")) return send("contacto/correo");
      if (a.hostname && a.hostname !== location.hostname) return send("enlace/" + a.hostname.replace(/^www\./, ""));
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
