import { WorldId } from "../app/modes";

export type ProjectStatus = "draft" | "done";

export type Project = {
  id: string;
  worldId: WorldId;
  origin: "home" | "not_sure";
  createdAt: number;
  updatedAt: number;
  status: ProjectStatus;
  title: string; // human-readable title
  state: Record<string, unknown>;
};

const STORAGE_KEY = "iai_ui_projects_v1";

function now() {
  return Date.now();
}

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function worldLabel(worldId: WorldId) {
  switch (worldId) {
    case "game":
      return "Game";
    case "not_sure":
      return "Not sure";
    case "planner":
      return "Planner";
    case "writing":
      return "Writing";
    case "video":
      return "Video";
    case "app":
      return "App / Tool";
    default:
      return "World";
  }
}

let counters: Record<string, number> | null = null;

function nextCounter(key: string) {
  if (!counters) counters = {};
  counters[key] = (counters[key] ?? 0) + 1;
  return counters[key];
}

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Project[];
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
  const n = nextCounter(params.worldId);
  const title = `${worldLabel(params.worldId)} #${n}`;
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
  const idx = projects.findIndex((p) => p.id === project.id);
  const updated = { ...project, updatedAt: now() };
  if (idx === -1) return [updated, ...projects];
  const copy = projects.slice();
  copy[idx] = updated;
  return copy;
}

export function deleteProject(projects: Project[], id: string): Project[] {
  return projects.filter((p) => p.id !== id);
}
