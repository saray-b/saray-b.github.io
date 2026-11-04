# Portafolio de Saray Berrio

Portafolio de diseño de producto y desarrollo front-end, con estilo editorial en blanco y negro.

**Ver el sitio: https://saray-b.github.io**

## Qué incluye

- Portada con proyectos, sobre mí y contacto.
- Caso de estudio de **Evalúa**, una plataforma de selección de personal para el sector público (información anonimizada).
- Modo claro por defecto y modo oscuro con un interruptor.
- Sin cookies ni analítica.

## Tecnologías

- **Next.js 15** (App Router, exportación estática), **React 19** y **TypeScript**.
- CSS propio con variables, sin librerías de estilos. Tipografía Jost alojada en el proyecto.
- **d3-geo** y **world-atlas** para el globo; la escena de "Sobre mí" es SVG animado a mano.
- **ESLint**, **Prettier** y **Playwright** (pruebas de extremo a extremo).
- **GitHub Actions** compila, prueba y publica en GitHub Pages en cada cambio a `main`.

## Cómo correrlo

```
npm install
npm run dev        # servidor de desarrollo en http://localhost:3000
npm run build      # genera el sitio estático en out/
npm test           # pruebas (requieren haber hecho build antes)
npm run lint       # ESLint
npm run typecheck  # TypeScript
```

## Estructura

```
src/app/           páginas (portada, /casos/[slug], 404, sitemap y robots)
src/components/    componentes de React
src/lib/           escena animada, globo y utilidades
src/data/          textos y proyectos (site.json, projects.json)
public/assets/     imágenes, fuentes e iconos
tests/             pruebas de Playwright
legacy/            versión anterior en HTML, CSS y JS (solo referencia)
```

## Añadir un proyecto

1. Copia las imágenes a `public/assets/<proyecto>/` y optimízalas con `node tools/optimizar-imagenes.js public/assets/<proyecto>` (necesita `npm install -D sharp`).
2. Añade el proyecto en `src/data/projects.json` (sigue la forma del que ya existe y los tipos de `src/data/types.ts`).
3. Las dimensiones de las imágenes se registran solas en `src/data/img-dims.json` al optimizarlas.

La portada y la página del caso (`/casos/<slug>/`) se generan solas, con su SEO.

## Contacto

[LinkedIn](https://www.linkedin.com/in/saray-berr%C3%ADo-166941287/) · sarayberrio08@gmail.com
