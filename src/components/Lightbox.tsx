"use client";
import { useEffect, useRef } from "react";

/** Visor de zoom para cualquier imagen con data-zoom (clic, Enter o espacio). */
export default function Lightbox() {
  const dlg = useRef<HTMLDialogElement>(null);
  const big = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const d = dlg.current!,
      b = big.current!;
    const lock = (on: boolean) => document.documentElement.classList.toggle("no-scroll", on);
    const open = (img: HTMLImageElement) => {
      b.src = img.currentSrc || img.src;
      b.alt = img.alt;
      lock(true);
      d.showModal();
    };
    const find = (t: EventTarget | null) =>
      t instanceof Element ? (t.closest("[data-zoom]") as HTMLImageElement | null) : null;
    const onClick = (e: MouseEvent) => {
      const i = find(e.target);
      if (i) open(i);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const i = find(e.target);
      if (!i) return;
      e.preventDefault();
      open(i);
    };
    const onClose = () => lock(false);
    const onDlgClick = (e: MouseEvent) => {
      if (e.target !== b) d.close();
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    d.addEventListener("close", onClose);
    d.addEventListener("click", onDlgClick);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
      d.removeEventListener("close", onClose);
      d.removeEventListener("click", onDlgClick);
    };
  }, []);

  return (
    <dialog ref={dlg} className="lightbox" aria-label="Imagen ampliada">
      <button className="lb-close" type="button" aria-label="Cerrar" onClick={() => dlg.current?.close()}>
        ✕
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={big} alt="" />
    </dialog>
  );
}
