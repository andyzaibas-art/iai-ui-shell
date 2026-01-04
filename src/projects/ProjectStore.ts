import { WorldId } from "../app/modes";
import { WORLD_CATALOG } from "../app/worldCatalog";

export type ProjectStatus = "draft" | "done";

export type Project = {
  id: string;
  worldId: WorldId;
  origin: "home" | "not_sure";
  createdAt: number;
  updatedAt: number;
  status: ProjectStatus;
  title: string;
  state: Record<string, unknown>;
};

const STORAGE_KEY = "iai_ui_projects_v1";
const SEQ_KEY = "iai_ui_project_seq_v1";

function now() {
  return Date.now();
}

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function loadSeq(): Record<string, number> {
  const v = readJson<Record<string, number>>(SEQ_KEY);
  if (!v || typeof v !== "object") return {};
  return v;
}

function nextSeq(worldId: WorldId): number {
  const seq = loadSeq();
  const k = worldId as string;
  const n = (seq[k] ?? 0) + 1;
  seq[k] = n;
  writeJson(SEQ_KEY, seq);
  return n;
}

function sortNewestFirst(items: Project[]): Project[] {
  return items
    .slice()
    .sort((a, b) => (b?.updatedAt ?? 0) - (a?.updatedAt ?? 0));
}

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortNewestFirst(parsed as Project[]);
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function createProject(params: {
  worldId: WorldId;
  origin: "home" | "not_sure";
}): Project {
  const t = now();
  const n = nextSeq(params.worldId);
  const label = WORLD_CATALOG[params.worldId]?.label ?? params.worldId;
  const title = `${label} #${n}`;

  return {
    id: generateId(),
    worldId: params.worldId,
    origin: params.origin,
    createdAt: t,
    updatedAt: t,
    status: "draft",
    title,
    state: {},
  };
}

export function upsertProject(projects: Project[], project: Project): Project[] {
  const updated: Project = { ...project, updatedAt: now() };

  // Always bubble updated project to top (most-recent first).
  const rest = projects.filter((p) => p.id !== updated.id);
  return [updated, ...rest];
}

export function deleteProject(projects: Project[], id: string): Project[] {
  return projects.filter((p) => p.id !== id);
}
