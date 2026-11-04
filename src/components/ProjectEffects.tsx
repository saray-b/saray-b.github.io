"use client";
import { useEffect } from "react";

/** Comportamientos del caso de estudio: imágenes largas con scroll propio e índice lateral que marca el capítulo visible. */
export default function ProjectEffects() {
  useEffect(() => {
    // Al llegar al final (o al inicio) de una imagen larga, la rueda sigue desplazando la página.
    const cleanups: (() => void)[] = [];
    document.querySelectorAll<HTMLElement>(".frame[data-scroll]").forEach((el) => {
      const onWheel = (e: WheelEvent) => {
        if (e.ctrlKey || e.deltaY === 0) return;
        const atEdge = e.deltaY > 0 ? el.scrollTop + el.clientHeight >= el.scrollHeight - 1 : el.scrollTop <= 0;
        if (!atEdge) return;
        e.preventDefault();
        window.scrollBy({ top: e.deltaY, left: 0, behavior: "instant" });
      };
      el.addEventListener("wheel", onWheel, { passive: false });
      cleanups.push(() => el.removeEventListener("wheel", onWheel));
    });

    const links = [...document.querySelectorAll<HTMLAnchorElement>(".toc a")];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
      }),
      { rootMargin: "-30% 0px -60% 0px" },
    );
    document.querySelectorAll(".chapter").forEach((s) => io.observe(s));

    return () => { cleanups.forEach((f) => f()); io.disconnect(); };
  }, []);

  return null;
}
