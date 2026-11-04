const loaded = new Map<string, Promise<void>>();

function load(src: string) {
  let p = loaded.get(src);
  if (!p) {
    p = new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      document.head.appendChild(s);
    });
    loaded.set(src, p);
  }
  return p;
}

/** Carga scripts en orden, una sola vez por sesión. Si alguno falla, la página sigue funcionando. */
export async function loadScripts(srcs: string[]) {
  for (const src of srcs) {
    try { await load(src); } catch { /* el texto del globo sigue visible sin las librerías */ }
  }
}
