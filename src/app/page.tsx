import { SITE, SITE_URL } from "@/data";
import Hero from "@/components/Hero";
import ProjectsSection from "@/components/ProjectsSection";
import About from "@/components/About";
import Contact from "@/components/Contact";

const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: SITE.name,
  jobTitle: "Ingeniera de Sistemas",
  url: SITE_URL + "/",
  sameAs: SITE.contact.links.map((l) => l.href),
};

export default function Home() {
  return (
    <main id="main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />
      <Hero />
      <ProjectsSection />
      <About />
      <Contact />
    </main>
  );
}
