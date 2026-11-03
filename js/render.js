/* Dibuja la portada y los casos de estudio a partir de SITE y PROJECTS. */
(function () {
  const S = window.SITE, P = window.PROJECTS;
  const $ = (sel, el = document) => el.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Escapa y aplica **negrita**, *cursiva* y [pendientes] resaltados.
  const rich = (s) =>
    esc(s)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]/g, '<span class="todo">[$1]</span>');
  const plain = (s) => String(s).replace(/[\[\]*]/g, "");
  const tagList = (tags) => `<span class="tags">${tags.map((t) => `<span>${esc(t)}</span>`).join("")}</span>`;
  // Icono monocromo desde assets/icons (un <img> funciona también al abrir el HTML con doble clic).
  const ico = (name, size = 22) => `<img class="ico" src="assets/icons/${esc(name)}.svg" alt="" width="${size}" height="${size}" loading="lazy">`;
  // Un valor de ficha puede ser texto o una lista: la lista se separa con espacio, nunca con puntos.
  const factValue = (v) => (Array.isArray(v) ? `<span class="spaced">${v.map((x) => `<span>${esc(x)}</span>`).join("")}</span>` : rich(v));

  // Portada a la que apuntan los enlaces (index-collage.html conserva su variante).
  const HOME = document.body.dataset.home || "index.html";
  // Paleta: la de js/site.js o la de la dirección (?paleta=gris para la alternativa gris + rojo).
  const palette = new URLSearchParams(location.search).get("paleta") || S.palette;
  if (palette) document.documentElement.dataset.palette = palette;
  // ?tema=oscuro o ?tema=claro: para probar los dos modos sin cambiar el del sistema.
  const tema = new URLSearchParams(location.search).get("tema");
  if (tema === "oscuro" || tema === "claro") document.documentElement.dataset.theme = tema === "oscuro" ? "dark" : "light";
  // Estadísticas anónimas opcionales (Plausible, sin cookies): solo si pones analytics.domain en js/site.js y la persona no pidió no ser rastreada.
  const A = S.analytics;
  if (A && A.domain && navigator.doNotTrack !== "1" && navigator.globalPrivacyControl !== true) {
    const sc = document.createElement("script");
    sc.defer = true; sc.dataset.domain = A.domain; sc.src = A.src || "https://plausible.io/js/script.js";
    document.head.appendChild(sc);
  }

  /* ───── Cabecera, pie y visor de zoom (comunes) ───── */
  function chrome(page) {
    $("#site-header").innerHTML = `
      <div class="wrap">
        <a class="brand" href="${HOME}"><img class="brand-logo" src="assets/logo.svg" alt="" width="36" height="36"><span class="brand-name">${esc(S.shortName || S.name)}</span></a>
        <div class="header-right">
          <nav class="nav" aria-label="Principal">
            <a href="${HOME}#proyectos" ${page === "project" ? 'aria-current="page"' : ""}>Proyectos</a>
            <a href="${HOME}#sobre-mi">Sobre mí</a>
            <a href="${HOME}#contacto">Contacto</a>
          </nav>
          <button class="theme-toggle" id="theme-toggle" type="button" aria-label="Modo oscuro" aria-pressed="false">
            <svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
            <svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>`;
    // Interruptor de modo oscuro: claro por defecto; la elección se recuerda en este navegador.
    const root = document.documentElement, toggle = $("#theme-toggle");
    const syncToggle = () => toggle.setAttribute("aria-pressed", String(root.dataset.theme === "dark"));
    toggle.addEventListener("click", () => {
      const dark = root.dataset.theme !== "dark";
      root.dataset.theme = dark ? "dark" : "light";
      try { localStorage.setItem("tema", dark ? "dark" : "light"); } catch (_) { /* sin almacenamiento: solo dura esta visita */ }
      syncToggle();
    });
    syncToggle();
    $("#site-footer").innerHTML = `<div class="wrap"><span>© ${S.year} ${esc(S.name)}</span><span>${S.analytics && S.analytics.domain ? "Sin cookies. Visitas contadas de forma anónima (Plausible)." : "Sin cookies ni analítica."}</span></div>`;
    const dlg = document.createElement("dialog");
    dlg.className = "lightbox";
    dlg.innerHTML = '<button class="lb-close" type="button" aria-label="Cerrar">✕</button>';
    const big = document.createElement("img"); big.alt = ""; // el src se asigna al hacer clic en una imagen
    dlg.appendChild(big);
    document.body.appendChild(dlg);
    // Con el visor abierto, la página de atrás no se desplaza ni su barra de scroll se mueve.
    const lockScroll = (on) => document.documentElement.classList.toggle("no-scroll", on);
    dlg.addEventListener("close", () => lockScroll(false)); // también al pulsar Esc
    dlg.addEventListener("click", (e) => { if (e.target !== big) dlg.close(); });
    dlg.setAttribute("aria-label", "Imagen ampliada");
    const openZoom = (img) => { big.src = img.src; big.alt = img.alt; lockScroll(true); dlg.showModal(); };
    document.addEventListener("click", (e) => {
      const img = e.target.closest("[data-zoom]");
      if (img) openZoom(img);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const img = e.target.closest && e.target.closest("[data-zoom]");
      if (!img) return;
      e.preventDefault(); openZoom(img);
    });
  }

  /* ───── Portada tipo periódico (variante "collage"): papel blanco, tinta negra, fotos en blanco y negro con trama de puntos ───── */
  function collage() {
    // [archivo, pie de foto, desplazamiento con el cursor (px), retardo de entrada (s)]
    const photo = (area, [file, cap, k, d]) =>
      `<figure class="ph ph-${area}" style="--k:${k};--d:${d}s"><div class="ph-img"><img src="assets/hero/${file}.svg" alt="" loading="lazy"></div><figcaption>${esc(cap)}</figcaption></figure>`;
    return `
      <div class="wrap np">
        <div class="np-copy">
          <h1 class="display">${rich(S.headline)}</h1>
          <div class="np-foot">
            <p class="lede">${rich(S.lede)}</p>
            <div class="actions">
              <a class="btn" href="#proyectos">Ver proyectos</a>
              <a class="btn ghost" href="#contacto">Contacto</a>
            </div>
          </div>
        </div>
        <div class="np-photos">
          ${photo("a", ["diseno", "Diseño", 6, 0.05])}
          ${photo("b", ["codigo", "Código", 10, 0.2])}
          ${photo("c", ["estetica", "Estética", 7, 0.35])}
          ${photo("d", ["rendimiento", "Optimización", 12, 0.5])}
          ${photo("e", ["soluciones", "Soluciones", 8, 0.65])}
        </div>
      </div>`;
  }
  // Las fotos se desplazan apenas con el cursor (solo con ratón y sin "reducir movimiento").
  function collageMotion() {
    const hero = $("#hero");
    if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const set = (x, y) => { hero.style.setProperty("--mx", x.toFixed(3)); hero.style.setProperty("--my", y.toFixed(3)); };
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2);
    });
    hero.addEventListener("pointerleave", () => set(0, 0));
  }

  /* ───── Skeletons: un destello gris hasta que cada imagen grande termina de cargar ───── */
  function watchImages(root) {
    root.querySelectorAll("img:not(.ico)").forEach((img) => {
      if (img.complete && img.naturalWidth) return;
      const host = img.closest(".frame, .cover, .ph-img") || img.parentElement;
      host.classList.add("skeleton");
      const done = () => host.classList.remove("skeleton");
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    });
  }

  /* ───── Escena chibi estilo sticker anime (blanco, negro y gris): yo programando con audífonos, un gato negro dormido y un zombi que se asoma por la puerta ─────
     Ciclo de 8 s con expresiones: alegría (tecleando) → sorpresa (¡!) → duda (¿?) → sospecha → alegría otra vez.
     El zombi sonríe con malicia al asomarse y se asusta al esconderse; el gato abre un ojo, desconfiado, mientras el zombi está a la vista.
     Los personajes son siluetas dibujadas con curvas (no figuras geométricas): contorno grueso, borde blanco tipo sticker y sombras en grises. */
  function studyScene() {
    const note = (x, y, d) =>
      `<g transform="translate(${x} ${y})"><g class="note" style="animation-delay:${d}s"><path class="solid" d="M-5 1 C-5 -2 -1 -4 2 -2 C4 0 3 3 0 4 C-3 5 -5 3 -5 1Z"/><path class="ln thin" d="M2 -1 V-15 q6 1 7 7"/></g></g>`;
    const line = (n, y, w) => `<rect class="solid code c${n}" x="356" y="${y}" width="${w}" height="5" rx="2.5"/>`;
    // Contorno orgánico en forma de nube (afro): n lóbulos de tamaño irregular, trazados con curvas
    const cloud = (cx, cy, r, n, bump) => {
      const wob = (i) => r * (1 + 0.06 * Math.sin(i * 2.3 + 1)), pts = [];
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 - Math.PI / 2; pts.push([cx + Math.cos(a) * wob(i), cy + Math.sin(a) * wob(i) * 0.92, a]); }
      let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
      for (let i = 0; i < n; i++) {
        const p = pts[i], q = pts[(i + 1) % n], qa = i === n - 1 ? q[2] + Math.PI * 2 : q[2], am = (p[2] + qa) / 2, rr = wob(i) + bump;
        d += ` Q${(cx + Math.cos(am) * rr).toFixed(1)} ${(cy + Math.sin(am) * rr * 0.92).toFixed(1)} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
      }
      return d + "Z";
    };
    const afro = cloud(240, 80, 38, 13, 13);
    return `
      <svg class="scene" viewBox="0 0 520 290" role="img" aria-label="Yo, con afro y gafas, programando en mi escritorio con audífonos y un gato negro dormido a mi lado, mientras un zombi se asoma por la puerta del cuarto y se esconde cada vez que volteo. Mi cara pasa de la alegría a la sorpresa, la duda y la sospecha.">
        <defs>
          <filter id="sticker" x="-12%" y="-12%" width="124%" height="124%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="d"/>
            <feFlood style="flood-color:var(--paper)" result="c"/>
            <feComposite in="c" in2="d" operator="in" result="halo"/>
            <feMerge><feMergeNode in="halo"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <line class="ln" x1="0" y1="278" x2="520" y2="278"/>

        <!-- puerta del cuarto: el zombi se asoma y se esconde -->
        <rect class="dark" x="16" y="64" width="98" height="214"/>
        <g class="zombie" filter="url(#sticker)">
          <path class="c3 ol" d="M68 230 C66 248 66 262 64 272 C70 277 82 277 84 271 C84 259 84 245 84 230Z"/>
          <path class="c3 ol" d="M90 230 C90 246 92 260 94 271 C100 277 110 275 110 269 C108 259 106 245 106 230Z"/>
          <path class="c2 ol" d="M62 186 C62 177 69 172 78 172 L99 172 C108 172 114 177 114 186 L115 234 L60 234Z"/>
          <path class="sh" d="M96 174 C108 176 113 180 114 190 L115 234 L100 234 C102 212 102 192 96 174Z"/>
          <path class="ln thin" d="M60 226 l6 9 l6 -9 l6 9 l6 -9 l6 9 l6 -9 l6 9 l5 -9 M72 173 C76 184 98 184 102 173 M70 202 C78 206 83 212 81 222"/>
          <g class="zhand">
            <path class="c2 ol" d="M64 190 C56 186 48 187 42 191 L41 209 C50 206 58 206 66 208Z"/>
            <path class="skin zskin ol" d="M43 190 C37 185 28 185 24 189 C20 193 22 199 26 201 C22 204 22 210 28 212 C34 215 40 213 44 208Z"/>
            <path class="ln thin" d="M27 190 C31 193 35 195 41 195 M27 202 C31 203 36 203 41 202"/>
          </g>
          <g class="zhead"><g transform="translate(82 152) scale(1.1) translate(-86 -150)">
            <path class="zskin ol" d="M58 154 C57 136 70 124 87 123 C104 124 115 135 114 153 C113 171 101 182 85 181 C69 180 59 170 58 154Z"/>
            <path class="sh" d="M92 126 C106 130 114 142 113 156 C112 170 104 178 94 181 C102 168 104 150 92 126Z"/>
            <path class="whair ol" d="M54 140 C48 128 49 114 56 103 C58 111 62 117 67 120 C64 106 68 92 77 84 C79 96 84 105 91 111 C95 97 103 87 113 83 C111 95 113 107 118 115 C124 110 128 104 132 100 C130 112 128 128 131 140 C121 131 112 126 98 126 C82 126 66 130 54 140Z"/>
            <path class="hl2" d="M72 104 C73 111 77 116 82 118 M95 100 C97 106 101 110 106 112 M60 114 C61 119 63 122 66 124 M118 118 C122 114 126 112 130 112"/>
            <path class="ln thin" d="M99 131 C106 137 106 144 102 150 M97 138 L107 135 M98 145 L106 143"/>
            <g class="zx zx-grin">
              <path class="solid" d="M67 150 C72 144 80 146 83 153 C77 154 71 154 67 150Z"/>
              <path class="solid" d="M107 150 C102 144 94 146 91 153 C97 154 103 154 107 150Z"/>
              <path class="ln thin" d="M66 141 L83 146 M108 141 L91 146"/>
              <path class="solid" d="M67 163 C73 179 101 179 107 163 C98 168 76 168 67 163Z"/>
              <path class="ln" style="stroke:var(--paper);stroke-width:2.4" d="M76 167 v6 M84 169 v7 M92 169 v7 M99 167 v6"/>
            </g>
            <g class="zx zx-shock">
              <path class="ew" d="M67 150 C67 143 73 141 78 143 C83 145 83 154 78 156 C72 158 67 156 67 150Z"/>
              <path class="ew" d="M107 150 C107 143 101 141 96 143 C91 145 91 154 96 156 C102 158 107 156 107 150Z"/>
              <path class="solid" d="M72 148 C73 145 77 146 76 150 C75 153 71 152 72 148Z"/>
              <path class="solid" d="M102 148 C101 145 97 146 98 150 C99 153 103 152 102 148Z"/>
              <path class="solid" d="M81 168 C81 160 93 160 93 168 C93 177 81 177 81 168Z"/>
              <path class="fl" d="M114 131 C110 138 109 142 114 145 C119 142 118 138 114 131Z"/>
            </g>
          </g></g>
        </g>
        <g class="leaf">
          <rect class="fl" x="16" y="64" width="98" height="214"/>
          <rect class="ln thin" x="30" y="80" width="70" height="70" rx="4"/>
          <rect class="ln thin" x="30" y="168" width="70" height="90" rx="4"/>
          <circle class="solid" cx="102" cy="176" r="4.5"/>
        </g>
        <rect class="ln" style="stroke-width:5" x="13" y="61" width="104" height="217"/>

        <!-- silla y yo -->
        <rect class="fl" x="196" y="132" width="12" height="90" rx="6"/>
        <g class="girl" filter="url(#sticker)">
          <path class="c2 ol" d="M213 156 C213 146 222 141 233 141 L249 141 C260 141 268 146 268 156 L270 224 L211 224Z"/>
          <path class="sh" d="M255 143 C265 146 269 152 269 160 L270 224 L252 224 C256 196 258 170 255 143Z"/>
          <path class="ln thin" d="M239 150 V212 M226 150 C226 160 230 166 236 170 M252 150 C252 160 248 166 242 170 M220 196 C228 200 232 208 230 220"/>
          <g class="lift">
            <g class="tap b"><g transform="translate(-9 3)">
              <path class="c3 ol" d="M241.7 169 C246 180 256 192 265 198 C277 206 288 213 298.4 215.2 L305.6 200.8 C292 198 282 190 275 186 C268 178 260 168 254.3 159Z"/>
              <path class="skin ol" d="M297 214 C293 206 297 197 306 197 C314 197 319 204 317 210 C315 217 304 221 297 214Z"/>
              <path class="ln thin" d="M308 198 C311 195 315 196 316 199 M311 205 C313 207 314 209 313 212"/>
            </g></g>
            <g class="tap">
              <path class="c1 ol" d="M241.7 169 C246 180 256 192 265 198 C277 206 288 213 298.4 215.2 L305.6 200.8 C292 198 282 190 275 186 C268 178 260 168 254.3 159Z"/>
              <path class="ln thin" d="M256 178 C261 180 264 184 265 190 M283 204 C288 205 292 207 295 210"/>
              <path class="skin ol" d="M297 214 C293 206 297 197 306 197 C314 197 319 204 317 210 C315 217 304 221 297 214Z"/>
              <path class="ln thin" d="M308 198 C311 195 315 196 316 199 M311 205 C313 207 314 209 313 212"/>
            </g>
          </g>
          <g transform="translate(0 10)"><g class="head">
            <path class="hair ol" d="${afro}"/>
            <path class="hl" d="M214 58 C218 50 226 50 229 56 M244 46 C249 40 258 42 259 49 M264 62 C271 58 278 62 277 69 M206 76 C202 84 208 91 215 89 M221 66 C225 72 224 78 219 81 M254 60 C259 63 260 68 257 72"/>
            <path class="skin ol" d="M206 104 C205 85 221 73 240 73 C259 73 275 85 274 104 C273 122 262 136 241 140 C219 136 207 122 206 104Z"/>
            <path class="sh" d="M258 80 C270 86 275 96 274 106 C273 122 264 134 252 138 C260 124 262 100 258 80Z"/>
            <path class="hair" d="M205 98 C204 84 216 74 232 72 C226 82 226 88 232 90 C240 80 252 80 256 90 C260 86 262 80 258 72 C268 76 276 86 275 98 C268 90 256 84 240 86 C224 84 212 90 205 98Z"/>
            <path class="ln" style="stroke-width:9" d="M199 98 C197 38 283 38 281 98"/>
            <path class="band" d="M199 98 C197 38 283 38 281 98"/>
            <path class="solid" d="M196 98 C190 98 188 108 189 116 C190 126 196 128 202 126 C208 124 210 114 209 106 C208 98 202 96 196 98Z"/>
            <path class="solid" d="M284 98 C290 98 292 108 291 116 C290 126 284 128 278 126 C272 124 270 114 271 106 C272 98 278 96 284 98Z"/>
            <path class="wl" d="M194 104 C192 110 193 116 195 120 M286 104 C288 110 287 116 285 120"/>
            <path class="lens" d="M213 101 C213 95 218 92 226 92 C234 92 239 96 239 103 C239 111 233 117 225 117 C217 117 213 109 213 101Z"/>
            <path class="lens" d="M267 101 C267 95 262 92 254 92 C246 92 241 96 241 103 C241 111 247 117 255 117 C263 117 267 109 267 101Z"/>
            <path class="glare" d="M218 98 L224 95 M262 98 L256 95"/>
            <path class="ln thin" d="M239 102 H241 M213 103 L206 105 M267 103 L274 105"/>
            <g class="fx fx-happy">
              <path class="ln" d="M218 108 C220 99 232 99 234 108 M246 108 C248 99 260 99 262 108"/>
              <path class="solid" d="M229 123 C230 134 250 134 251 123 C246 125 234 125 229 123Z"/>
              <path class="tongue" d="M234 130 C238 127 244 127 246 130 C242 133 238 133 234 130Z"/>
              <path class="blush" d="M209 122 C213 119 219 120 221 124 C216 127 211 126 209 122Z M259 124 C261 120 267 119 271 122 C269 126 264 127 259 124Z"/>
            </g>
            <g class="fx fx-surprise">
              <path class="solid" d="M219 103 C219 97 223 95 226 95 C230 95 233 98 233 103 C233 109 230 112 226 112 C222 112 219 108 219 103Z"/>
              <path class="solid" d="M247 103 C247 97 251 95 254 95 C258 95 261 98 261 103 C261 109 258 112 254 112 C250 112 247 108 247 103Z"/>
              <path class="whi" d="M222 99 C224 97 226 98 225 100 C224 102 222 101 222 99Z M250 99 C252 97 254 98 253 100 C252 102 250 101 250 99Z"/>
              <path class="ln thin" d="M215 88 C220 83 230 83 235 88 M245 88 C250 83 260 83 265 88"/>
              <path class="solid" d="M236 126 C236 121 244 121 244 126 C244 132 236 132 236 126Z"/>
              <path class="fl" d="M284 100 C281 106 279 110 284 113 C289 110 287 106 284 100Z"/>
            </g>
            <g class="fx fx-doubt">
              <path class="solid" d="M217 101 C217 96 221 94 224 95 C228 96 229 101 227 105 C224 108 218 107 217 101Z"/>
              <path class="solid" d="M245 101 C245 96 249 94 252 95 C256 96 257 101 255 105 C252 108 246 107 245 101Z"/>
              <path class="ln thin" d="M214 90 C220 82 229 83 235 88 M246 97 C252 95 259 96 264 98"/>
              <path class="ln thin" d="M229 127 C232 123 235 130 239 127 C243 124 246 130 251 127"/>
            </g>
            <g class="fx fx-suspect">
              <path class="lid" d="M213 104 C214 96 220 93 226 93 C232 93 238 96 239 104Z"/>
              <path class="lid" d="M241 104 C242 96 248 93 254 93 C260 93 266 96 267 104Z"/>
              <path class="solid" d="M218 107 C221 103 230 103 234 107 C231 111 222 111 218 107Z"/>
              <path class="solid" d="M246 107 C249 103 258 103 262 107 C259 111 250 111 246 107Z"/>
              <path class="ln thin" d="M213 94 L233 99 M267 94 L247 99"/>
              <path class="ln thin" d="M232 128 C238 131 246 129 250 124"/>
              <path class="fl" d="M280 122 C277 127 276 130 280 133 C284 130 283 127 280 122Z"/>
            </g>
          </g></g>
        </g>
        <text class="mk ex" x="298" y="66">!</text>
        <text class="mk qm" x="298" y="66">?</text>
        <g class="notes">${note(304, 46, 0)}${note(322, 34, -0.9)}${note(290, 30, -1.7)}</g>

        <!-- portátil con código -->
        <rect class="zf" x="266" y="208" width="84" height="8" rx="3"/>
        <path class="ln thin" d="M276 212 h64" stroke-dasharray="3 4"/>
        <rect class="fl" x="346" y="128" width="92" height="80" rx="6"/>
        <rect class="fl" x="386" y="208" width="12" height="8"/>
        ${line(1, 142, 66)}${line(2, 154, 48)}${line(3, 166, 72)}${line(4, 178, 40)}${line(5, 190, 58)}

        <!-- escritorio -->
        <rect class="fl" x="150" y="216" width="364" height="12" rx="3"/>
        <rect class="zf" x="160" y="228" width="344" height="20" rx="3"/>
        <rect class="zf" x="168" y="248" width="10" height="30"/><rect class="zf" x="488" y="248" width="10" height="30"/>

        <!-- gato negro dormido (silueta con detalles en blanco) -->
        <g class="catg" filter="url(#sticker)"><g class="breathe">
          <path class="solid" d="M426 208 C425 198 429 192 435 190 L433 177 C436 176 441 179 444 184 C447 183 451 183 453 184 L461 176 C463 177 464 183 463 189 C474 178 495 175 507 187 C517 197 517 211 509 216 L435 216 C429 216 426 213 426 208Z"/>
          <path class="wl" d="M436 185 C438 183 441 184 442 187 M455 187 C457 184 460 183 461 181"/>
          <path class="wl cat-shut" d="M451 201 H458"/>
          <path class="wl" d="M437 201 H444"/>
          <g class="cat-open"><path class="whi2" d="M450 201 C451 196 458 196 459 201Z"/><path class="solid" d="M453 200 H457"/></g>
          <path class="wl" style="stroke-width:1.8" d="M444 206 C445 209 448 209 448 206 C448 209 451 209 452 206"/>
          <path class="wl" d="M432 214 C435 210 441 210 444 214 M447 214 C450 210 456 210 459 214"/>
          <path class="hl" style="stroke-width:1.8" d="M477 188 C486 185 497 187 501 194"/>
        </g></g>
        <text class="zz" x="450" y="176" style="animation-delay:0s">z</text>
        <text class="zz" x="462" y="166" style="animation-delay:-1.1s">z</text>
        <text class="zz" x="474" y="156" style="animation-delay:-2.1s">z</text>
      </svg>`;
  }

  /* ───── Portada ───── */
  function renderHome() {
    document.title = `${plain(S.shortName || S.name)} - Portafolio`;
    const heroMode = new URLSearchParams(location.search).get("hero") || document.body.dataset.hero || S.hero || "texto";
    const heroBody = `
      <h1 class="display">${rich(S.headline)}</h1>
      <div class="hero-side">
        <p class="lede">${rich(S.lede)}</p>
        <div class="actions">
          <a class="btn" href="#proyectos">Ver proyectos</a>
          <a class="btn ghost" href="#contacto">Contacto</a>
        </div>
      </div>`;
    if (heroMode === "collage") {
      $("#hero").className = "hero-collage";
      $("#hero").innerHTML = collage();
      collageMotion();
    } else {
      $("#hero").innerHTML = heroBody;
    }
    watchImages($("#hero"));

    const tags = [...new Set(P.flatMap((p) => p.tags))];
    $("#filters").innerHTML = tags.length > 1
      ? ["Todos", ...tags].map((t, i) => `<button class="filter" type="button" data-tag="${esc(t)}" aria-pressed="${i === 0}">${esc(t)}</button>`).join("")
      : "";
    const draw = (tag) => {
      const list = P.filter((p) => !tag || tag === "Todos" || p.tags.includes(tag));
      const soon = S.showSoonCard === true && (!tag || tag === "Todos");
      // data-count decide la maqueta: 1 proyecto = destacado, 2 = dos columnas (ambos caben en una pantalla), 3 o más = cuadrícula.
      $("#grid").dataset.count = String(list.length + (soon ? 1 : 0));
      $("#grid").innerHTML =
        list.map((p) => `
          <a class="card" href="project.html?p=${encodeURIComponent(p.slug)}">
            <div class="card-media">
              <span class="year">${esc(p.year)}</span>
              <div class="cover"><img src="${esc(p.cover)}"${imgAttrs(p.cover)} alt="${esc(p.coverAlt || "")}" loading="lazy"></div>
            </div>
            <div class="card-body">
              <h3>${esc(p.title)}</h3>
              <p>${esc(p.summary)}</p>
              <div class="card-foot">${tagList(p.tags)}</div>
            </div>
          </a>`).join("") +
        (soon ? '<div class="card soon"><p>Próximo proyecto<br><span>Se publicará aquí.</span></p></div>' : "");
      watchImages($("#grid"));
    };
    draw("Todos");
    $("#filters").addEventListener("click", (e) => {
      const b = e.target.closest(".filter"); if (!b) return;
      document.querySelectorAll(".filter").forEach((x) => x.setAttribute("aria-pressed", x === b));
      draw(b.dataset.tag);
    });

    $("#about-text").innerHTML = S.about.map((t) => `<p>${rich(t)}</p>`).join("");
    $("#globe").innerHTML = `
      <div class="globe-stage">
        <canvas class="globe-canvas" tabindex="0" role="img" aria-label="Globo terráqueo. Arrástralo para girarlo."></canvas>
      </div>
      <p class="globe-caption" aria-live="polite"><strong></strong> <span></span></p>
      <div class="globe-bar">
        <button class="btn ghost globe-locate" type="button" hidden>${ico("compass", 16)}<span>Ubicarme</span></button>
      </div>
      <p class="globe-note">Tu ubicación se estima por IP con un servicio externo (geojs.io). No guardo nada.</p>`;
    window.initZombieScene($("#scene"));
    if (window.initGlobe && S.home) window.initGlobe($("#globe"), S.home);

    $("#skills-intro").textContent = S.skillsIntro || "";
    $("#skills").innerHTML = Object.entries(S.skills)
      .map(([k, v]) => `<div><h3>${esc(k)}</h3><ul class="tiles">${v.map(([label, icon]) => `<li class="tile">${ico(icon)}<span>${esc(label)}</span></li>`).join("")}</ul></div>`).join("");

    const c = S.contact;
    $("#contact").innerHTML = `
      <p class="intro">¿Quieres conversar sobre un proyecto? Escríbeme.</p>
      <div class="contact-cta">
        <a class="btn" href="mailto:${esc(plain(c.email))}?subject=${encodeURIComponent("Hola, vi tu portafolio")}">Escribirme</a>
        <button class="btn ghost" type="button" data-copy="${esc(plain(c.email))}">Copiar correo</button>
      </div>
      <ul class="contact-list">
        <li><a href="mailto:${esc(plain(c.email))}">${ico("mail", 30)}<span>${rich(c.email)}</span></a></li>
        ${(c.links || []).map((l) => `<li><a href="${esc(l.href)}" target="_blank" rel="noopener noreferrer">${l.icon ? ico(l.icon, 30) : ""}<span>${esc(l.label)}</span></a></li>`).join("")}
      </ul>`;
    const copyBtn = $("#contact [data-copy]");
    if (copyBtn) copyBtn.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(copyBtn.dataset.copy); copyBtn.textContent = "Copiado"; setTimeout(() => (copyBtn.textContent = "Copiar correo"), 2000); }
      catch (_) { copyBtn.textContent = copyBtn.dataset.copy; }
    });
  }

  /* ───── Imágenes responsivas: WebP con dos tamaños y dimensiones reales (evita saltos de maquetación) ───── */
  function imgAttrs(src) {
    const m = String(src).match(/^(assets\/[^/]+\/)([^/]+)\.webp$/);
    const d = m && window.IMG_DIMS && window.IMG_DIMS[m[2]];
    if (!d) return "";
    let a = ` width="${d[0]}" height="${d[1]}"`;
    if (d[0] > 800) a += ` srcset="${m[1]}${m[2]}-720.webp 720w, ${src} ${d[0]}w" sizes="(max-width: 900px) 100vw, 800px"`;
    return a;
  }

  /* ───── Bloques del caso de estudio ───── */
  // b.pad = color de fondo de la imagen: añade un margen interior de ese mismo color (para imágenes sin margen propio).
  const img = (b) =>
    `<figure><div class="frame" ${b.scroll ? 'data-scroll style="max-height:640px;overflow:auto"' : ""}><img src="${esc(b.src)}"${imgAttrs(b.src)} alt="${esc(b.alt || "")}" loading="lazy" decoding="async" data-zoom tabindex="0" role="button" aria-label="Ampliar imagen: ${esc(b.alt || "")}"${b.pad ? ` class="padded" style="background:${esc(b.pad)}"` : ""}></div>${b.caption ? `<figcaption>${rich(b.caption)}</figcaption>` : ""}</figure>`;
  const blocks = {
    p: (b) => `<div class="prose"><p>${rich(b.text)}</p></div>`,
    ul: (b) => `<ul class="bullets">${b.items.map((i) => `<li>${rich(i)}</li>`).join("")}</ul>`,
    image: (b) => img(b),
    pair: (b) => `<div class="compare" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))">${b.items.map((i) => img(i)).join("")}</div>`,
    compare: (b) => `<div class="compare">${b.items.map((i) => `<div><span class="tag">${esc(i.label)}</span>${img(i)}</div>`).join("")}</div>`,
    phones: (b) => `<div class="phones">${b.items.map((i) => img(i)).join("")}</div>`,
    colors: (b) => b.groups.map((g) => `<div><h3 style="margin-bottom:12px">${esc(g.name)}</h3><div class="swatch-grid">${g.items.map(([n, h]) => `<div class="swatch"><i style="background:${esc(h)}"></i><b>${esc(n)}</b><span>${esc(h)}</span></div>`).join("")}</div></div>`).join(""),
    decisions: (b) => `<div class="decisions">${b.items.map((d) => `<article class="decision"><h3>${rich(d.title)}</h3><p>${rich(d.text)}</p></article>`).join("")}</div>`,
    note: (b) => `<div class="note">${rich(b.text)}</div>`,
  };

  /* ───── Caso de estudio ───── */
  function renderProject() {
    const slug = new URLSearchParams(location.search).get("p") || document.body.dataset.slug;
    const i = Math.max(0, P.findIndex((p) => p.slug === slug));
    const p = P[i];
    if (!p) { $("#project").innerHTML = '<div class="wrap"><p>Proyecto no encontrado.</p></div>'; return; }
    document.title = `${p.title} - ${plain(S.shortName || S.name)}`;
    const next = P[(i + 1) % P.length];
    $("#project").innerHTML = `
      <header class="p-hero wrap">
        <div class="p-head">
          <h1>${esc(p.title)}</h1>
          <a class="back" href="index.html#proyectos">Todos los proyectos</a>
        </div>
        <p class="lede">${rich(p.summary)}</p>
        <div style="margin-top:20px">${tagList(p.tags)}</div>
        ${p.tldr ? `<dl class="tldr">${p.tldr.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${rich(v)}</dd></div>`).join("")}</dl>` : ""}
        <dl class="facts">${p.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${factValue(v)}</dd></div>`).join("")}</dl>
        <div class="p-cover">${img({ src: p.cover, alt: p.coverAlt })}</div>
        <div class="stats">${p.stats.map(([n, l]) => `<div class="stat"><b>${esc(n)}</b><span>${esc(l)}</span></div>`).join("")}</div>
      </header>
      <div class="wrap layout">
        <nav class="toc" aria-label="Contenido"><ol>${p.chapters.map((c) => `<li><a href="#${esc(c.id)}">${esc(c.title)}</a></li>`).join("")}</ol></nav>
        <div>${p.chapters.map((c) => `
          <section class="chapter" id="${esc(c.id)}">
            <h2>${esc(c.title)}</h2>
            ${c.blocks.map((b) => (blocks[b.t] ? blocks[b.t](b) : "")).join("")}
          </section>`).join("")}
        </div>
      </div>
      <div class="wrap next">
        <a class="big" href="${P.length > 1 ? `project.html?p=${encodeURIComponent(next.slug)}` : "index.html#proyectos"}">${P.length > 1 ? esc(next.short || next.title) : "Volver a la portada"} →</a>
      </div>`;

    watchImages($("#project"));

    // Imágenes largas con scroll propio: al llegar al final (o al inicio), la rueda sigue desplazando la página sin esperar.
    $("#project").querySelectorAll(".frame[data-scroll]").forEach((el) => {
      el.addEventListener("wheel", (e) => {
        if (e.ctrlKey || e.deltaY === 0) return;
        const atEdge = e.deltaY > 0 ? el.scrollTop + el.clientHeight >= el.scrollHeight - 1 : el.scrollTop <= 0;
        if (!atEdge) return;
        e.preventDefault();
        window.scrollBy({ top: e.deltaY, left: 0, behavior: "instant" });
      }, { passive: false });
    });

    // Marca el capítulo visible en el índice lateral.
    const links = [...document.querySelectorAll(".toc a")];
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
    }), { rootMargin: "-30% 0px -60% 0px" });
    document.querySelectorAll(".chapter").forEach((s) => io.observe(s));
  }

  const page = document.body.dataset.page;
  chrome(page);
  page === "home" ? renderHome() : renderProject();
})();
