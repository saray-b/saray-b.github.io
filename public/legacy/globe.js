/* Globo terráqueo interactivo (canvas + d3-geo, sin claves de API).
   Al cargar la página consulta tu ubicación aproximada a partir de tu dirección IP (sin pedir permiso);
   al llegar a la sección el globo parte de tu punto, se aleja, aparece mi ciudad, se dibuja un arco entre ambas
   y se calcula la distancia. Solo se puede girar (arrastrar o con las flechas); el botón "Ubicarme" lo recentra.
   La IP se consulta a un servicio externo (get.geojs.io, con ipwho.is de respaldo); no se guarda nada. */
(function () {
  const rad = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const cssVar = (el, name, fallback) => getComputedStyle(el).getPropertyValue(name).trim() || fallback;
  // Separador de miles con punto también en cifras de 4 dígitos (7.720 km)
  const km = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  function haversineKm(a, b) {
    const dLat = (b[1] - a[1]) * rad, dLon = (b[0] - a[0]) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(h));
  }

  /* Ubicación aproximada por IP: prueba un servicio y, si falla, el siguiente. Devuelve [lon, lat] o null. */
  /* Modo de prueba (para ver el portafolio como lo vería otra persona, sin VPN):
       ?lugar=-23.55,-46.63   usa esas coordenadas como ubicación del visitante (latitud,longitud)
       ?ip=200.160.2.3        consulta la ubicación de esa IP en lugar de la tuya */
  const params = new URLSearchParams(location.search);
  const testPlace = (() => {
    const m = (params.get("lugar") || "").split(",").map(parseFloat);
    return m.length === 2 && Number.isFinite(m[0]) && Number.isFinite(m[1]) && Math.abs(m[0]) <= 90 && Math.abs(m[1]) <= 180 ? [m[1], m[0]] : null;
  })();
  const testIp = /^[0-9a-fA-F:.]{3,45}$/.test(params.get("ip") || "") ? params.get("ip") : null;
  const testMode = !!(testPlace || testIp);

  async function ipLocation() {
    if (testPlace) return testPlace;
    if (!testIp && (navigator.doNotTrack === "1" || navigator.globalPrivacyControl === true)) return null; // el visitante pidió no ser rastreado
    const sources = testIp ? [
      ["https://get.geojs.io/v1/ip/geo/" + testIp + ".json", (j) => [parseFloat(j.longitude), parseFloat(j.latitude)]],
      ["https://ipwho.is/" + testIp, (j) => (j.success === false ? [NaN, NaN] : [parseFloat(j.longitude), parseFloat(j.latitude)])],
    ] : [
      ["https://get.geojs.io/v1/ip/geo.json", (j) => [parseFloat(j.longitude), parseFloat(j.latitude)]],
      ["https://ipwho.is/", (j) => (j.success === false ? [NaN, NaN] : [parseFloat(j.longitude), parseFloat(j.latitude)])],
    ];
    for (const [url, pick] of sources) {
      try {
        const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 6000);
        const res = await fetch(url, { signal: ctl.signal, cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" });
        clearTimeout(timer);
        const ll = pick(await res.json());
        if (Number.isFinite(ll[0]) && Number.isFinite(ll[1]) && Math.abs(ll[1]) <= 90 && Math.abs(ll[0]) <= 180) return ll;
      } catch (_) { /* siguiente servicio */ }
    }
    return null;
  }

  window.initGlobe = function (root, home) {
    const canvas = root.querySelector(".globe-canvas");
    const caption = root.querySelector(".globe-caption");
    const locate = root.querySelector(".globe-locate");
    const lead = caption.querySelector("strong"), tail = caption.querySelector("span");
    lead.textContent = `Soy de ${home.name}.`;
    locate.hidden = true;

    // Sin las librerías el texto sigue visible, solo falta el globo.
    if (!window.d3 || !window.topojson || !window.LAND_TOPO || !canvas.getContext) {
      canvas.parentElement.hidden = true; caption.classList.add("is-on"); return;
    }

    const ctx = canvas.getContext("2d");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const land = topojson.feature(window.LAND_TOPO, window.LAND_TOPO.objects.land);
    const graticule = d3.geoGraticule10();
    const sphere = { type: "Sphere" };
    const homeLL = [home.lon, home.lat];
    const proj = d3.geoOrthographic().clipAngle(90).precision(0.5);
    const path = d3.geoPath(proj, ctx);

    let w = 0, dpr = 1, r0 = 0;
    let center = homeLL.slice(), k = 1;             // centro de la vista (lon, lat) y escala (solo cambia en la animación)
    let viewer = null;                               // [lon, lat] de quien visita (por IP)
    let homeT = 1, arcP = 0;                         // aparición de mi punto y avance del arco (0 a 1)
    let seq = null, fly = null;                      // animación de entrada y giro de "Ubicarme"
    let visible = false, started = false, raf = 0, pattern = null, patternInk = "";
    const located = ipLocation().then((ll) => { viewer = ll; }); // empieza ya, para tener el dato cuando la sección entre en vista

    function resize() {
      w = Math.max(160, Math.round(canvas.parentElement.clientWidth));
      dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(w * dpr);
      r0 = w / 2 - 2;
      pattern = null;
    }

    /* Trama de puntos para los continentes (efecto de impresión) */
    function dots(ink) {
      if (pattern && patternInk === ink) return pattern;
      const size = Math.round(5 * dpr), c = document.createElement("canvas");
      c.width = c.height = size;
      const g = c.getContext("2d");
      g.fillStyle = ink; g.beginPath(); g.arc(size / 2, size / 2, size * 0.17, 0, Math.PI * 2); g.fill();
      pattern = ctx.createPattern(c, "repeat");
      if (pattern.setTransform) pattern.setTransform(new DOMMatrix([1 / dpr, 0, 0, 1 / dpr, 0, 0]));
      patternInk = ink;
      return pattern;
    }

    // Mi avatar marca mi ciudad (si la imagen no carga, se usa el punto de siempre)
    const avatar = new Image(); avatar.src = "assets/logo.svg";
    const avatarOk = () => avatar.complete && avatar.naturalWidth > 0;
    avatar.onload = () => { if (typeof draw === "function" && !raf) draw(performance.now()); };

    function hidden(ll) { return d3.geoDistance(ll, center) > Math.PI / 2 - 0.02; }
    function marker(ll, kind, amount, now, label) {
      if (amount <= 0 || hidden(ll)) return;
      const p = proj(ll); if (!p) return;
      const ink = cssVar(root, "--ink", "#000"), paper = cssVar(root, "--paper", "#fff");
      const useAvatar = kind === "home" && avatarOk();
      const r = (useAvatar ? 21 : 5.5) * amount;
      if (!reduce) { // anillo que se expande
        const t = (now / 1500 + (kind === "home" ? 0 : 0.5)) % 1;
        ctx.beginPath(); ctx.arc(p[0], p[1], r + t * 16, 0, Math.PI * 2);
        ctx.strokeStyle = ink; ctx.globalAlpha = (1 - t) * 0.55 * amount; ctx.lineWidth = 1.2; ctx.stroke(); ctx.globalAlpha = 1;
      }
      if (useAvatar) {
        ctx.beginPath(); ctx.arc(p[0], p[1], r + 2, 0, Math.PI * 2); ctx.fillStyle = paper; ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(avatar, p[0] - r, p[1] - r, r * 2, r * 2); ctx.restore();
        ctx.beginPath(); ctx.arc(p[0], p[1], r + 2, 0, Math.PI * 2); ctx.lineWidth = 1.6; ctx.strokeStyle = ink; ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
        ctx.fillStyle = kind === "home" ? ink : paper; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = kind === "home" ? paper : ink; ctx.stroke();
      }
      if (kind === "home" && !useAvatar) { ctx.beginPath(); ctx.arc(p[0], p[1], r + 1.5, 0, Math.PI * 2); ctx.lineWidth = 1.2; ctx.strokeStyle = ink; ctx.stroke(); }
      if (label && amount > 0.6) {
        ctx.font = `700 12px ${cssVar(root, "--font", "sans-serif")}`; ctx.textBaseline = "middle";
        const off = useAvatar ? r + 8 : 12, tw = ctx.measureText(label).width, onRight = p[0] + off + 2 + tw < w - 6, x = onRight ? p[0] + off : p[0] - off - tw;
        ctx.fillStyle = paper; ctx.globalAlpha = 0.85; ctx.fillRect(x - 3, p[1] - 9, tw + 6, 18); ctx.globalAlpha = 1;
        ctx.fillStyle = ink; ctx.fillText(label, x, p[1] + 1);
      }
    }
    function draw(now) {
      const ink = cssVar(root, "--ink", "#000"), line = cssVar(root, "--line", "#ccc");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, w);
      proj.translate([w / 2, w / 2]).scale(r0 * k).rotate([-center[0], -center[1]]);
      ctx.beginPath(); path(graticule); ctx.strokeStyle = line; ctx.lineWidth = 0.6; ctx.stroke();
      ctx.beginPath(); path(land); ctx.fillStyle = dots(ink); ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 0.8; ctx.stroke();
      if (viewer && arcP > 0) {
        const it = d3.geoInterpolate(viewer, homeLL), pts = [], n = 80;
        for (let i = 0; i <= n * arcP; i++) pts.push(it(i / n));
        ctx.beginPath(); path({ type: "LineString", coordinates: pts });
        ctx.strokeStyle = ink; ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.stroke();
      }
      if (viewer) marker(viewer, "you", 1, now, "Tú");
      marker(homeLL, "home", homeT, now, home.short || home.name);
    }

    /* Animación de entrada: parte de tu punto muy cerca, se aleja, aparece mi ciudad y se traza el arco */
    const mid = (a, b) => d3.geoInterpolate(a, b)(0.5);
    function showText() {
      if (viewer) {
        const d = haversineKm(viewer, homeLL);
        lead.textContent = `Soy de ${home.name},`;
        const src = testMode ? "en modo de prueba" : "según tu dirección IP";
        tail.textContent = d < 5 ? `prácticamente en el mismo lugar que tú, ${src}.`
          : `a unos ${km(d < 100 ? d : Math.round(d / 10) * 10)} km de tu ubicación actual, ${src}.`;
      } else { lead.textContent = `Soy de ${home.name}.`; tail.textContent = ""; }
      caption.classList.add("is-on");
      locate.hidden = !viewer;
    }
    // Siempre se ve la Tierra entera (escala 1): nunca queda ampliada, aunque los dos puntos estén cerca.
    const finalView = () => (viewer ? [mid(viewer, homeLL), 1] : [homeLL.slice(), 1]);
    function finish() { seq = null; homeT = 1; arcP = viewer ? 1 : 0; const [c, kk] = finalView(); center = c; k = kk; showText(); }
    function startIntro() {
      caption.classList.remove("is-on");
      if (reduce) { finish(); return; }
      const c0 = (viewer || homeLL).slice(), [c1, k1] = finalView();
      center = c0.slice(); k = 1.9; homeT = 0; arcP = 0; // arranca algo más cerca y se aleja hasta ver la Tierra entera
      seq = { t0: performance.now(), c0, c1, k0: 1.9, k1, hold: viewer ? 600 : 250, move: 1900,
              popAt: viewer ? 1800 : 1300, arcAt: viewer ? 2600 : 0, arcDur: viewer ? 1300 : 0 };
    }
    function stepSeq(now) {
      const t = now - seq.t0, m = clamp((t - seq.hold) / seq.move, 0, 1);
      center = d3.geoInterpolate(seq.c0, seq.c1)(ease(m)); k = seq.k0 + (seq.k1 - seq.k0) * ease(m);
      homeT = clamp((t - seq.popAt) / 450, 0, 1);
      if (viewer) arcP = ease(clamp((t - seq.arcAt) / seq.arcDur, 0, 1));
      if (t >= (viewer ? seq.arcAt + seq.arcDur : seq.popAt + 450) + 150) finish();
    }
    function stepFly(now) {
      const m = clamp((now - fly.t0) / fly.ms, 0, 1);
      center = d3.geoInterpolate(fly.c0, fly.c1)(ease(m)); k = fly.k0 + (fly.k1 - fly.k0) * ease(m);
      if (m >= 1) fly = null;
    }
    const takeControl = () => { if (seq) finish(); fly = null; };
    locate.addEventListener("click", () => { // gira el globo de vuelta para mostrar dónde estás tú y dónde estoy yo
      takeControl(); const [c, kk] = finalView();
      fly = { t0: performance.now(), ms: reduce ? 1 : 1100, c0: center.slice(), k0: k, c1: c, k1: kk };
    });

    /* Girar: arrastrar con el ratón o el dedo, o con las flechas. Sin zoom. */
    const pointers = new Map();
    function rotateBy(dx, dy) {
      const s = 0.28 / k;
      center[0] = ((center[0] - dx * s + 540) % 360) - 180;
      center[1] = clamp(center[1] + dy * s, -85, 85);
    }
    canvas.addEventListener("pointerdown", (e) => { canvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); takeControl(); });
    canvas.addEventListener("pointermove", (e) => {
      const p = pointers.get(e.pointerId); if (!p) return;
      rotateBy(e.clientX - p.x, e.clientY - p.y); p.x = e.clientX; p.y = e.clientY;
    });
    const release = (e) => pointers.delete(e.pointerId);
    canvas.addEventListener("pointerup", release); canvas.addEventListener("pointercancel", release);
    canvas.addEventListener("keydown", (e) => {
      const step = 8 / k, dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (dir) { e.preventDefault(); takeControl(); rotateBy(-dir[0] * step * 4, -dir[1] * step * 4); }
    });

    /* Bucle: solo mientras el globo está a la vista */
    function tick(now) {
      if (seq) stepSeq(now); else if (fly) stepFly(now);
      draw(now);
      raf = visible ? requestAnimationFrame(tick) : 0;
    }
    new ResizeObserver(() => { resize(); if (!raf) draw(performance.now()); }).observe(canvas.parentElement);
    resize(); draw(performance.now());
    new IntersectionObserver((es) => {
      visible = es[0].isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
      if (visible && !started) { started = true; located.then(startIntro); }
    }, { threshold: 0.3 }).observe(root);
  };
})();
