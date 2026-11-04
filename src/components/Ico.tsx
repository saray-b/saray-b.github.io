/* eslint-disable @next/next/no-img-element */
/** Icono monocromo desde /assets/icons. */
export default function Ico({ name, size = 22 }: { name: string; size?: number }) {
  return <img className="ico" src={`/assets/icons/${name}.svg`} alt="" width={size} height={size} loading="lazy" />;
}
