import { IMG_DIMS } from "@/data";

const esc = (s: string) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

/** Escapa y aplica **negrita**, *cursiva* y [pendientes] resaltados. Devuelve HTML seguro para dangerouslySetInnerHTML. */
export const rich = (s: string) =>
  esc(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]/g, '<span class="todo">[$1]</span>');

/** Texto sin marcas de formato. */
export const plain = (s: string) => String(s).replace(/[[\]*]/g, "");

/** Dimensiones reales y tamaños responsivos de una imagen WebP de /assets/<proyecto>/. */
export function imgProps(src: string) {
  const m = src.match(/^(\/assets\/[^/]+\/)([^/]+)\.webp$/);
  const d = m && IMG_DIMS[m[2]];
  if (!m || !d) return {};
  const props: { width: number; height: number; srcSet?: string; sizes?: string } = { width: d[0], height: d[1] };
  if (d[0] > 800) {
    props.srcSet = `${m[1]}${m[2]}-720.webp 720w, ${src} ${d[0]}w`;
    props.sizes = "(max-width: 900px) 100vw, 800px";
  }
  return props;
}
