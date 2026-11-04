/* Globo terráqueo interactivo (canvas + d3-geo, sin claves de API).
   Al cargar la página consulta tu ubicación aproximada a partir de tu dirección IP (sin pedir permiso);
   al llegar a la sección el globo parte de tu punto, se aleja, aparece mi ciudad, se dibuja un arco entre ambas
   y se calcula la distancia. Solo se puede girar (arrastrar o con las flechas); el botón "Ubicarme" lo recentra.
   La IP se consulta a un servicio externo (get.geojs.io, con ipwho.is de respaldo); no se guarda nada.

   Modo de prueba (para ver el portafolio como lo vería otra persona, sin VPN):
     ?lugar=-23.55,-46.63   usa esas coordenadas como ubicación del visitante (latitud,longitud)
     ?ip=200.160.2.3        consulta la ubicación de esa IP en lugar de la tuya */
import { geoGraticule10, geoInterpolate, geoDistance, geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import type { GeoPermissibleObjects } from "d3-geo";
import land110 from "world-atlas/land-110m.json";

type LonLat = [number, number];
export type Home = { name: string; short?: string; lat: number; lon: number };
type Seq = {
  t0: number;
  c0: LonLat;
  c1: LonLat;
  k0: number;
  k1: number;
  hold: number;
  move: number;
  popAt: number;
  arcAt: number;
  arcDur: number;
};
type Fly = { t0: number; ms: number; c0: LonLat; k0: number; c1: LonLat; k1: number };
type Source = [string, (j: Record<string, unknown>) => LonLat];

const rad = Math.PI / 180;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const cssVar = (el: Element, name: string, fallback: string) =>
  getComputedStyle(el).getPropertyValue(name).trim() || fallback;
// Separador de miles con punto también en cifras de 4 dígitos (7.720 km)
const km = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

function haversineKm(a: LonLat, b: LonLat) {
  const dLat = (b[1] - a[1]) * rad,
    dLon = (b[0] - a[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Parámetros de prueba de la dirección (?lugar= o ?ip=). */
function testParams() {
  const params = new URLSearchParams(location.search);
  const m = (params.get("lugar") || "").split(",").map(parseFloat);
  const place: LonLat | null =
    m.length === 2 && Number.isFinite(m[0]) && Number.isFinite(m[1]) && Math.abs(m[0]) <= 90 && Math.abs(m[1]) <= 180
      ? [m[1], m[0]]
      : null;
  const ipParam = params.get("ip") || "";
  const ip = /^[0-9a-fA-F:.]{3,45}$/.test(ipParam) ? ipParam : null;
  return { place, ip, testMode: !!(place || ip) };
}

const num = (v: unknown) => parseFloat(String(v));

/** Ubicación aproximada por IP: prueba un servicio y, si falla, el siguiente. Devuelve [lon, lat] o null. */
async function ipLocation(test: ReturnType<typeof testParams>): Promise<LonLat | null> {
  if (test.place) return test.place;
  // el visitante pidió no ser rastreado
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (!test.ip && (nav.doNotTrack === "1" || nav.globalPrivacyControl === true)) return null;
  const sources: Source[] = test.ip
    ? [
        ["https://get.geojs.io/v1/ip/geo/" + test.ip + ".json", (j) => [num(j.longitude), num(j.latitude)]],
        [
          "https://ipwho.is/" + test.ip,
          (j) => (j.success === false ? [NaN, NaN] : [num(j.longitude), num(j.latitude)]),
        ],
      ]
    : [
        ["https://get.geojs.io/v1/ip/geo.json", (j) => [num(j.longitude), num(j.latitude)]],
        ["https://ipwho.is/", (j) => (j.success === false ? [NaN, NaN] : [num(j.longitude), num(j.latitude)])],
      ];
  for (const [url, pick] of sources) {
    try {
      const ctl = new AbortController(),
        timer = setTimeout(() => ctl.abort(), 6000);
      const res = await fetch(url, {
        signal: ctl.signal,
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      clearTimeout(timer);
      const ll = pick(await res.json());
      if (Number.isFinite(ll[0]) && Number.isFinite(ll[1]) && Math.abs(ll[1]) <= 90 && Math.abs(ll[0]) <= 180)
        return ll;
    } catch {
      /* siguiente servicio */
    }
  }
  return null;
}

/** Monta el globo dentro de `root` (con .globe-canvas, .globe-caption y .globe-locate). Devuelve la función que lo detiene. */
export function initGlobe(root: HTMLElement, home: Home): () => void {
  const canvas = root.querySelector<HTMLCanvasElement>(".globe-canvas")!;
  const caption = root.querySelector<HTMLElement>(".globe-caption")!;
  const locate = root.querySelector<HTMLButtonElement>(".globe-locate")!;
  const lead = caption.querySelector("strong")!,
    tail = caption.querySelector("span")!;
  lead.textContent = `Soy de ${home.name}.`;
  locate.hidden = true;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.parentElement!.hidden = true;
    caption.classList.add("is-on");
    return () => {};
  }

  const test = testParams();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const topo = land110 as unknown as Topology;
  const land = feature(topo, topo.objects.land);
  const graticule = geoGraticule10();
  const homeLL: LonLat = [home.lon, home.lat];
  const proj = geoOrthographic().clipAngle(90).precision(0.5);
  const path = geoPath(proj, ctx);
  const stage = canvas.parentElement!;

  let w = 0,
    dpr = 1,
    r0 = 0;
  let center: LonLat = [...homeLL],
    k = 1; // centro de la vista (lon, lat) y escala (solo cambia en la animación)
  let viewer: LonLat | null = null; // [lon, lat] de quien visita (por IP)
  let homeT = 1,
    arcP = 0; // aparición de mi punto y avance del arco (0 a 1)
  let seq: Seq | null = null,
    fly: Fly | null = null; // animación de entrada y giro de "Ubicarme"
  let visible = false,
    started = false,
    raf = 0,
    stopped = false;
  let pattern: CanvasPattern | null = null,
    patternInk = "";
  // Empieza ya, para tener el dato cuando la sección entre en vista
  const located = ipLocation(test).then((ll) => {
    viewer = ll;
  });

  function resize() {
    w = Math.max(160, Math.round(stage.clientWidth));
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(w * dpr);
    r0 = w / 2 - 2;
    pattern = null;
  }

  /* Trama de puntos para los continentes (efecto de impresión) */
  function dots(ink: string) {
    if (pattern && patternInk === ink) return pattern;
    const size = Math.round(5 * dpr),
      c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d")!;
    g.fillStyle = ink;
    g.beginPath();
    g.arc(size / 2, size / 2, size * 0.17, 0, Math.PI * 2);
    g.fill();
    const p = ctx!.createPattern(c, "repeat")!;
    p.setTransform(new DOMMatrix([1 / dpr, 0, 0, 1 / dpr, 0, 0]));
    pattern = p;
    patternInk = ink;
    return p;
  }

  // Mi avatar marca mi ciudad (si la imagen no carga, se usa el punto de siempre)
  const avatar = new Image();
  avatar.src = "/assets/logo.svg";
  const avatarOk = () => avatar.complete && avatar.naturalWidth > 0;
  avatar.onload = () => {
    if (!raf && !stopped) draw(performance.now());
  };

  const hidden = (ll: LonLat) => geoDistance(ll, center) > Math.PI / 2 - 0.02;
  function marker(ll: LonLat, kind: "home" | "you", amount: number, now: number, label?: string) {
    const g = ctx!;
    if (amount <= 0 || hidden(ll)) return;
    const p = proj(ll);
    if (!p) return;
    const ink = cssVar(root, "--ink", "#000"),
      paper = cssVar(root, "--paper", "#fff");
    const useAvatar = kind === "home" && avatarOk();
    const r = (useAvatar ? 21 : 5.5) * amount;
    if (!reduce) {
      // anillo que se expande
      const t = (now / 1500 + (kind === "home" ? 0 : 0.5)) % 1;
      g.beginPath();
      g.arc(p[0], p[1], r + t * 16, 0, Math.PI * 2);
      g.strokeStyle = ink;
      g.globalAlpha = (1 - t) * 0.55 * amount;
      g.lineWidth = 1.2;
      g.stroke();
      g.globalAlpha = 1;
    }
    if (useAvatar) {
      g.beginPath();
      g.arc(p[0], p[1], r + 2, 0, Math.PI * 2);
      g.fillStyle = paper;
      g.fill();
      g.save();
      g.beginPath();
      g.arc(p[0], p[1], r, 0, Math.PI * 2);
      g.clip();
      g.drawImage(avatar, p[0] - r, p[1] - r, r * 2, r * 2);
      g.restore();
      g.beginPath();
      g.arc(p[0], p[1], r + 2, 0, Math.PI * 2);
      g.lineWidth = 1.6;
      g.strokeStyle = ink;
      g.stroke();
    } else {
      g.beginPath();
      g.arc(p[0], p[1], r, 0, Math.PI * 2);
      g.fillStyle = kind === "home" ? ink : paper;
      g.fill();
      g.lineWidth = 2.5;
      g.strokeStyle = kind === "home" ? paper : ink;
      g.stroke();
    }
    if (kind === "home" && !useAvatar) {
      g.beginPath();
      g.arc(p[0], p[1], r + 1.5, 0, Math.PI * 2);
      g.lineWidth = 1.2;
      g.strokeStyle = ink;
      g.stroke();
    }
    if (label && amount > 0.6) {
      g.font = `700 12px ${cssVar(root, "--font", "sans-serif")}`;
      g.textBaseline = "middle";
      const off = useAvatar ? r + 8 : 12,
        tw = g.measureText(label).width,
        onRight = p[0] + off + 2 + tw < w - 6,
        x = onRight ? p[0] + off : p[0] - off - tw;
      g.fillStyle = paper;
      g.globalAlpha = 0.85;
      g.fillRect(x - 3, p[1] - 9, tw + 6, 18);
      g.globalAlpha = 1;
      g.fillStyle = ink;
      g.fillText(label, x, p[1] + 1);
    }
  }
  function draw(now: number) {
    const g = ctx!;
    const ink = cssVar(root, "--ink", "#000"),
      line = cssVar(root, "--line", "#ccc");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, w);
    proj
      .translate([w / 2, w / 2])
      .scale(r0 * k)
      .rotate([-center[0], -center[1]]);
    g.beginPath();
    path(graticule);
    g.strokeStyle = line;
    g.lineWidth = 0.6;
    g.stroke();
    g.beginPath();
    path(land as GeoPermissibleObjects);
    g.fillStyle = dots(ink);
    g.fill();
    g.strokeStyle = ink;
    g.lineWidth = 0.8;
    g.stroke();
    if (viewer && arcP > 0) {
      const it = geoInterpolate(viewer, homeLL),
        pts: LonLat[] = [],
        n = 80;
      for (let i = 0; i <= n * arcP; i++) pts.push(it(i / n) as LonLat);
      g.beginPath();
      path({ type: "LineString", coordinates: pts });
      g.strokeStyle = ink;
      g.lineWidth = 2.2;
      g.lineCap = "round";
      g.stroke();
    }
    if (viewer) marker(viewer, "you", 1, now, "Tú");
    marker(homeLL, "home", homeT, now, home.short || home.name);
  }

  /* Animación de entrada: parte de tu punto muy cerca, se aleja, aparece mi ciudad y se traza el arco */
  const mid = (a: LonLat, b: LonLat) => geoInterpolate(a, b)(0.5) as LonLat;
  function showText() {
    if (viewer) {
      const d = haversineKm(viewer, homeLL);
      lead.textContent = `Soy de ${home.name},`;
      const src = test.testMode ? "en modo de prueba" : "según tu dirección IP";
      tail.textContent =
        d < 5
          ? `prácticamente en el mismo lugar que tú, ${src}.`
          : `a unos ${km(d < 100 ? d : Math.round(d / 10) * 10)} km de tu ubicación actual, ${src}.`;
    } else {
      lead.textContent = `Soy de ${home.name}.`;
      tail.textContent = "";
    }
    caption.classList.add("is-on");
    locate.hidden = !viewer;
  }
  // Siempre se ve la Tierra entera (escala 1): nunca queda ampliada, aunque los dos puntos estén cerca.
  const finalView = (): [LonLat, number] => (viewer ? [mid(viewer, homeLL), 1] : [[...homeLL], 1]);
  function finish() {
    seq = null;
    homeT = 1;
    arcP = viewer ? 1 : 0;
    const [c, kk] = finalView();
    center = c;
    k = kk;
    showText();
  }
  function startIntro() {
    caption.classList.remove("is-on");
    if (reduce) {
      finish();
      return;
    }
    const c0: LonLat = [...(viewer || homeLL)] as LonLat,
      [c1, k1] = finalView();
    center = [...c0];
    k = 1.9;
    homeT = 0;
    arcP = 0; // arranca algo más cerca y se aleja hasta ver la Tierra entera
    seq = {
      t0: performance.now(),
      c0,
      c1,
      k0: 1.9,
      k1,
      hold: viewer ? 600 : 250,
      move: 1900,
      popAt: viewer ? 1800 : 1300,
      arcAt: viewer ? 2600 : 0,
      arcDur: viewer ? 1300 : 0,
    };
  }
  function stepSeq(s: Seq, now: number) {
    const t = now - s.t0,
      m = clamp((t - s.hold) / s.move, 0, 1);
    center = geoInterpolate(s.c0, s.c1)(ease(m)) as LonLat;
    k = s.k0 + (s.k1 - s.k0) * ease(m);
    homeT = clamp((t - s.popAt) / 450, 0, 1);
    if (viewer) arcP = ease(clamp((t - s.arcAt) / s.arcDur, 0, 1));
    if (t >= (viewer ? s.arcAt + s.arcDur : s.popAt + 450) + 150) finish();
  }
  function stepFly(f: Fly, now: number) {
    const m = clamp((now - f.t0) / f.ms, 0, 1);
    center = geoInterpolate(f.c0, f.c1)(ease(m)) as LonLat;
    k = f.k0 + (f.k1 - f.k0) * ease(m);
    if (m >= 1) fly = null;
  }
  const takeControl = () => {
    if (seq) finish();
    fly = null;
  };
  const onLocate = () => {
    // gira el globo de vuelta para mostrar dónde estás tú y dónde estoy yo
    takeControl();
    const [c, kk] = finalView();
    fly = { t0: performance.now(), ms: reduce ? 1 : 1100, c0: [...center], k0: k, c1: c, k1: kk };
  };
  locate.addEventListener("click", onLocate);

  /* Girar: arrastrar con el ratón o el dedo, o con las flechas. Sin zoom. */
  const pointers = new Map<number, { x: number; y: number }>();
  function rotateBy(dx: number, dy: number) {
    const s = 0.28 / k;
    center[0] = ((center[0] - dx * s + 540) % 360) - 180;
    center[1] = clamp(center[1] + dy * s, -85, 85);
  }
  const onDown = (e: PointerEvent) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    takeControl();
  };
  const onMove = (e: PointerEvent) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    rotateBy(e.clientX - p.x, e.clientY - p.y);
    p.x = e.clientX;
    p.y = e.clientY;
  };
  const release = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
  };
  const onKey = (e: KeyboardEvent) => {
    const step = 8 / k,
      dir = (
        { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] } as Record<string, number[]>
      )[e.key];
    if (dir) {
      e.preventDefault();
      takeControl();
      rotateBy(-dir[0] * step * 4, -dir[1] * step * 4);
    }
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("keydown", onKey);

  /* Bucle: solo mientras el globo está a la vista */
  function tick(now: number) {
    if (seq) stepSeq(seq, now);
    else if (fly) stepFly(fly, now);
    draw(now);
    raf = visible && !stopped ? requestAnimationFrame(tick) : 0;
  }
  const ro = new ResizeObserver(() => {
    resize();
    if (!raf) draw(performance.now());
  });
  ro.observe(stage);
  resize();
  draw(performance.now());
  const io = new IntersectionObserver(
    (es) => {
      visible = es[0].isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
      if (visible && !started) {
        started = true;
        located.then(() => {
          if (!stopped) startIntro();
        });
      }
    },
    { threshold: 0.3 },
  );
  io.observe(root);

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    locate.removeEventListener("click", onLocate);
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerup", release);
    canvas.removeEventListener("pointercancel", release);
    canvas.removeEventListener("keydown", onKey);
    caption.classList.remove("is-on");
    locate.hidden = true;
  };
}
