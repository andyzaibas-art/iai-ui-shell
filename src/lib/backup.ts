import type { Project } from "../projects/ProjectStore";

const PROJECTS_KEY = "iai_ui_projects_v1";
const UIPREFS_KEY = "iai.uiPrefs.v0";

export type BackupBundle = {
  version: "iai-ui-shell-backup-v1";
  createdAt: number;
  projects: Project[];
  uiPrefsRaw: unknown | null;
};

function safeReadJson(key: string): unknown | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function safeWriteJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function exportBackup(): BackupBundle {
  const projectsRaw = safeReadJson(PROJECTS_KEY);
  const projects = Array.isArray(projectsRaw) ? (projectsRaw as Project[]) : [];
  const uiPrefsRaw = safeReadJson(UIPREFS_KEY);

  return {
    version: "iai-ui-shell-backup-v1",
    createdAt: Date.now(),
    projects,
    uiPrefsRaw,
  };
}

export function importBackup(bundle: unknown): { ok: boolean; reason?: string } {
  if (!bundle || typeof bundle !== "object") return { ok: false, reason: "Invalid bundle" };
  const b: any = bundle;

  if (b.version !== "iai-ui-shell-backup-v1") return { ok: false, reason: "Unsupported version" };
  if (!Array.isArray(b.projects)) return { ok: false, reason: "Missing projects" };

  safeWriteJson(PROJECTS_KEY, b.projects);

  if ("uiPrefsRaw" in b) {
    safeWriteJson(UIPREFS_KEY, b.uiPrefsRaw ?? {});
  }

  return { ok: true };
}
