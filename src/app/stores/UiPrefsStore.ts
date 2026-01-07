import { useSyncExternalStore } from "react";
import { WorldId } from "../modes";

export type GallerySort = "pinned_recent" | "recent" | "title";
export type ProjectsView = "list" | "gallery";
export type ProjectsStatusFilter = "all" | "draft" | "done";
export type ProjectsWorldFilter = "all" | WorldId;

export type UiPrefs = {
  iconOrder: WorldId[];
  pinnedProjectIds: string[];
  gallerySort: GallerySort;

  projectsView: ProjectsView;
  projectsWorldFilter: ProjectsWorldFilter;
  projectsStatusFilter: ProjectsStatusFilter;
  projectsQuery: string;
};

const STORAGE_KEY = "iai.uiPrefs.v0";

const DEFAULT_PREFS: UiPrefs = {
  iconOrder: [],
  pinnedProjectIds: [],
  gallerySort: "pinned_recent",

  projectsView: "list",
  projectsWorldFilter: "all",
  projectsStatusFilter: "all",
  projectsQuery: "",
};

let _prefs: UiPrefs = load();
const _listeners = new Set<() => void>();

function emit() {
  for (const fn of _listeners) fn();
}

function safeGetItem(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function readJson<T>(key: string): T | null {
  const raw = safeGetItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    safeSetItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function isGallerySort(v: unknown): v is GallerySort {
  return v === "pinned_recent" || v === "recent" || v === "title";
}

function isProjectsView(v: unknown): v is ProjectsView {
  return v === "list" || v === "gallery";
}

function isProjectsStatusFilter(v: unknown): v is ProjectsStatusFilter {
  return v === "all" || v === "draft" || v === "done";
}

function isWorldId(v: unknown): v is WorldId {
  return (
    v === "game" ||
    v === "not_sure" ||
    v === "planner" ||
    v === "writing" ||
    v === "video" ||
    v === "app"
  );
}

function isProjectsWorldFilter(v: unknown): v is ProjectsWorldFilter {
  return v === "all" || isWorldId(v);
}

function load(): UiPrefs {
  const data = readJson<any>(STORAGE_KEY);
  if (!data || typeof data !== "object") return { ...DEFAULT_PREFS };

  const iconOrder = Array.isArray(data.iconOrder)
    ? (data.iconOrder as unknown[]).filter((x): x is WorldId => typeof x === "string")
    : [];

  const pinnedProjectIds = Array.isArray(data.pinnedProjectIds)
    ? (data.pinnedProjectIds as unknown[]).filter((x): x is string => typeof x === "string")
    : [];

  const gallerySort: GallerySort = isGallerySort(data.gallerySort)
    ? data.gallerySort
    : DEFAULT_PREFS.gallerySort;

  const projectsView: ProjectsView = isProjectsView(data.projectsView)
    ? data.projectsView
    : DEFAULT_PREFS.projectsView;

  const projectsWorldFilter: ProjectsWorldFilter = isProjectsWorldFilter(data.projectsWorldFilter)
    ? data.projectsWorldFilter
    : DEFAULT_PREFS.projectsWorldFilter;

  const projectsStatusFilter: ProjectsStatusFilter = isProjectsStatusFilter(data.projectsStatusFilter)
    ? data.projectsStatusFilter
    : DEFAULT_PREFS.projectsStatusFilter;

  const projectsQuery: string = typeof data.projectsQuery === "string" ? data.projectsQuery : DEFAULT_PREFS.projectsQuery;

  return {
    iconOrder,
    pinnedProjectIds,
    gallerySort,
    projectsView,
    projectsWorldFilter,
    projectsStatusFilter,
    projectsQuery,
  };
}

function save(next: UiPrefs) {
  _prefs = next;
  writeJson(STORAGE_KEY, next);
  emit();
}

function subscribe(cb: () => void) {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

function getSnapshot() {
  return _prefs;
}

export function useUiPrefs(): UiPrefs {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function setIconOrder(nextOrder: WorldId[]) {
  const seen = new Set<string>();
  const cleaned: WorldId[] = [];
  for (const id of nextOrder) {
    if (!seen.has(id)) {
      seen.add(id);
      cleaned.push(id);
    }
  }
  save({ ..._prefs, iconOrder: cleaned });
}

export function togglePinnedProject(id: string) {
  const cur = _prefs.pinnedProjectIds ?? [];
  const has = cur.includes(id);
  const next = has ? cur.filter((x) => x !== id) : [id, ...cur];
  save({ ..._prefs, pinnedProjectIds: next });
}

export function setGallerySort(sort: GallerySort) {
  save({ ..._prefs, gallerySort: sort });
}

export function setProjectsView(view: ProjectsView) {
  save({ ..._prefs, projectsView: view });
}

export function setProjectsWorldFilter(v: ProjectsWorldFilter) {
  save({ ..._prefs, projectsWorldFilter: v });
}

export function setProjectsStatusFilter(v: ProjectsStatusFilter) {
  save({ ..._prefs, projectsStatusFilter: v });
}

export function setProjectsQuery(q: string) {
  save({ ..._prefs, projectsQuery: q });
}
