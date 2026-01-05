import { useSyncExternalStore } from "react";
import { WorldId } from "../modes";

export type GallerySort = "pinned_recent" | "recent" | "title";

export type UiPrefs = {
  iconOrder: WorldId[];
  pinnedProjectIds: string[];
  gallerySort: GallerySort;
};

const STORAGE_KEY = "iai.uiPrefs.v0";

const DEFAULT_PREFS: UiPrefs = {
  iconOrder: [],
  pinnedProjectIds: [],
  gallerySort: "pinned_recent",
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

  return { iconOrder, pinnedProjectIds, gallerySort };
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
