import { useMemo, useState } from "react";
import PlannerFlow from "../worlds/planner/PlannerFlow";
import GameFlow from "../worlds/game/GameFlow";
import NotSureFlow from "../worlds/not_sure/NotSureFlow";
import WritingFlow from "../worlds/writing/WritingFlow";
import ComingSoon from "../worlds/common/ComingSoon";

import type { Project } from "../projects/ProjectStore";

import { PlannerState, newPlannerState } from "../worlds/planner/plannerModel";
import { GameState, newGameState } from "../worlds/game/gameModel";
import { NotSureState, newNotSureState } from "../worlds/not_sure/notSureModel";
import { WritingState, newWritingState } from "../worlds/writing/writingModel";
import type { WorldId } from "../app/modes";
import { WORLD_CATALOG } from "../app/worldCatalog";

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function WorldShell({
  worldId,
  projectId,
  project,
  readOnly,
  onCopyProject,
  onSaveProject,
  onExitToHome,
  onDeleteActiveProject,
  onSwitchWorld,
}: {
  worldId: WorldId;
  projectId?: string;
  project?: Project;

  // NEW: AppRoot perduoda šituos
  readOnly?: boolean;
  onCopyProject?: (id: string) => void;

  onSaveProject: (p: Project) => void;
  onExitToHome: () => void;
  onDeleteActiveProject: () => void;
  onSwitchWorld: (worldId: WorldId) => void;
}) {
  const [showExit, setShowExit] = useState(false);
  const isReadOnly = Boolean(readOnly);

  const plannerState: PlannerState =
    (project?.state?.planner as PlannerState) ?? newPlannerState();

  const gameState: GameState = (project?.state?.game as GameState) ?? newGameState();

  const notSureState: NotSureState =
    (project?.state?.not_sure as NotSureState) ?? newNotSureState();

  const writingState: WritingState =
    (project?.state?.writing as WritingState) ?? newWritingState();

  const title = useMemo(() => {
    const base = WORLD_CATALOG[worldId]?.label ?? worldId;
    return project?.title ? `${base} — ${project.title}` : base;
  }, [project?.title, worldId]);

  function renderWorld() {
    if (worldId === "planner") {
      return (
        <PlannerFlow
          value={plannerState}
          onChange={(next) => {
            if (isReadOnly) return;
            if (!project) return;
            onSaveProject({ ...project, state: { ...project.state, planner: next } });
          }}
        />
      );
    }

    if (worldId === "game") {
      return (
        <GameFlow
          value={gameState}
          onChange={(next) => {
            if (isReadOnly) return;
            if (!project) return;
            onSaveProject({ ...project, state: { ...project.state, game: next } });
          }}
        />
      );
    }

    if (worldId === "not_sure") {
      return (
        <NotSureFlow
          value={notSureState}
          onChange={(next) => {
            if (isReadOnly) return;
            if (!project) return;
            onSaveProject({ ...project, state: { ...project.state, not_sure: next } });
          }}
          onChooseWorld={(target) => onSwitchWorld(target)}
        />
      );
    }

    if (worldId === "writing") {
      return (
        <WritingFlow
          value={writingState}
          onChange={(next) => {
            if (isReadOnly) return;
            if (!project) return;
            onSaveProject({ ...project, state: { ...project.state, writing: next } });
          }}
        />
      );
    }

    if (worldId === "video") {
      return (
        <ComingSoon
          title="Video World"
          description="Interactive scenes and simple web animation experiences."
          onBack={onExitToHome}
        />
      );
    }

    if (worldId === "app") {
      return (
        <ComingSoon
          title="App / Tool World"
          description="App builder world. Later powered by Caffeine as an engine."
          onBack={onExitToHome}
        />
      );
    }

    return (
      <div className="space-y-3">
        <div className="opacity-80">Unknown world.</div>
        <button
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2"
          onClick={onExitToHome}
        >
          Back
        </button>
      </div>
    );
  }

  const canCopy = Boolean(onCopyProject && (project?.id || projectId));
  const copyId = project?.id ?? projectId ?? "";

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-white/10 bg-black/40">
        <div className="min-w-0">
          <div className="font-semibold truncate">{title}</div>
          <div className="text-xs opacity-60 truncate">
            {projectId ? `Project: ${projectId}` : "No project id"}
            {isReadOnly ? " · Read-only" : ""}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isReadOnly && (
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 disabled:opacity-50"
              disabled={!canCopy}
              onClick={() => {
                if (!onCopyProject) return;
                if (!copyId) return;
                onCopyProject(copyId);
              }}
              title="Make an editable copy"
              aria-label="Make copy"
            >
              Copy
            </button>
          )}

          <button
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 disabled:opacity-50"
            onClick={() => {
              if (!project) return;
              const safeTitle = (project.title || "project")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "");
              downloadJson(`iai_${project.worldId}_${safeTitle}_${project.id}.json`, project);
            }}
            disabled={!project}
            aria-label="Export project as JSON"
            title="Export JSON"
          >
            Export
          </button>

          <button
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            onClick={() => setShowExit(true)}
          >
            Exit
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">{renderWorld()}</div>

      {showExit && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            onClick={() => setShowExit(false)}
          />
          <div className="relative h-full flex items-end sm:items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-md rounded-2xl border border-white/10 bg-black p-4 text-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="font-semibold">Leave this world?</div>
              <div className="mt-2 text-sm opacity-80">
                Choose: {isReadOnly ? "exit" : "save, delete, or stay"}.
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left"
                  onClick={() => {
                    setShowExit(false);
                    onExitToHome();
                  }}
                >
                  {isReadOnly ? "Exit" : "Save and exit"}
                </button>

                {!isReadOnly && (
                  <button
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left"
                    onClick={() => {
                      onDeleteActiveProject();
                      setShowExit(false);
                      onExitToHome();
                    }}
                  >
                    Delete and start over
                  </button>
                )}

                <button
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left"
                  onClick={() => setShowExit(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
