import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROJECTS, SITE } from "@/data";
import { plain } from "@/lib";
import ProjectView from "@/components/ProjectView";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const p = PROJECTS.find((x) => x.slug === slug);
  if (!p) return {};
  const title = `${p.title} - ${plain(SITE.shortName)}`;
  const image = p.ogImage || "/assets/og.jpg";
  return {
    title,
    description: p.summary,
    alternates: { canonical: `/casos/${p.slug}/` },
    openGraph: { type: "article", title, description: p.summary, url: `/casos/${p.slug}/`, images: [image] },
    twitter: { card: "summary_large_image", images: [image] },
  };
}

export default async function CasePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);
  if (!project) notFound();
  return <ProjectView project={project} />;
}
