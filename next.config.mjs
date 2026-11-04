/** Sitio estático: `next build` genera la carpeta `out/` lista para GitHub Pages. */
const config = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};
export default config;
