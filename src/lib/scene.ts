/* Escena "Sobre mí": yo programando con audífonos, el gato dormido y un zombi que pasa por las ventanas.
   Portada desde la animación original (Claude Design). Todo se dibuja en función del tiempo T (ciclo de END segundos). */

const W = 1920,
  H = 1080;
// Secciones (duración en segundos), igual que la animación original
const SCENES: [string, number][] = [
  ["Coding", 2],
  ["Walk1", 4.5],
  ["Turn1", 1.6],
  ["Resume1", 2],
  ["Walk2", 4.5],
  ["Turn2", 1.6],
  ["Resume2", 2],
];
const CUES: Record<string, number> = {};
let END = 0;
SCENES.forEach(function (s) {
  CUES[s[0]] = END;
  END += s[1];
});

const LIGHT = {
  dk: false,
  ink: "#111111",
  indigo: "#3A3A3A",
  blue: "#5A5A5A",
  blue2: "#8C8C8C",
  paper: "#FFFFFF",
  wall: "#F2F2F2",
  desk: "#2A2A2A",
  mist: "#B3B3B3",
  night: "#1C1C1C",
  screen: "#262626",
  light: "#C8C8C8",
  frame: "#C8C8C8",
  skin: "#BDBDBD",
  hairw: "#E3E3E3",
  halo: "#111111",
  line: "#111111",
  zl: "#111111",
};
// Oscuro: sin invertir. Afro negro y cara blanca como siempre, con un borde gris claro (no blanco puro) para despegar del fondo.
const DARK: Palette = {
  dk: true,
  ink: "#111111",
  indigo: "#9A9A9A",
  blue: "#707070",
  blue2: "#8C8C8C",
  paper: "#FFFFFF",
  wall: "#161616",
  desk: "#2B2B2B",
  mist: "#6E6E6E",
  night: "#060606",
  screen: "#262626",
  light: "#C8C8C8",
  frame: "#6A6A6A",
  skin: "#B0B0B0",
  hairw: "#D8D8D8",
  halo: "#D9D9D9",
  line: "#9A9A9A",
  zl: "#D2D2D2",
};
type Palette = typeof LIGHT;
type Ease = (t: number) => number;
type EyeOpts = {
  x: number;
  y: number;
  blink: number;
  happy?: boolean;
  lx?: number;
  ly?: number;
  sx?: number;
  side?: number;
};
type CoderParams = {
  T: number;
  typeAmp: number;
  turn: number;
  blink: number;
  mood: string;
  tilt: number;
  look: number[];
};

function palette(): Palette {
  const t = document.documentElement.getAttribute("data-theme");
  const dark = t === "dark";
  const P: Palette = Object.assign({}, dark ? DARK : LIGHT);
  const bg = getComputedStyle(document.body).backgroundColor;
  if (bg && bg !== "rgba(0, 0, 0, 0)") P.wall = bg;
  return P;
}

// ── Movimiento ──
const E: Record<string, Ease> = {
  linear: function (t) {
    return t;
  },
  cubic: function (t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  },
  back: function (t) {
    const c1 = 1.70158,
      c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  sine: function (t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  },
};
function interp(T: number, input: number[], output: number[], ease?: Ease | Ease[]): number {
  ease = ease || E.cubic;
  if (T <= input[0]) return output[0];
  if (T >= input[input.length - 1]) return output[output.length - 1];
  for (let i = 0; i < input.length - 1; i++) {
    if (T >= input[i] && T <= input[i + 1]) {
      const span = input[i + 1] - input[i];
      const l = span === 0 ? 0 : (T - input[i]) / span;
      const f = Array.isArray(ease) ? ease[i] || E.linear : ease;
      return output[i] + (output[i + 1] - output[i]) * f(l);
    }
  }
  return output[output.length - 1];
}
// Interpolación suave (Hermite monótona): la cámara no frena en cada punto clave, así el zoom fluye
function smooth(T: number, xs: number[], ys: number[]): number {
  const N = xs.length;
  let i: number;
  if (T <= xs[0]) return ys[0];
  if (T >= xs[N - 1]) return ys[N - 1];
  const d: number[] = [],
    m: number[] = [];
  for (i = 0; i < N - 1; i++) d[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
  m[0] = d[0];
  m[N - 1] = d[N - 2];
  for (i = 1; i < N - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (i = 0; i < N - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i],
      b = m[i + 1] / d[i],
      h = a * a + b * b;
    if (h > 9) {
      const k = 3 / Math.sqrt(h);
      m[i] = k * a * d[i];
      m[i + 1] = k * b * d[i];
    }
  }
  for (i = 0; i < N - 1; i++) {
    if (T <= xs[i + 1]) {
      const w = xs[i + 1] - xs[i],
        u = (T - xs[i]) / w,
        u2 = u * u,
        u3 = u2 * u;
      return (
        (2 * u3 - 3 * u2 + 1) * ys[i] +
        (u3 - 2 * u2 + u) * w * m[i] +
        (-2 * u3 + 3 * u2) * ys[i + 1] +
        (u3 - u2) * w * m[i + 1]
      );
    }
  }
  return ys[N - 1];
}
function frac(x: number) {
  return x - Math.floor(x);
}
function bump(T: number, at: number, w: number) {
  return Math.max(0, 1 - Math.abs(T - at) / w);
}
function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
function n(v: number) {
  return Math.round(v * 100) / 100;
}

// ── Dibujo ──
const afroCache: Record<string, string> = {};
function afro(C: Palette, cx: number, cy: number): string {
  const key = C.ink + C.halo + C.dk + cx + cy;
  if (afroCache[key]) return afroCache[key];
  let shapes = '<ellipse cx="' + cx + '" cy="' + cy + '" rx="196" ry="188"/>';
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    shapes += '<circle cx="' + n(cx + Math.cos(a) * 182) + '" cy="' + n(cy + Math.sin(a) * 174) + '" r="50"/>';
  }
  const halo = C.dk
    ? '<g fill="' + C.halo + '" stroke="' + C.halo + '" stroke-width="14" stroke-linejoin="round">' + shapes + "</g>"
    : "";
  return (afroCache[key] = "<g>" + halo + '<g fill="' + C.ink + '">' + shapes + "</g></g>");
}

function eye(C: Palette, o: EyeOpts): string {
  const x = o.x + (o.lx || 0),
    y = o.y + (o.ly || 0),
    sx = o.sx == null ? 1 : o.sx,
    side = o.side || 1;
  if (o.happy)
    return (
      '<path d="M' +
      n(x - 16 * sx) +
      "," +
      (y + 6) +
      " Q" +
      x +
      "," +
      (y - 14) +
      " " +
      n(x + 16 * sx) +
      "," +
      (y + 6) +
      '" stroke="' +
      C.ink +
      '" stroke-width="6" fill="none" stroke-linecap="round"/>'
    );
  const ry = 21 * (1 - o.blink * 0.92);
  let s =
    '<ellipse cx="' + n(x) + '" cy="' + n(y) + '" rx="' + n(17 * sx) + '" ry="' + n(ry) + '" fill="' + C.ink + '"/>';
  if (o.blink < 0.5) s += '<circle cx="' + n(x - 5) + '" cy="' + n(y - 7) + '" r="5" fill="' + C.paper + '"/>';
  for (let i = 0; i < 3; i++) {
    s +=
      '<path d="M' +
      n(x + side * (8 + i * 5) * sx) +
      "," +
      n(y - ry + 4) +
      " l" +
      n(side * (8 + i * 2) * sx) +
      "," +
      (-10 + i * 4) +
      '" stroke="' +
      C.ink +
      '" stroke-width="3.5" stroke-linecap="round"/>';
  }
  return "<g>" + s + "</g>";
}

function monitor(C: Palette, T: number, typing: number): string {
  const lines = [
    [0, 120],
    [18, 90],
    [18, 150],
    [36, 70],
    [18, 110],
    [0, 60],
    [18, 130],
  ];
  const cursorOn = frac((T * 13) / END) < 0.5 || typing > 0.5;
  const growth = 20 + 90 * frac((T * 3) / END) * (typing > 0.1 ? 1 : 0.4);
  let s =
    '<rect x="556" y="700" width="30" height="66" fill="' +
    C.indigo +
    '"/>' +
    '<ellipse cx="571" cy="764" rx="62" ry="9" fill="' +
    C.ink +
    '"' +
    (C.dk ? ' stroke="' + C.halo + '" stroke-width="3"' : "") +
    "/>" +
    '<g transform="translate(440 492) skewY(-5)">' +
    '<rect x="0" y="0" width="270" height="200" rx="12" fill="' +
    C.ink +
    '"' +
    (C.dk ? ' stroke="' + C.halo + '" stroke-width="5"' : "") +
    "/>" +
    '<rect x="12" y="12" width="246" height="176" rx="4" fill="' +
    C.screen +
    '"/>';
  lines.forEach(function (l, i) {
    s +=
      '<rect x="' +
      (28 + l[0]) +
      '" y="' +
      (30 + i * 20) +
      '" width="' +
      l[1] +
      '" height="8" rx="4" fill="' +
      (i % 3 === 1 ? C.blue2 : C.light) +
      '" opacity=".85"/>';
  });
  s += '<rect x="28" y="170" width="' + n(growth) + '" height="8" rx="4" fill="' + C.light + '"/>';
  if (cursorOn) s += '<rect x="' + n(32 + growth) + '" y="166" width="5" height="16" fill="#fff"/>';
  return "<g>" + s + "</g></g>";
}

function coder(C: Palette, p: CoderParams): string {
  const T = p.T,
    typeAmp = p.typeAmp,
    turn = p.turn,
    blink = p.blink,
    mood = p.mood,
    tilt = p.tilt,
    look = p.look;
  const bob = Math.sin((2 * Math.PI * 8 * T) / END) * 2.5 * typeAmp;
  const tap = (2 * Math.PI * 52 * T) / END;
  const dyL = Math.max(0, Math.sin(tap)) * -20 * typeAmp;
  const dyR = Math.max(0, Math.sin(tap + Math.PI)) * -20 * typeAmp;
  const mir = turn < 0,
    f = Math.abs(turn);
  const lk = [mir ? -look[0] : look[0], look[1]];
  const happy = mood === "happy";
  const hL = [800, 744 + dyL],
    hR = [924, 744 + dyR];
  const head = "translate(0 " + n(bob) + ") rotate(" + n(bob * 0.8 + tilt) + " 860 600)";
  const inner = (mir ? "translate(1720 0) scale(-1 1) " : "") + "rotate(" + n(f * 5) + " 860 600)";
  const eL = 815 + f * 60,
    eR = 905 + f * 72,
    sL = 1 - f * 0.1,
    sR = 1 - f * 0.35;
  const cupL = 644 + f * 72,
    cupR = 1018 - f * 24;
  function arm(d: string) {
    return (
      '<g><path d="' +
      d +
      '" stroke="' +
      C.ink +
      '" stroke-width="34" fill="none" stroke-linecap="round"/>' +
      '<path d="' +
      d +
      '" stroke="' +
      C.paper +
      '" stroke-width="22" fill="none" stroke-linecap="round"/></g>'
    );
  }
  let s = "";
  s +=
    '<g transform="' +
    head +
    '"><g transform="' +
    inner +
    '">' +
    '<g transform="translate(' +
    n(-f * 12) +
    ' 0)">' +
    afro(C, 860, 420) +
    "</g>" +
    '<rect x="' +
    n(cupR) +
    '" y="400" width="58" height="106" rx="24" fill="' +
    C.blue +
    '" stroke="' +
    C.ink +
    '" stroke-width="4"/></g></g>';
  s += '<rect x="840" y="560" width="40" height="44" fill="' + C.paper + '" stroke="' + C.ink + '" stroke-width="5"/>';
  s +=
    '<path d="M810,598 Q860,584 910,598 L950,772 L770,772 Z" fill="' +
    C.ink +
    '" stroke="' +
    C.paper +
    '" stroke-width="6" stroke-linejoin="round"/>';
  s += '<rect x="732" y="748" width="256" height="18" rx="5" fill="' + C.mist + '"/>';
  s += '<path d="M748,756 h224" stroke="' + C.blue2 + '" stroke-width="3" stroke-dasharray="10 6"/>';
  s += arm("M818,616 Q780,690 " + hL[0] + "," + n(hL[1]));
  s += arm("M902,616 Q940,690 " + hR[0] + "," + n(hR[1]));
  s +=
    '<circle cx="' +
    hL[0] +
    '" cy="' +
    n(hL[1]) +
    '" r="17" fill="' +
    C.paper +
    '" stroke="' +
    C.ink +
    '" stroke-width="6"/>';
  s +=
    '<circle cx="' +
    hR[0] +
    '" cy="' +
    n(hR[1]) +
    '" r="17" fill="' +
    C.paper +
    '" stroke="' +
    C.ink +
    '" stroke-width="6"/>';
  // cabeza
  s += '<g transform="' + head + '"><g transform="' + inner + '">';
  s +=
    '<rect x="' +
    n(745 + f * 50) +
    '" y="385" width="' +
    n(230 - f * 22) +
    '" height="190" rx="70" fill="' +
    C.paper +
    '" stroke="' +
    C.ink +
    '" stroke-width="5"/>';
  s +=
    '<path d="M' +
    n(735 + f * 50) +
    ",445 V330 Q" +
    n(860 + f * 40) +
    ",220 " +
    n(985 + f * 30) +
    ',330 V445 Z" fill="' +
    C.ink +
    '"/>';
  s +=
    '<path d="M' +
    n(cupR + 29) +
    ",440 C" +
    n(cupR + 29) +
    ",180 " +
    n(cupL + 29) +
    ",180 " +
    n(cupL + 29) +
    ',440" stroke="' +
    C.indigo +
    '" stroke-width="22" fill="none" stroke-linecap="round"/>';
  s +=
    '<path d="M' +
    n(792 + f * 58) +
    ",446 l6,-22 M" +
    n(928 + f * 64) +
    ',446 l-6,-22" stroke="' +
    C.paper +
    '" stroke-width="4" stroke-linecap="round"/>';
  const fxr = 745 + f * 50,
    fwr = 230 - f * 22;
  s +=
    '<clipPath id="zcupclip"><path clip-rule="evenodd" d="M-500 0H2500V1200H-500Z M' +
    n(fxr) +
    " 385 h" +
    n(fwr) +
    " v190 h-" +
    n(fwr) +
    'Z"/></clipPath>';
  s +=
    '<g clip-path="url(#zcupclip)"><rect x="' +
    n(cupR) +
    '" y="400" width="58" height="106" rx="24" fill="' +
    C.blue +
    '" stroke="' +
    C.ink +
    '" stroke-width="4"/></g>';
  s += '<ellipse cx="' + n(776 + f * 62) + '" cy="534" rx="' + n(16 * sL) + '" ry="8" fill="' + C.light + '"/>';
  s +=
    '<ellipse cx="' +
    n(944 + f * 50) +
    '" cy="534" rx="' +
    n(16 * sR) +
    '" ry="8" fill="' +
    C.light +
    '" opacity="' +
    n(1 - f) +
    '"/>';
  s += eye(C, { x: eL, y: 492, blink: blink, happy: happy, lx: lk[0], ly: lk[1], sx: sL, side: -1 });
  s += eye(C, { x: eR, y: 492, blink: blink, happy: happy, lx: lk[0] * sR, ly: lk[1], sx: sR, side: 1 });
  s +=
    '<ellipse cx="' +
    n(eL) +
    '" cy="492" rx="' +
    n(38 * sL) +
    '" ry="38" fill="none" stroke="' +
    C.ink +
    '" stroke-width="6"/>';
  s +=
    '<ellipse cx="' +
    n(eR) +
    '" cy="492" rx="' +
    n(38 * sR) +
    '" ry="38" fill="none" stroke="' +
    C.ink +
    '" stroke-width="6"/>';
  s +=
    '<path d="M' +
    n(eL + 38 * sL) +
    ",488 Q" +
    n((eL + eR) / 2 + 10 * f) +
    ",480 " +
    n(eR - 38 * sR) +
    ',488" stroke="' +
    C.ink +
    '" stroke-width="5" fill="none"/>';
  s += '<g transform="translate(' + n(f * 78) + ' 0)">';
  if (happy)
    s +=
      '<path d="M846,540 Q860,556 874,540" stroke="' +
      C.ink +
      '" stroke-width="5" fill="none" stroke-linecap="round"/>';
  if (mood === "doubt")
    s += '<path d="M853,546 h14" stroke="' + C.ink + '" stroke-width="4.5" fill="none" stroke-linecap="round"/>';
  if (mood === "think")
    s +=
      '<path d="M858,548 q6,-5 11,0 q6,5 11,0" stroke="' +
      C.ink +
      '" stroke-width="4" fill="none" stroke-linecap="round"/>';
  s += "</g>";
  s +=
    '<rect x="' +
    n(cupL) +
    '" y="400" width="' +
    n(58 + f * 8) +
    '" height="106" rx="24" fill="' +
    C.blue +
    '" stroke="' +
    C.ink +
    '" stroke-width="4"/>';
  s += "</g></g>";
  return "<g>" + s + "</g>";
}

function cat(C: Palette, T: number, twitch: number): string {
  const breath = 1 + Math.sin((2 * Math.PI * 5 * T) / END) * 0.035;
  // Formas negras del gato; attr decide si se dibujan como silueta clara (borde) o como relleno negro
  function shapes(attr: string) {
    return (
      '<g transform="translate(1265 766) scale(1 ' +
      n(breath) +
      ') translate(-1265 -766)">' +
      '<path d="M1150,766 C1140,690 1210,640 1280,642 C1350,644 1392,690 1388,740 C1386,758 1376,766 1360,766 Z" ' +
      attr +
      "/>" +
      '<path d="M1272,660 L1290,628 L1306,664" ' +
      attr +
      "/></g>" +
      '<g transform="rotate(' +
      n(twitch * -14) +
      ' 1150 690)"><path d="M1110,700 L1112,650 L1146,682 Z" ' +
      attr +
      "/></g>" +
      '<path d="M1180,684 L1196,648 L1214,690 Z" ' +
      attr +
      "/>" +
      '<ellipse cx="1165" cy="726" rx="62" ry="46" ' +
      attr +
      "/>" +
      '<path d="M1136,766 q0,-20 24,-20 q22,0 22,20 Z" ' +
      attr +
      "/>" +
      '<path d="M1190,766 q0,-18 22,-18 q20,0 20,18 Z" ' +
      attr +
      "/>"
    );
  }
  let s = C.dk ? shapes('fill="' + C.halo + '" stroke="' + C.halo + '" stroke-width="12" stroke-linejoin="round"') : "";
  s += shapes('fill="' + C.ink + '"');
  s +=
    '<g transform="translate(1265 766) scale(1 ' +
    n(breath) +
    ') translate(-1265 -766)"><path d="M1282,656 L1290,640 L1298,658" stroke="' +
    C.paper +
    '" stroke-width="3" fill="none" stroke-linejoin="round"/></g>';
  s +=
    '<path d="M1182,766 q-2,-14 -10,-18" stroke="' +
    C.paper +
    '" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
  s += '<path d="M1132,722 h14 M1172,722 h14" stroke="' + C.paper + '" stroke-width="3.5" stroke-linecap="round"/>';
  s +=
    '<path d="M1150,738 q5,6 9,0 q4,6 9,0" stroke="' +
    C.paper +
    '" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
  for (let i = 0; i < 3; i++) {
    const p = frac((T * 4) / END + i / 3);
    s +=
      '<text x="' +
      n(1220 + p * 60 + i * 6) +
      '" y="' +
      n(640 - p * 120) +
      '" opacity="' +
      n(Math.sin(p * Math.PI)) +
      '" font-family="Jost, Futura, sans-serif" font-weight="700" font-size="' +
      n(22 + p * 18) +
      '" fill="' +
      C.indigo +
      '">z</text>';
  }
  return "<g>" + s + "</g>";
}

function note(x: number, y: number, s: number, color: string, op: number): string {
  return (
    '<g opacity="' +
    n(op) +
    '" transform="translate(' +
    n(x) +
    " " +
    n(y) +
    ") scale(" +
    n(s) +
    ')">' +
    '<ellipse cx="0" cy="0" rx="13" ry="10" fill="' +
    color +
    '" transform="rotate(-20)"/>' +
    '<path d="M11,-4 V-48 Q24,-40 30,-28" stroke="' +
    color +
    '" stroke-width="5" fill="none" stroke-linecap="round"/></g>'
  );
}

function zombie(C: Palette, walk: number): string {
  const skin = C.skin;
  const step = Math.sin(walk),
    swing = Math.sin(walk + 0.8) * 14,
    stiff = Math.sin(walk * 0.5) * 5,
    drift = Math.sin(walk * 0.37);
  function limb(d: string, w: number) {
    return (
      '<g><path d="' +
      d +
      '" stroke="' +
      C.zl +
      '" stroke-width="' +
      (w + 10) +
      '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="' +
      d +
      '" stroke="' +
      skin +
      '" stroke-width="' +
      w +
      '" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>'
    );
  }
  const a = Math.abs(step);
  let s = "";
  s += limb("M20,104 Q30," + n(190 + swing) + " " + n(10 + swing) + ",260", 20);
  s +=
    '<path d="M-62,70 Q0,56 62,70 L82,300 L60,284 L40,304 L18,282 L-6,306 L-30,282 L-52,302 L-80,286 Z" fill="' +
    C.blue +
    '" stroke="' +
    C.zl +
    '" stroke-width="5" stroke-linejoin="round"/>';
  s += '<path d="M10,130 l14,22 l-18,14 M-40,220 l10,18" stroke="' + C.zl + '" stroke-width="4" fill="none"/>';
  s += limb("M-36,112 Q-104," + n(100 + stiff) + " -168," + n(110 + stiff * 1.6), 20);
  s += limb(
    "M-170," +
      n(104 + stiff * 1.6) +
      " l-18,8 M-170," +
      n(110 + stiff * 1.6) +
      " l-20,16 M-168," +
      n(116 + stiff * 1.6) +
      " l-12,20",
    5,
  );
  s += '<g transform="rotate(' + n(step * 7 - 4) + ' 0 60)">';
  s += '<ellipse cx="0" cy="0" rx="86" ry="80" fill="' + skin + '" stroke="' + C.zl + '" stroke-width="5"/>';
  s +=
    '<path d="M14,-66 L28,-98 L40,-64 L56,-92 L62,-56 L78,-74 L80,-30 Q60,-70 14,-66 Z" fill="' +
    C.ink +
    '" stroke="' +
    C.zl +
    '" stroke-width="3" stroke-linejoin="round"/>';
  s +=
    '<path d="M-82,-24 Q-84,-80 -30,-94 Q18,-100 22,-62 L10,-56 L2,-66 L-8,-52 L-20,-62 L-32,-48 L-44,-58 L-56,-42 L-68,-50 Z" fill="' +
    C.hairw +
    '" stroke="' +
    C.zl +
    '" stroke-width="5" stroke-linejoin="round"/>';
  s +=
    '<path d="M-66,-56 q10,-14 22,-4 q8,-16 22,-6 M-58,-76 q12,-6 18,4 q10,-10 22,0 M-18,-82 q10,4 6,14" stroke="' +
    C.blue +
    '" stroke-width="4" fill="none" stroke-linecap="round"/>';
  s +=
    '<path d="M40,22 l26,12 M46,16 l-4,12 M56,21 l-4,12" stroke="' +
    C.zl +
    '" stroke-width="3.5" stroke-linecap="round"/>';
  s += '<ellipse cx="50" cy="-4" rx="16" ry="11" fill="' + C.mist + '"/>';
  s +=
    '<path d="M-74,18 q16,10 34,0 M-24,22 q14,8 28,0" stroke="' +
    C.blue +
    '" stroke-width="4" fill="none" stroke-linecap="round"/>';
  s += '<circle cx="-54" cy="-2" r="20" fill="' + C.paper + '" stroke="' + C.zl + '" stroke-width="4"/>';
  s += '<circle cx="' + n(-48 + drift * 4) + '" cy="' + n(-9 + drift * 2) + '" r="3.5" fill="' + C.ink + '"/>';
  s += '<circle cx="-10" cy="2" r="17" fill="' + C.paper + '" stroke="' + C.zl + '" stroke-width="4"/>';
  s += '<circle cx="' + n(-17 - drift * 3) + '" cy="10" r="3.5" fill="' + C.ink + '"/>';
  s += '<path d="M-78,-12 h48 v-14 h-48 Z M-31,-10 h40 v-12 h-40 Z" fill="' + skin + '"/>';
  s += '<path d="M-75,-10 h42 M-28,-8 h36" stroke="' + C.zl + '" stroke-width="4" stroke-linecap="round"/>';
  s += '<ellipse cx="-38" cy="48" rx="15" ry="' + n(20 + a * 3) + '" fill="' + C.ink + '"/>';
  s += '<path d="M-44,30 l4,9 l4,-9" fill="' + C.paper + '"/>';
  s +=
    '<path d="M-28,' +
    n(60 + a * 3) +
    " q-3,10 2," +
    n(18 + a * 6) +
    '" stroke="' +
    C.light +
    '" stroke-width="4" fill="none" stroke-linecap="round"/>';
  s += "</g>";
  return "<g>" + s + "</g>";
}

const WINS: { x: number; moon: boolean }[] = [
  { x: 150, moon: true },
  { x: 1400, moon: false },
];
function windows(C: Palette, T: number, zx: number, zdir: number, zbob: number, ztilt: number, walk: number): string {
  let s = '<defs><clipPath id="zglass">';
  WINS.forEach(function (w) {
    s += '<rect x="' + w.x + '" y="200" width="360" height="500"/>';
  });
  s += "</clipPath></defs>";
  WINS.forEach(function (w, i) {
    s +=
      '<g><rect x="' +
      (w.x - 16) +
      '" y="184" width="392" height="532" rx="6" fill="' +
      C.frame +
      '"/>' +
      '<rect x="' +
      w.x +
      '" y="200" width="360" height="500" fill="' +
      C.night +
      '"/>';
    if (w.moon)
      s +=
        '<g><circle cx="' +
        (w.x + 270) +
        '" cy="270" r="34" fill="#fff"/><circle cx="' +
        (w.x + 286) +
        '" cy="258" r="30" fill="' +
        C.night +
        '"/></g>';
    [
      [40, 50],
      [300, 70],
      [120, 140],
      [250, 210],
      [60, 330],
    ].forEach(function (p, j) {
      s +=
        '<circle cx="' +
        (w.x + p[0]) +
        '" cy="' +
        (200 + p[1]) +
        '" r="' +
        n(2.5 + 1.5 * Math.abs(Math.sin((2 * Math.PI * 3 * T) / END + j * 2 + i))) +
        '" fill="#fff"/>';
    });
    s += "</g>";
  });
  s +=
    '<g clip-path="url(#zglass)"><g transform="translate(' +
    n(zx) +
    " " +
    n(440 - zbob) +
    ") scale(" +
    zdir +
    " 1) rotate(" +
    n(ztilt) +
    ')">' +
    zombie(C, walk) +
    "</g></g>";
  WINS.forEach(function (w) {
    s +=
      '<g><path d="M' +
      (w.x + 20) +
      ",300 l90,-90 M" +
      (w.x + 40) +
      ",340 l130,-130 M" +
      (w.x + 220) +
      ',690 l120,-120" stroke="#fff" stroke-width="10" opacity="0.1" stroke-linecap="round"/>' +
      '<rect x="' +
      (w.x + 175) +
      '" y="200" width="10" height="500" fill="' +
      C.frame +
      '"/>' +
      '<rect x="' +
      w.x +
      '" y="445" width="360" height="10" fill="' +
      C.frame +
      '"/>' +
      '<rect x="' +
      (w.x - 32) +
      '" y="700" width="424" height="22" rx="4" fill="' +
      C.indigo +
      '"/></g>';
  });
  return "<g>" + s + "</g>";
}

function frame(T: number): string {
  const C = palette();
  const Wk = [CUES.Walk1, CUES.Walk2],
    Tn = [CUES.Turn1, CUES.Turn2],
    R = [CUES.Resume1, CUES.Resume2];
  const side = [-1, 1];
  function ip(keys: number[], vals: number[], ease?: Ease | Ease[]) {
    return interp(T, keys, vals, ease);
  }

  const typeAmp = ip(
    [Tn[0] - 0.9, Tn[0] - 0.7, R[0] + 1.45, R[0] + 1.7, Tn[1] - 0.9, Tn[1] - 0.7, R[1] + 1.45, R[1] + 1.7],
    [1, 0, 0, 1, 1, 0, 0, 1],
  );
  const turn = ip(
    [Tn[0], Tn[0] + 0.4, R[0], R[0] + 0.45, Tn[1], Tn[1] + 0.4, R[1], R[1] + 0.45],
    [0, -1, -1, 0, 0, 1, 1, 0],
  );
  const pi = T < Wk[1] ? 0 : 1;
  const mood =
    T >= Tn[pi] - 1.0 && T < R[pi] + 0.45 ? "doubt" : T >= R[pi] + 0.45 && T < R[pi] + 1.35 ? "think" : "happy";
  const blink = Math.min(
    1,
    bump(T, 1.0, 0.12) +
      bump(T, Tn[0] + 1.0, 0.12) +
      bump(T, R[0] + 0.9, 0.12) +
      bump(T, Tn[1] + 1.0, 0.12) +
      bump(T, R[1] + 0.9, 0.12),
  );
  const tilt = [0, 1].reduce(function (acc: number, i: number) {
    return (
      acc +
      interp(T, [R[i] + 0.45, R[i] + 0.8, R[i] + 1.2, R[i] + 1.35], [0, -7, -7, 0], E.cubic) +
      Math.sin((T - R[i]) * Math.PI * 9) * 6 * bump(T, R[i] + 1.5, 0.2)
    );
  }, 0);
  const lookX = ip(
    [
      Tn[0] - 1.0,
      Tn[0] - 0.75,
      R[0] + 0.3,
      R[0] + 0.6,
      R[0] + 1.25,
      R[0] + 1.45,
      Tn[1] - 1.0,
      Tn[1] - 0.75,
      R[1] + 0.3,
      R[1] + 0.6,
      R[1] + 1.25,
      R[1] + 1.45,
    ],
    [-4, -6, -6, -6, -6, -4, -4, 6, 6, -6, -6, -4],
  );
  const lookY = ip(
    [R[0] + 0.3, R[0] + 0.6, R[0] + 1.25, R[0] + 1.45, R[1] + 0.3, R[1] + 0.6, R[1] + 1.25, R[1] + 1.45],
    [0, -7, -7, 0, 0, -7, -7, 0],
  );

  const walk = T * Math.PI * 2 * 1.1;
  const zx =
    ip([Wk[0] + 0.2, Tn[0] - 0.1, Wk[1] + 0.2, Tn[1] - 0.1], [2050, -250, -250, 2050], E.linear) + Math.sin(walk) * 10;
  const zdir = pi === 0 ? 1 : -1;
  const zbob = Math.abs(Math.sin(walk)) * (Math.sin(walk) > 0 ? 18 : 7);
  const ztilt = 8 + Math.sin(walk * 0.5) * 6;
  const twitch = bump(T, Tn[0] + 0.4, 0.15) + bump(T, Tn[1] + 0.4, 0.15);

  const camK = [0, Wk[0], Tn[0] - 0.6, Tn[0] + 0.3, R[0] + 1.2, Wk[1], Tn[1] - 0.6, Tn[1] + 0.3, R[1] + 1.2, END];
  const s = smooth(T, camK, [1, 1.06, 1.06, 1.2, 1.02, 1.06, 1.06, 1.2, 1.02, 1]);
  const walkEnv = ip(
    [Wk[0], Wk[0] + 0.8, Tn[0] - 0.8, Tn[0], Wk[1], Wk[1] + 0.8, Tn[1] - 0.8, Tn[1]],
    [0, 1, 1, 0, 0, 1, 1, 0],
  );
  const fx = clamp(
    smooth(T, camK, [960, 960, 960, 860, 960, 960, 960, 860, 960, 960]) + (clamp(zx, 0, 1920) - 960) * 0.18 * walkEnv,
    960 / s,
    1920 - 960 / s,
  );
  const fy = clamp(smooth(T, camK, [540, 520, 520, 500, 540, 520, 520, 500, 540, 540]), 540 / s, 1080 - 540 / s);

  const q = ip(
    [Tn[pi] - 0.95, Tn[pi] - 0.75, Tn[pi] + 0.3, Tn[pi] + 0.55, R[pi] + 1.2, R[pi] + 1.4],
    [0, 0.6, 0.6, 1, 1, 0],
    [E.back, E.cubic, E.back, E.cubic, E.cubic],
  );
  const qx = 860 + side[pi] * 230;

  let out =
    '<g transform="translate(960 540) scale(' +
    s.toFixed(5) +
    ") translate(" +
    (-fx).toFixed(3) +
    " " +
    (-fy).toFixed(3) +
    ')">';
  // sala
  out += '<rect x="-1000" y="-1000" width="3920" height="3080" fill="' + C.wall + '"/>';
  out += '<rect x="0" y="854" width="1920" height="5" fill="' + C.line + '"/>';
  out += windows(C, T, zx, zdir, zbob, ztilt, walk);
  out += '<rect x="360" y="766" width="1060" height="26" fill="' + C.indigo + '"/>';
  out += '<rect x="380" y="792" width="1020" height="288" fill="' + C.desk + '"/>';
  out += monitor(C, T, typeAmp);
  out += coder(C, { T: T, typeAmp: typeAmp, turn: turn, blink: blink, mood: mood, tilt: tilt, look: [lookX, lookY] });
  out += cat(C, T, twitch);
  for (let i = 0; i < 4; i++) {
    const p = frac((T * 8) / END + i / 4),
      sd = i % 2 ? 1 : -1;
    out += note(
      860 + sd * (230 + p * 90) + Math.sin(p * 9 + i) * 16,
      430 - p * 260,
      0.8 + p * 0.5,
      i % 2 ? C.blue : C.indigo,
      Math.sin(p * Math.PI) * typeAmp,
    );
  }
  out +=
    '<g opacity="' +
    (q > 0 ? 1 : 0) +
    '" transform="translate(' +
    n(qx) +
    " 280) scale(" +
    n(Math.max(q, 0)) +
    ") rotate(" +
    n(Math.sin(T * 6) * 8) +
    ')">' +
    '<text x="0" y="0" text-anchor="middle" font-family="Jost, Futura, sans-serif" font-weight="800" font-size="120" fill="' +
    C.indigo +
    '">?</text></g>';
  out += "</g>";
  return out;
}

/** Monta la escena dentro de `root`. Devuelve la función que la detiene y la quita (para useEffect). */
export function initScene(root: HTMLElement): () => void {
  root.innerHTML =
    '<svg class="zscene" viewBox="0 0 ' +
    W +
    " " +
    H +
    '" role="img" aria-label="Ilustración: yo programando con audífonos mientras un zombi pasa por la ventana y el gato duerme"></svg>';
  const svg = root.firstElementChild as SVGElement;
  const draw = (T: number) => {
    svg.innerHTML = frame(T);
  };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    draw(1);
    return () => {
      root.innerHTML = "";
    };
  }

  let visible = true,
    start: number | null = null,
    last = 0,
    raf = 0;
  const minGap = matchMedia("(pointer: coarse)").matches ? 33 : 0; // 30 fps en móvil, 60 en escritorio
  const io = new IntersectionObserver(
    (e) => {
      visible = e[0].isIntersecting;
    },
    { threshold: 0 },
  );
  io.observe(root);
  const loop = (ts: number) => {
    raf = requestAnimationFrame(loop);
    if (!visible || document.hidden || ts - last < minGap) return;
    last = ts;
    if (start == null) start = ts;
    draw(((ts - start) / 1000) % END);
  };
  draw(0);
  raf = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    root.innerHTML = "";
  };
}
