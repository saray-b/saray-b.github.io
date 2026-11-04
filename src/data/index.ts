import site from "./site.json";
import projects from "./projects.json";
import dims from "./img-dims.json";
import type { Project, Site } from "./types";

export const SITE = site as unknown as Site;
export const PROJECTS = projects as unknown as Project[];
export const IMG_DIMS = dims as unknown as Record<string, [number, number]>;
export const SITE_URL = "https://saray-b.github.io";
