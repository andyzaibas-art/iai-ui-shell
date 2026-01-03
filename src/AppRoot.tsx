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
