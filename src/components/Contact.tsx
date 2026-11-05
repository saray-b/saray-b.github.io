"use client";
import { useState } from "react";
import { SITE } from "@/data";
import { plain } from "@/lib/format";
import Ico from "./Ico";

export default function Contact() {
  const c = SITE.contact,
    email = plain(c.email);
  const [label, setLabel] = useState("Copiar correo");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setLabel("Copiado");
      setTimeout(() => setLabel("Copiar correo"), 2000);
    } catch {
      setLabel(email);
    }
  };

  return (
    <section className="section" id="contacto" aria-labelledby="t-contacto">
      <div className="wrap">
        <div className="section-head">
          <h2 id="t-contacto">Contacto</h2>
        </div>
        <div id="contact">
          <p className="intro">¿Quieres conversar sobre un proyecto? Escríbeme.</p>
          <div className="contact-cta">
            <a className="btn" href={`mailto:${email}?subject=${encodeURIComponent("Hola, vi tu portafolio")}`}>
              Escribirme
            </a>
            <button className="btn ghost" type="button" data-evento="contacto/copiar-correo" onClick={copy}>
              {label}
            </button>
          </div>
          <ul className="contact-list">
            <li>
              <a href={`mailto:${email}`}>
                <Ico name="mail" size={30} />
                <span>{email}</span>
              </a>
            </li>
            {c.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.icon && <Ico name={l.icon} size={30} />}
                  <span>{l.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
