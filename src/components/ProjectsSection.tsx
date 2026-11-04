"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import Link from "next/link";
import { PROJECTS } from "@/data";
import { imgProps } from "@/lib";

export function TagList({ tags }: { tags: string[] }) {
  return <span className="tags">{tags.map((t) => <span key={t}>{t}</span>)}</span>;
}

export default function ProjectsSection() {
  const [tag, setTag] = useState("Todos");
  const tags = [...new Set(PROJECTS.flatMap((p) => p.tags))];
  const list = PROJECTS.filter((p) => tag === "Todos" || p.tags.includes(tag));

  return (
    <section className="section" id="proyectos" aria-labelledby="t-proyectos">
      <div className="wrap">
        <div className="section-head">
          <h2 id="t-proyectos">Proyectos</h2>
          <div className="chips" id="filters" role="group" aria-label="Filtrar proyectos">
            {tags.length > 1 && ["Todos", ...tags].map((t) => (
              <button key={t} className="filter" type="button" aria-pressed={t === tag} onClick={() => setTag(t)}>{t}</button>
            ))}
          </div>
        </div>
        {/* data-count decide la maqueta: 1 proyecto = destacado, 2 = dos columnas, 3 o más = cuadrícula */}
        <div className="grid" id="grid" data-count={list.length}>
          {list.map((p) => (
            <Link key={p.slug} className="card" href={`/casos/${p.slug}/`}>
              <div className="card-media">
                <span className="year">{p.year}</span>
                <div className="cover"><img src={p.cover} {...imgProps(p.cover)} alt={p.coverAlt || ""} loading="lazy" /></div>
              </div>
              <div className="card-body">
                <h3>{p.title}</h3>
                <p>{p.summary}</p>
                <div className="card-foot"><TagList tags={p.tags} /></div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
