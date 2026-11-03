/* Genera lo que el navegador no puede inventar por sí solo para buscadores y redes sociales:
     - las etiquetas de la cabecera de index.html (descripción, Open Graph, Twitter, datos estructurados);
     - un texto de respaldo (<noscript>) con lo esencial, para quien no ejecuta JavaScript;
     - una página fija por proyecto (caso-<proyecto>.html) con su propia vista previa al compartir el enlace;
     - robots.txt y sitemap.xml.

   Uso (no necesita instalar nada):
     node tools/generar-seo.js                      (sin dirección: omite las etiquetas que exigen una URL completa)
     node tools/generar-seo.js https://tudominio.com   (con la dirección donde publiques el sitio)

   Vuelve a ejecutarlo cada vez que cambies textos o añadas un proyecto. Comparte los enlaces caso-<proyecto>.html. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const write = (f, t) => fs.writeFileSync(path.join(root, f), t);
const base = (process.argv[2] || "").replace(/\/+$/, "");
if (base && !/^https?:\/\//.test(base)) { console.error("La dirección debe empezar por https:// (por ejemplo https://tudominio.com)"); process.exit(1); }

const win = {};
for (const f of ["js/site.js", "js/projects.js"]) vm.runInNewContext(read(f), { window: win });
const S = win.SITE, P = win.PROJECTS;
const plain = (s) => String(s).replace(/\*\*?|\[|\]/g, "");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const abs = (p) => (base ? base + "/" + p : p);
const name = plain(S.shortName || S.name);

function seoHead({ title, description, file, image }) {
  const t = [
    `<meta name="description" content="${esc(description)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${esc(name)}">`,
    `<meta property="og:locale" content="es_CO">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta name="twitter:card" content="${base ? "summary_large_image" : "summary"}">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
  ];
  if (base) {
    t.push(`<link rel="canonical" href="${abs(file === "index.html" ? "" : file)}">`);
    t.push(`<meta property="og:url" content="${abs(file === "index.html" ? "" : file)}">`);
    t.push(`<meta property="og:image" content="${abs(image || "assets/og.jpg")}">`);
    t.push(`<meta name="twitter:image" content="${abs(image || "assets/og.jpg")}">`);
  }
  return t.map((x) => "  " + x).join("\n");
}

function replaceBetween(html, tag, inner) {
  const re = new RegExp(`(<!-- ${tag}:inicio -->)[\\s\\S]*?(<!-- ${tag}:fin -->)`);
  if (!re.test(html)) throw new Error(`Falta el marcador ${tag}:inicio / ${tag}:fin`);
  return html.replace(re, (_, a, b) => `${a}\n${inner}\n  ${b}`);
}

/* ── Inicio ── */
const full = `${plain(S.headline)} ${plain(S.lede)}`;
const description = full.length > 200 ? full.slice(0, 200).replace(/\s+\S*$/, "") + "…" : full;
let index = read("index.html");
const person = base ? `\n  <script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org", "@type": "Person", name: plain(S.name), jobTitle: "Ingeniera de Sistemas", url: base + "/",
  sameAs: ((S.contact && S.contact.links) || []).map((l) => l.href),
})}</script>` : "";
index = replaceBetween(index, "seo", seoHead({ title: `${name} - Portafolio`, description, file: "index.html" }) + person);
index = replaceBetween(index, "ns", `    <noscript>
      <div class="wrap">
        <h1>${esc(plain(S.headline))}</h1>
        <p>${esc(plain(S.lede))}</p>
        <ul>${P.map((p) => `<li><a href="caso-${esc(p.slug)}.html">${esc(p.title)}</a>: ${esc(p.summary)}</li>`).join("")}</ul>
        <p>Contacto: <a href="mailto:${esc(plain(S.contact.email))}">${esc(plain(S.contact.email))}</a></p>
        <p>Este sitio usa JavaScript para mostrarse completo.</p>
      </div>
    </noscript>`);
write("index.html", index);

/* ── Página genérica de casos (project.html) y una página fija por proyecto ── */
let tpl = read("project.html");
tpl = replaceBetween(tpl, "seo", seoHead({ title: `Casos de estudio - ${name}`, description: `Casos de estudio de ${name}: diseño y desarrollo de interfaces.`, file: "project.html" }));
tpl = replaceBetween(tpl, "ns", `    <noscript><div class="wrap"><p>Este caso de estudio necesita JavaScript. <a href="index.html">Volver al inicio</a>.</p></div></noscript>`);
write("project.html", tpl);

for (const p of P) {
  const file = `caso-${p.slug}.html`;
  const cover = p.ogImage || "assets/og.jpg"; // JPG o PNG: LinkedIn y WhatsApp no siempre aceptan WebP
  let h = tpl;
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(p.title)} - ${esc(name)}</title>`);
  h = replaceBetween(h, "seo", seoHead({ title: `${p.title} - ${name}`, description: plain(p.summary), file, image: cover }));
  h = h.replace('<body data-page="project">', `<body data-page="project" data-slug="${esc(p.slug)}">`);
  h = replaceBetween(h, "ns", `    <noscript>
      <div class="wrap">
        <h1>${esc(p.title)}</h1>
        <p>${esc(plain(p.summary))}</p>
        ${p.tldr ? `<dl>${p.tldr.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(plain(v))}</dd>`).join("")}</dl>` : ""}
        <p>El caso completo necesita JavaScript. <a href="index.html">Volver al inicio</a>.</p>
      </div>
    </noscript>`);
  write(file, h);
}

/* ── robots.txt y sitemap.xml ── */
write("robots.txt", `User-agent: *\nAllow: /\n${base ? `Sitemap: ${base}/sitemap.xml\n` : ""}`);
if (base) {
  const urls = ["", ...P.map((p) => `caso-${p.slug}.html`)];
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${base}/${u}</loc></url>`).join("\n")}\n</urlset>\n`);
} else if (fs.existsSync(path.join(root, "sitemap.xml"))) fs.unlinkSync(path.join(root, "sitemap.xml"));

console.log(`Listo: index.html, project.html, ${P.length} página(s) caso-*.html, robots.txt${base ? " y sitemap.xml" : ""}.`);
if (!base) console.log("Cuando publiques el sitio, ejecútalo con tu dirección para activar canonical, og:image y sitemap.xml.");
