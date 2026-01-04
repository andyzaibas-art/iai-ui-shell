import { useEffect, useMemo, useState } from "react";
import { AppState, WorldId } from "./app/modes";
import { enableBeforeUnloadGuard } from "./app/guards";
import HomeScreen from "./home/HomeScreen";
import ProjectList from "./projects/ProjectList";
import WorldShell from "./world/WorldShell";
import AppShell from "./app/ui/AppShell";
import {
  createProject,
  loadProjects,
  saveProjects,
  upsertProject,
  Project,
} from "./projects/ProjectStore";

const initialState: AppState = { mode: "home" };

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

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function cloneJson<T>(v: T): T {
  try {
    return JSON.parse(JSON.stringify(v)) as T;
  } catch {
    return v;
  }
}

function normalizeImportedProject(raw: unknown): Project | null {
  if (!raw || typeof raw !== "object") return null;
  const o: any = raw;

  if (!isWorldId(o.worldId)) return null;

  const t = Date.now();

  const origin: Project["origin"] =
    o.origin === "home" || o.origin === "not_sure" ? o.origin : "home";

  const status: Project["status"] =
    o.status === "draft" || o.status === "done" ? o.status : "draft";

  const createdAt = typeof o.createdAt === "number" ? o.createdAt : t;
  const updatedAt = typeof o.updatedAt === "number" ? o.updatedAt : t;

  const title =
    typeof o.title === "string" && o.title.trim().length > 0
      ? o.title.trim()
      : `Imported ${o.worldId}`;

  const state =
    o.state && typeof o.state === "object"
      ? (o.state as Record<string, unknown>)
      : {};

  const id =
    typeof o.id === "string" && o.id.trim().length > 0 ? o.id.trim() : makeId();

  return {
    id,
    worldId: o.worldId,
    origin,
    createdAt,
    updatedAt,
    status,
    title,
    state,
  };
}

export default function AppRoot() {
  const [state, setState] = useState<AppState>(initialState);
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());

  const activeProject = useMemo(() => {
    const id = state.activeProjectId;
    if (!id) return undefined;
    return projects.find((p) => p.id === id);
  }, [projects, state.activeProjectId]);

  const shouldBlockUnload = useMemo(() => {
    return () => state.mode === "world";
  }, [state.mode]);

  useEffect(() => enableBeforeUnloadGuard(shouldBlockUnload), [shouldBlockUnload]);

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  function goHome() {
    setState((s) => ({ ...s, mode: "home" }));
  }

  function openProjects() {
    setState((s) => ({ ...s, mode: "projects" }));
  }

  function openWorldNew(worldId: WorldId) {
    const p = createProject({ worldId, origin: "home" });
    setProjects((prev) => upsertProject(prev, p));
    setState((s) => ({
      ...s,
      mode: "world",
      activeWorld: worldId,
      activeProjectId: p.id,
    }));
  }

  function saveProject(p: Project) {
    setProjects((prev) => upsertProject(prev, p));
  }

  function switchWorld(worldId: WorldId) {
    openWorldNew(worldId);
  }

  function deleteActiveProject() {
    const id = state.activeProjectId;
    if (!id) return;
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  function importProjectJson(raw: unknown) {
    const p = normalizeImportedProject(raw);
    if (!p) {
      alert("Invalid project JSON.");
      return;
    }
    setProjects((prev) => upsertProject(prev, p));
    setState((s) => ({ ...s, mode: "projects" }));
  }

  function renameProject(id: string, title: string) {
    const trimmed = title.trim();
    if (!trimmed) return;

    setProjects((prev) => {
      const p = prev.find((x) => x.id === id);
      if (!p) return prev;
      return upsertProject(prev, { ...p, title: trimmed });
    });
  }

  function duplicateProject(id: string) {
    setProjects((prev) => {
      const p = prev.find((x) => x.id === id);
      if (!p) return prev;

      const t = Date.now();
      const copy: Project = {
        ...p,
        id: makeId(),
        createdAt: t,
        updatedAt: t,
        status: "draft",
        title: `${p.title} (copy)`,
        state: cloneJson(p.state),
      };

      return upsertProject(prev, copy);
    });
  }

  return (
    <AppShell
      mode={state.mode}
      onHome={goHome}
      onProjects={openProjects}
      onOpenWorld={openWorldNew}
    >
      {state.mode === "home" && (
        <HomeScreen onEnterWorld={openWorldNew} onOpenProjects={openProjects} />
      )}

      {state.mode === "projects" && (
        <ProjectList
          projects={projects}
          onOpenProject={(id) => {
            const p = projects.find((x) => x.id === id);
            if (!p) return;
            setState((s) => ({
              ...s,
              mode: "world",
              activeWorld: p.worldId,
              activeProjectId: p.id,
            }));
          }}
          onDeleteProject={(id) =>
            setProjects((prev) => prev.filter((p) => p.id !== id))
          }
          onBackHome={goHome}
          onImportProjectJson={importProjectJson}
          onRenameProject={renameProject}
          onDuplicateProject={duplicateProject}
        />
      )}

      {state.mode === "world" && (
        <WorldShell
          worldId={state.activeWorld ?? activeProject?.worldId ?? "not_sure"}
          projectId={state.activeProjectId}
          project={activeProject}
          onSaveProject={saveProject}
          onExitToHome={goHome}
          onDeleteActiveProject={deleteActiveProject}
          onSwitchWorld={switchWorld}
        />
      )}
    </AppShell>
  );
}
