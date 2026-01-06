import { useEffect, useMemo, useState } from "react";
import { AppMode, AppState, WorldId } from "./app/modes";
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
  ProjectStatus,
} from "./projects/ProjectStore";

const initialState: AppState = { mode: "home", returnMode: "home" };

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

  const publish =
    o.publish && typeof o.publish === "object"
      ? (o.publish as Project["publish"])
      : undefined;

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
    publish,
    state,
  };
}

export default function AppRoot() {
  const [state, setState] = useState<AppState>(initialState);
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [readOnly, setReadOnly] = useState(false);

  const activeProject = useMemo(() => {
    const id = state.activeProjectId;
    if (!id) return undefined;
    return projects.find((p) => p.id === id);
  }, [projects, state.activeProjectId]);

  const lastProject = useMemo(() => projects[0], [projects]);

  const shouldBlockUnload = useMemo(() => {
    return () => state.mode === "world";
  }, [state.mode]);

  useEffect(() => enableBeforeUnloadGuard(shouldBlockUnload), [shouldBlockUnload]);

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  function goHome() {
    setReadOnly(false);
    setState((s) => ({ ...s, mode: "home", returnMode: "home" }));
  }

  function openProjects() {
    setReadOnly(false);
    setState((s) => ({ ...s, mode: "projects", returnMode: "projects" }));
  }

  function exitWorld() {
    setReadOnly(false);
    setState((s) => ({ ...s, mode: (s.returnMode ?? "home") as AppMode }));
  }

  function openProjectById(id: string, returnMode: AppMode, ro: boolean) {
    const p = projects.find((x) => x.id === id);
    if (!p) return;

    setReadOnly(ro);
    setState((s) => ({
      ...s,
      mode: "world",
      activeWorld: p.worldId,
      activeProjectId: p.id,
      returnMode,
    }));
  }

  function openWorldNew(worldId: WorldId, origin: Project["origin"], returnMode: AppMode) {
    const p = createProject({ worldId, origin });
    setProjects((prev) => upsertProject(prev, p));
    setReadOnly(false);
    setState((s) => ({
      ...s,
      mode: "world",
      activeWorld: worldId,
      activeProjectId: p.id,
      returnMode,
    }));
  }

  function openWorldFromHome(worldId: WorldId) {
    openWorldNew(worldId, "home", "home");
  }

  function openWorldFromMenu(worldId: WorldId) {
    const rm: AppMode =
      state.mode === "projects"
        ? "projects"
        : state.mode === "home"
        ? "home"
        : (state.returnMode ?? "home");
    openWorldNew(worldId, "home", rm);
  }

  function saveProject(p: Project) {
    setProjects((prev) => upsertProject(prev, p));
  }

  function switchWorld(worldId: WorldId) {
    const rm: AppMode = state.returnMode ?? "home";
    openWorldNew(worldId, "not_sure", rm);
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
    setState((s) => ({ ...s, mode: "projects", returnMode: "projects" }));
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

  function setProjectStatus(id: string, status: ProjectStatus) {
    setProjects((prev) => {
      const p = prev.find((x) => x.id === id);
      if (!p) return prev;
      return upsertProject(prev, { ...p, status });
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
        publish: cloneJson(p.publish),
      };

      return upsertProject(prev, copy);
    });
  }

  function copyProjectAndOpen(id: string) {
    const p = projects.find((x) => x.id === id);
    if (!p) return;

    const t = Date.now();
    const copy: Project = {
      ...p,
      id: makeId(),
      createdAt: t,
      updatedAt: t,
      status: "draft",
      title: `${p.title} (copy)`,
      state: cloneJson(p.state),
      publish: cloneJson(p.publish),
    };

    setProjects((prev) => upsertProject(prev, copy));
    setReadOnly(false);
    setState((s) => ({
      ...s,
      mode: "world",
      activeWorld: copy.worldId,
      activeProjectId: copy.id,
      returnMode: "projects",
    }));
  }

  return (
    <AppShell
      mode={state.mode}
      onHome={goHome}
      onProjects={openProjects}
      onOpenWorld={openWorldFromMenu}
    >
      {state.mode === "home" && (
        <HomeScreen
          onEnterWorld={openWorldFromHome}
          onOpenProjects={openProjects}
          lastProject={lastProject}
          onResumeProject={(id) => openProjectById(id, "home", false)}
        />
      )}

      {state.mode === "projects" && (
        <ProjectList
          projects={projects}
          onOpenProject={(id) => openProjectById(id, "projects", false)}
          onOpenProjectReadOnly={(id) => openProjectById(id, "projects", true)}
          onDeleteProject={(id) =>
            setProjects((prev) => prev.filter((p) => p.id !== id))
          }
          onBackHome={goHome}
          onImportProjectJson={importProjectJson}
          onRenameProject={renameProject}
          onDuplicateProject={duplicateProject}
          onSetStatus={setProjectStatus}
        />
      )}

      {state.mode === "world" && (
        <WorldShell
          worldId={state.activeWorld ?? activeProject?.worldId ?? "not_sure"}
          projectId={state.activeProjectId}
          project={activeProject}
          readOnly={readOnly}
          onCopyProject={copyProjectAndOpen}
          onSaveProject={saveProject}
          onExitToHome={exitWorld}
          onDeleteActiveProject={deleteActiveProject}
          onSwitchWorld={switchWorld}
        />
      )}
    </AppShell>
  );
}
