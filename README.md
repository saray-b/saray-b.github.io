# Portafolio

Sitio estático (HTML + CSS + JS, sin instalar nada). Para verlo: abre `index.html` con doble clic.

## Estructura

```
index.html            portada (proyectos, sobre mí, contacto)
project.html          caso de estudio (se llena solo con ?p=<slug>)
assets/logo.svg       logo (avatar en positivo, fondo claro) y favicon
css/style.css         estilos y tokens (claro/oscuro automático)
js/site.js            TUS datos: nombre, texto, habilidades, contacto
js/projects.js        los proyectos (uno por objeto)
js/render.js          dibuja todo; normalmente no se toca
assets/<proyecto>/    imágenes de cada proyecto
```

## Primera vista

Portada tipo periódico: doble filete, titular enorme y cinco ilustraciones estilo kawaii en blanco y negro con trama de puntos (SVG en `assets/hero/`). Las fotos se mueven apenas con el cursor y la trama se disipa al pasar el ratón. Para ver la versión simple (solo titular) añade `?hero=texto` a la dirección. Con `prefers-reduced-motion` activado en el sistema, el movimiento se detiene.

## Globo de "Sobre mí"

Globo terráqueo dibujado con d3-geo (las librerías y los continentes están en `assets/vendor/`). **No pide permiso de ubicación**: al cargar la página consulta la ubicación aproximada del visitante a partir de su dirección IP, usando un servicio externo gratuito (`get.geojs.io`, con `ipwho.is` de respaldo). Ese servicio recibe la IP del visitante (como cualquier sitio que visita) y el portafolio no guarda nada. Al llegar a la sección, el globo parte del punto del visitante, se aleja, aparece Cartagena, se dibuja un arco y se muestra la distancia: "a unos X km de tu ubicación actual, según tu dirección IP". La ubicación por IP es aproximada (a nivel de ciudad o de proveedor de internet). Si los servicios fallan o están bloqueados, el globo muestra solo mi ciudad.

El globo se ve siempre entero (con borde circular) y solo se gira (arrastrar con ratón o dedo, o con las flechas); no hay zoom. El botón "Ubicarme" lo gira de nuevo para mostrar dónde está cada punto. Mi ciudad se cambia en `home` de `js/site.js`.

**Probar cómo lo vería otra persona (sin VPN):** añade a la dirección `?lugar=-23.55,-46.63` (latitud,longitud; ese ejemplo es São Paulo) o `?ip=200.160.2.3` (consulta la ubicación de esa IP, que es de Brasil). El texto del globo dice «en modo de prueba» para que no se confunda con la ubicación real. Para la prueba de verdad, abre el sitio ya publicado con una VPN con salida en Brasil: sin ningún parámetro, el globo usará esa IP.

Bajo el texto de "Sobre mí" hay una escena animada en SVG (`js/scene.js`, se monta con `initZombieScene`): yo programando con audífonos y notas musicales, el gato dormido y un zombi que pasa dos veces por las ventanas; yo dudo y volteo, pero siempre llego tarde, y vuelvo a programar. Es la animación hecha en Claude Design, portada a JavaScript simple: todo se dibuja en función del tiempo (ciclo de 18,2 s, secciones y cámara definidas al inicio del archivo). Se pausa fuera de pantalla y con la pestaña oculta, muestra un cuadro fijo con "reducir movimiento" y se adapta al modo oscuro. El bloque de texto, la escena y el globo ocupan una sola pantalla; las herramientas quedan debajo.

## Proyectos en una sola vista

La sección Proyectos ocupa una pantalla cuando hay 1 o 2 proyectos (1 = destacado, 2 = dos columnas). Desde el tercero se acomodan en una cuadrícula hacia abajo y aparecen los filtros por etiqueta.

## Tipografía y paleta

- Tipografía: **Futura** si está instalada (macOS, iOS) y **Jost** (equivalente libre de Google Fonts) como respaldo. Futura es de pago y no se puede incluir en la carpeta; si la compras, súbela a `assets/fonts/` y decláralo con `@font-face` en `css/style.css`.
- Paleta en blanco y negro (variables al inicio de `css/style.css`): papel `#ffffff`, tinta `#0a0a0a`, sin color de acento. Hay versión oscura automática.
- Paletas alternativas: `?paleta=durazno` (papel durazno + burdeos) o `?paleta=gris` (gris prensa + rojo) en la dirección, o `palette: "durazno"` en `js/site.js`.
- La primera vista (titular + presentación) ocupa exactamente una pantalla en escritorio: su altura es `100svh` menos la cabecera.

## Lo primero: rellenar pendientes

Todo texto entre corchetes `[así]` aparece **resaltado en amarillo** en la página.
Son datos que solo tú sabes (tu nombre, rol, duración, resultados, correo).
Búscalos en `js/site.js` y `js/projects.js` y reemplázalos; cuando no quede nada amarillo, está listo.

## Añadir un proyecto nuevo

1. Crea `assets/<mi-proyecto>/` y copia ahí las imágenes (PNG o JPG; ancho ~1400 px). Luego optimízalas con `node tools/optimizar-imagenes.js assets/<mi-proyecto>` (necesita `npm install sharp`): crea versiones WebP y el sitio elige solo la del tamaño adecuado. En `js/projects.js` usa las rutas `.webp`.
2. En `js/projects.js`, copia el bloque `PLANTILLA` del final, pégalo arriba y rellénalo.
3. Listo: aparece en la portada, con su filtro por etiquetas y su página de caso de estudio.

Los bloques disponibles (`p`, `ul`, `image`, `pair`, `compare`, `phones`, `colors`, `decisions`, `note`)
están descritos al inicio de `js/projects.js`.

## Resumen de tres líneas

Cada proyecto puede llevar `tldr: [["Problema", "…"], ["Mi rol", "…"], ["Resultado", "…"]]` en `js/projects.js`: se muestra como un recuadro al inicio del caso, antes de los datos.

## Buscadores y vista previa al compartir

Cuando publiques el sitio, ejecuta **una vez** (y cada vez que cambies textos o añadas un proyecto):

```
node tools/generar-seo.js https://tu-dominio.com
```

Esto actualiza las etiquetas de la cabecera de `index.html` (descripción, Open Graph, Twitter, canonical y datos estructurados), el texto de respaldo para quien no ejecuta JavaScript, una página fija por proyecto (`caso-<proyecto>.html`, con su propia vista previa) y `robots.txt` y `sitemap.xml`. Comparte los enlaces `caso-*.html`. Las imágenes de vista previa son `assets/og*.jpg` (JPG, no WebP, porque LinkedIn y WhatsApp no siempre aceptan WebP); para un proyecto nuevo, añade `ogImage: "assets/og-mi-proyecto.jpg"` en `js/projects.js`.

## Privacidad

- La tipografía Jost está en `assets/fonts/` (sin Google Fonts). No hay cookies ni analítica.
- La única consulta externa es la del globo (`get.geojs.io`, con `ipwho.is` de respaldo) para estimar la ubicación por IP. Está avisado en la página, no se guarda nada y no se consulta si el navegador pide no ser rastreado (Do Not Track o Global Privacy Control).
- La animación de «Sobre mí» va a 30 cuadros por segundo en pantallas táctiles.

## Probar el modo oscuro y la tipografía

- Añade `?tema=oscuro` (o `?tema=claro`) a la dirección para ver cada modo sin cambiar el del sistema. En oscuro, la escena de «Sobre mí» no invierte colores: el afro y el gato siguen negros y llevan un borde gris claro.
- Escala del texto corrido (variables `--fs-*` al final de `css/style.css`): etiqueta 12 · pequeño 14 · texto 16 · cuerpo 17 · entradilla 22. Los títulos tienen su propia escala. Usa estas variables en lugar de tamaños sueltos.
- Los títulos enormes usan «Jost Display» (la misma Jost con una caja de texto más baja) para que el resaltado al seleccionar no invada las líneas vecinas.

## Estadísticas de visitas (opcional)

Por defecto el sitio no usa ninguna. Si quieres contar visitas sin cookies, crea el sitio en plausible.io y escribe tu dominio en `analytics: { domain: "tudominio.com" }` de `js/site.js`. No se carga si la persona pidió no ser rastreada, y el pie lo avisa.

## Modo claro y oscuro

El sitio abre siempre en claro, aunque el navegador esté en oscuro. El interruptor de la cabecera (luna o sol) cambia a oscuro y recuerda la elección en ese navegador. `?tema=oscuro` o `?tema=claro` en la dirección fuerzan un modo para pruebas.

## Publicar en la nube (resumen)

El sitio es estático: cualquier alojamiento gratuito de páginas estáticas sirve. Pasos con Netlify (el más rápido): entra a app.netlify.com/drop, arrastra esta carpeta y se publica en una dirección `algo.netlify.app`. Con GitHub Pages: sube la carpeta a un repositorio, en Settings → Pages elige la rama principal y la raíz. Con la dirección ya definida, ejecuta `node tools/generar-seo.js https://tu-direccion`, vuelve a subir los archivos y revisa la vista previa al compartir el enlace.

## Antes de publicar

- Cada proyecto con trabajo de un cliente o empleador debe tener permiso por escrito y estar anonimizado.
- Revisa que ninguna imagen muestre nombres, logos o datos reales.
- Publicación gratuita sencilla: GitHub Pages, Netlify o Cloudflare Pages (sirve la carpeta tal cual).
