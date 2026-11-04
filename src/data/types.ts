export type Img = { src: string; alt?: string; caption?: string; scroll?: boolean; pad?: string; label?: string };

export type Block =
  | { t: "p"; text: string }
  | { t: "ul"; items: string[] }
  | ({ t: "image" } & Img)
  | { t: "pair"; items: Img[] }
  | { t: "compare"; items: Img[] }
  | { t: "phones"; items: Img[] }
  | { t: "colors"; groups: { name: string; items: [string, string][] }[] }
  | { t: "decisions"; items: { title: string; text: string }[] }
  | { t: "note"; text: string };

export type Project = {
  slug: string;
  title: string;
  short?: string;
  summary: string;
  tags: string[];
  year: string;
  cover: string;
  coverAlt?: string;
  ogImage?: string;
  tldr?: [string, string][];
  facts: [string, string | string[]][];
  stats: [string, string][];
  chapters: { id: string; title: string; blocks: Block[] }[];
};

export type Site = {
  name: string;
  shortName: string;
  headline: string;
  lede: string;
  about: string[];
  home: { name: string; short: string; lat: number; lon: number };
  skillsIntro: string;
  skills: Record<string, [string, string][]>;
  contact: { email: string; links: { label: string; icon?: string; href: string }[] };
};
