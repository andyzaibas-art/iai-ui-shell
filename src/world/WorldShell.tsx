import { useState } from "react";
import PlannerFlow from "../worlds/planner/PlannerFlow";
import GameFlow from "../worlds/game/GameFlow";
import NotSureFlow from "../worlds/not_sure/NotSureFlow";
import WritingFlow from "../worlds/writing/WritingFlow";
import ComingSoon from "../worlds/common/ComingSoon";

import { Project } from "../projects/ProjectStore";

import { PlannerState, newPlannerState } from "../worlds/planner/plannerModel";
import { GameState, newGameState } from "../worlds/game/gameModel";
import { NotSureState, newNotSureState } from "../worlds/not_sure/notSureModel";
import { WritingState, newWritingState } from "../worlds/writing/writingModel";
import { WorldId } from "../app/modes";

export default function WorldShell({
  worldId,
  projectId,
  project,
  onSaveProject,
  onExitToHome,
  onDeleteActiveProject,
  onSwitchWorld,
}: {
  worldId: WorldId;
  projectId?: string;
  project?: Project;
  onSaveProject: (p: Project) => void;
  onExitToHome: () => void;
  onDeleteActiveProject: () => void;
  onSwitchWorld: (worldId: WorldId) => void;
}) {
  const [showExit, setShowExit] = useState(false);

  const plannerState: PlannerState =
    (project?.state?.planner as PlannerState) ?? newPlannerState();

  const gameState: GameState =
    (project?.state?.game as GameState) ?? newGameState();

  const notSureState: NotSureState =
    (project?.state?.not_sure as NotSureState) ?? newNotSureState();

  const writingState: WritingState =
    (project?.state?.writing as WritingState) ?? newWritingState();

  function renderWorld() {
    if (worldId === "planner") {
      return (
        <PlannerFlow
          value={plannerState}
          onChange={(next) => {
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

    return <div className="opacity-80">Unknown world. Go back.</div>;
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="p-4 flex items-center justify-between border-b">
        <div className="font-semibold">
          World: {worldId} {projectId ? `(project ${projectId})` : ""}
        </div>
        <button className="rounded-xl border px-3 py-2" onClick={() => setShowExit(true)}>
          Exit
        </button>
      </div>

      <div className="flex-1 p-6 overflow-auto">{renderWorld()}</div>

      {showExit && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border bg-white p-4">
            <div className="font-semibold">Leave this world?</div>
            <div className="mt-2 text-sm opacity-80">Choose: save, delete, or stay.</div>

            <div className="mt-4 flex flex-col gap-2">
              <button className="rounded-xl border px-4 py-3 text-left" onClick={onExitToHome}>
                Save and exit
              </button>

              <button
                className="rounded-xl border px-4 py-3 text-left"
                onClick={() => {
                  onDeleteActiveProject();
                  onExitToHome();
                }}
              >
                Delete and start over
              </button>

              <button className="rounded-xl border px-4 py-3 text-left" onClick={() => setShowExit(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
