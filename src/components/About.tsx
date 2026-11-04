"use client";
import { useEffect, useRef } from "react";
import { SITE } from "@/data";
import { rich } from "@/lib/format";
import { initScene } from "@/lib/scene";
import { initGlobe } from "@/lib/globe";
import Ico from "./Ico";
import Skills from "./Skills";

export default function About() {
  const scene = useRef<HTMLDivElement>(null);
  const globe = useRef<HTMLDivElement>(null);

  // La escena SVG y el globo se dibujan de forma imperativa; cada uno devuelve su función de limpieza.
  useEffect(() => {
    const stopScene = initScene(scene.current!);
    const stopGlobe = initGlobe(globe.current!, SITE.home);
    return () => { stopScene(); stopGlobe(); };
  }, []);

  return (
    <section className="section" id="sobre-mi" aria-labelledby="t-sobre">
      <div className="wrap">
        <div className="about-view">
          <div className="section-head"><h2 id="t-sobre">Sobre mí</h2></div>
          <div className="about">
            <div className="about-left">
              <div className="prose" id="about-text">
                {SITE.about.map((t, i) => <p key={i} dangerouslySetInnerHTML={{ __html: rich(t) }} />)}
              </div>
              <div id="scene" ref={scene} />
            </div>
            <div className="globe" id="globe" ref={globe}>
              <div className="globe-stage">
                <canvas className="globe-canvas" tabIndex={0} role="img" aria-label="Globo terráqueo. Arrástralo para girarlo." />
              </div>
              <p className="globe-caption" aria-live="polite"><strong></strong> <span></span></p>
              <div className="globe-bar">
                <button className="btn ghost globe-locate" type="button" hidden><Ico name="compass" size={16} /><span>Ubicarme</span></button>
              </div>
              <p className="globe-note">Tu ubicación se estima por IP con un servicio externo (geojs.io). No guardo nada.</p>
            </div>
          </div>
        </div>
        <Skills />
      </div>
    </section>
  );
}
