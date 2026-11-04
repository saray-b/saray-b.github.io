/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Block, Img, Project } from "@/data/types";
import { PROJECTS } from "@/data";
import { imgProps, rich } from "@/lib/format";
import { TagList } from "./ProjectsSection";
import ProjectEffects from "./ProjectEffects";

const R = ({
  html,
  as: Tag = "span",
  ...rest
}: {
  html: string;
  as?: "span" | "p" | "div" | "h3" | "figcaption" | "dd" | "li";
} & React.HTMLAttributes<HTMLElement>) => (
  <Tag {...(rest as object)} dangerouslySetInnerHTML={{ __html: rich(html) }} />
);

// pad = color de fondo: añade un margen interior de ese color (para imágenes sin margen propio)
function Figure(b: Img) {
  const label = b.alt || "";
  return (
    <figure>
      <div className="frame" {...(b.scroll ? { "data-scroll": "", style: { maxHeight: 640, overflow: "auto" } } : {})}>
        <img
          src={b.src}
          {...imgProps(b.src)}
          alt={label}
          loading="lazy"
          decoding="async"
          data-zoom=""
          tabIndex={0}
          role="button"
          aria-label={`Ampliar imagen: ${label}`}
          className={b.pad ? "padded" : undefined}
          style={b.pad ? { background: b.pad } : undefined}
        />
      </div>
      {b.caption && <R as="figcaption" html={b.caption} />}
    </figure>
  );
}

function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case "p":
      return (
        <div className="prose">
          <R as="p" html={b.text} />
        </div>
      );
    case "ul":
      return (
        <ul className="bullets">
          {b.items.map((i, k) => (
            <R key={k} as="li" html={i} />
          ))}
        </ul>
      );
    case "image":
      return <Figure {...b} />;
    case "pair":
      return (
        <div className="compare" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))" }}>
          {b.items.map((i) => (
            <Figure key={i.src} {...i} />
          ))}
        </div>
      );
    case "compare":
      return (
        <div className="compare">
          {b.items.map((i) => (
            <div key={i.src}>
              <span className="tag">{i.label}</span>
              <Figure {...i} />
            </div>
          ))}
        </div>
      );
    case "phones":
      return (
        <div className="phones">
          {b.items.map((i) => (
            <Figure key={i.src} {...i} />
          ))}
        </div>
      );
    case "colors":
      return (
        <>
          {b.groups.map((g) => (
            <div key={g.name}>
              <h3 style={{ marginBottom: 12 }}>{g.name}</h3>
              <div className="swatch-grid">
                {g.items.map(([n, h]) => (
                  <div className="swatch" key={n}>
                    <i style={{ background: h }} />
                    <b>{n}</b>
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      );
    case "decisions":
      return (
        <div className="decisions">
          {b.items.map((d) => (
            <article className="decision" key={d.title}>
              <R as="h3" html={d.title} />
              <R as="p" html={d.text} />
            </article>
          ))}
        </div>
      );
    case "note":
      return <R as="div" className="note" html={b.text} />;
  }
}

export default function ProjectView({ project: p }: { project: Project }) {
  const i = PROJECTS.findIndex((x) => x.slug === p.slug);
  const next = PROJECTS[(i + 1) % PROJECTS.length];
  const more = PROJECTS.length > 1;

  return (
    <main id="project">
      <header className="p-hero wrap">
        <div className="p-head">
          <h1>{p.title}</h1>
          <Link className="back" href="/#proyectos">
            Todos los proyectos
          </Link>
        </div>
        <R as="p" className="lede" html={p.summary} />
        <div style={{ marginTop: 20 }}>
          <TagList tags={p.tags} />
        </div>
        {p.tldr && (
          <dl className="tldr">
            {p.tldr.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <R as="dd" html={v} />
              </div>
            ))}
          </dl>
        )}
        <dl className="facts">
          {p.facts.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              {Array.isArray(v) ? (
                <dd>
                  <span className="spaced">
                    {v.map((x) => (
                      <span key={x}>{x}</span>
                    ))}
                  </span>
                </dd>
              ) : (
                <R as="dd" html={v} />
              )}
            </div>
          ))}
        </dl>
        <div className="p-cover">
          <Figure src={p.cover} alt={p.coverAlt} />
        </div>
        <div className="stats">
          {p.stats.map(([n, l]) => (
            <div className="stat" key={l}>
              <b>{n}</b>
              <span>{l}</span>
            </div>
          ))}
        </div>
      </header>
      <div className="wrap layout">
        <nav className="toc" aria-label="Contenido">
          <ol>
            {p.chapters.map((c) => (
              <li key={c.id}>
                <a href={`#${c.id}`}>{c.title}</a>
              </li>
            ))}
          </ol>
        </nav>
        <div>
          {p.chapters.map((c) => (
            <section className="chapter" id={c.id} key={c.id}>
              <h2>{c.title}</h2>
              {c.blocks.map((b, k) => (
                <BlockView key={k} b={b} />
              ))}
            </section>
          ))}
        </div>
      </div>
      <div className="wrap next">
        <Link className="big" href={more ? `/casos/${next.slug}/` : "/#proyectos"}>
          {more ? next.short || next.title : "Volver a la portada"} →
        </Link>
      </div>
      <ProjectEffects />
    </main>
  );
}
