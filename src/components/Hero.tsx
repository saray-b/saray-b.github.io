"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, type CSSProperties } from "react";
import { SITE } from "@/data";
import { rich } from "@/lib/format";

// [área, archivo, pie de foto, desplazamiento con el cursor (px), retardo de entrada (s)]
const PHOTOS: [string, string, string, number, number][] = [
  ["a", "diseno", "Diseño", 6, 0.05],
  ["b", "codigo", "Código", 10, 0.2],
  ["c", "estetica", "Estética", 7, 0.35],
  ["d", "rendimiento", "Optimización", 12, 0.5],
  ["e", "soluciones", "Soluciones", 8, 0.65],
];

export default function Hero() {
  const hero = useRef<HTMLElement>(null);

  // Las fotos se desplazan apenas con el cursor (solo con ratón y sin "reducir movimiento").
  useEffect(() => {
    const el = hero.current!;
    if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const set = (x: number, y: number) => {
      el.style.setProperty("--mx", x.toFixed(3));
      el.style.setProperty("--my", y.toFixed(3));
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2);
    };
    const leave = () => set(0, 0);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <section ref={hero} className="hero-collage" id="hero" aria-label="Presentación">
      <div className="wrap np">
        <div className="np-copy">
          <h1 className="display" dangerouslySetInnerHTML={{ __html: rich(SITE.headline) }} />
          <div className="np-foot">
            <p className="lede" dangerouslySetInnerHTML={{ __html: rich(SITE.lede) }} />
            <div className="actions">
              <a className="btn" href="#proyectos">
                Ver proyectos
              </a>
              <a className="btn ghost" href="#contacto">
                Contacto
              </a>
            </div>
          </div>
        </div>
        <div className="np-photos">
          {PHOTOS.map(([area, file, cap, k, d]) => (
            <figure key={area} className={`ph ph-${area}`} style={{ "--k": k, "--d": `${d}s` } as CSSProperties}>
              <div className="ph-img">
                <img src={`/assets/hero/${file}.svg`} alt="" loading="lazy" />
              </div>
              <figcaption>{cap}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
