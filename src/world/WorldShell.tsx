import { useMemo, useState } from "react";
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
  readOnly = false,
  onCopyProject,
  onSaveProject,
  onExitToHome,
  onDeleteActiveProject,
  onSwitchWorld,
}: {
  worldId: WorldId;
  projectId?: string;
  project?: Project;
  readOnly?: boolean;
  onCopyProject: (id: string) => void;
  onSaveProject: (p: Project) => void;
  onExitToHome: () => void;
  onDeleteActiveProject: () => void;
  onSwitchWorld: (worldId: WorldId) => void;
}) {
  const [showExit, setShowExit] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const [showPublish, setShowPublish] = useState(false);
  const [coverEmoji, setCoverEmoji] = useState("");
  const [blurb, setBlurb] = useState("");

  const isRO = Boolean(readOnly);

  const plannerState: PlannerState =
    (project?.state?.planner as PlannerState) ?? newPlannerState();

  const gameState: GameState = (project?.state?.game as GameState) ?? newGameState();

  const notSureState: NotSureState =
    (project?.state?.not_sure as NotSureState) ?? newNotSureState();

  const writingState: WritingState =
    (project?.state?.writing as WritingState) ?? newWritingState();

  const baseLabel = WORLD_CATALOG[worldId]?.label ?? worldId;
  const status = project?.status ?? "draft";
  const statusLabel = status === "done" ? "Published" : "Draft";

  const title = useMemo(() => {
    return project?.title ? `${baseLabel} — ${project.title}` : baseLabel;
  }, [baseLabel, project?.title]);

  function renderWorld() {
    if (worldId === "planner") {
      return (
        <PlannerFlow
          value={plannerState}
          onChange={(next) => {
            if (!project || isRO) return;
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
            if (!project || isRO) return;
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
            if (!project || isRO) return;
            onSaveProject({ ...project, state: { ...project.state, not_sure: next } });
          }}
          onChooseWorld={(target) => {
            if (isRO) return;
            onSwitchWorld(target);
          }}
        />
      );
    }

    if (worldId === "writing") {
      return (
        <WritingFlow
          value={writingState}
          onChange={(next) => {
            if (!project || isRO) return;
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
    <div className="h-full flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-white/10 bg-black/40">
        <div className="min-w-0">
          <div className="font-semibold truncate">{title}</div>
          <div className="text-xs opacity-60 truncate">
            {projectId ? `Project: ${projectId}` : "No project id"}
            {" · "}
            {statusLabel}
            {isRO ? " · Read-only" : ""}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            onClick={() => {
              if (!project) return;
              onSaveProject({ ...project, status: project.status === "done" ? "draft" : "done" });
            }}
            disabled={!project}
            title={status === "done" ? "Unpublish" : "Publish"}
          >
            {status === "done" ? "Unpublish" : "Publish"}
          </button>

          <button
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            onClick={() => {
              if (!project || isRO) return;
              setCoverEmoji(project.publish?.coverEmoji ?? "");
              setBlurb(project.publish?.blurb ?? "");
              setShowPublish(true);
            }}
            disabled={!project || isRO}
            title="Publish settings"
          >
            Settings
          </button>

          {isRO ? (
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
              onClick={() => {
                if (!project) return;
                onCopyProject(project.id);
              }}
              disabled={!project}
              title="Copy to edit"
            >
              Copy
            </button>
          ) : (
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
              onClick={() => {
                if (!project) return;
                setRenameValue(project.title ?? "");
                setShowRename(true);
              }}
              disabled={!project}
              title="Rename"
            >
              Rename
            </button>
          )}

          <button
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            onClick={() => {
              if (!project) return;
              const safeTitle = (project.title || "project")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "");
              downloadJson(`iai_${project.worldId}_${safeTitle}_${project.id}.json`, project);
            }}
            disabled={!project}
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

      <div className="flex-1 p-6 overflow-auto">
        {isRO && (
          <div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
            Read-only preview. Use <span className="text-white">Copy</span> to create an editable draft.
          </div>
        )}

        <div className="relative">
          {isRO && <div className="absolute inset-0 z-10" />}
          <div className={isRO ? "opacity-95" : ""}>{renderWorld()}</div>
        </div>
      </div>

      {showPublish && !isRO && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowPublish(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-black p-4 text-white">
            <div className="font-semibold">Publish settings</div>
            <div className="mt-2 text-sm opacity-80">
              Optional metadata for Gallery cards.
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="text-xs opacity-70">Cover emoji (optional)</div>
                <input
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white"
                  value={coverEmoji}
                  onChange={(e) => setCoverEmoji(e.target.value)}
                  placeholder="😀"
                />
                <div className="mt-1 text-xs opacity-60">
                  Tip: use a single emoji. We’ll use world icon if empty.
                </div>
              </div>

              <div>
                <div className="text-xs opacity-70">Short description (optional)</div>
                <textarea
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white min-h-[96px]"
                  value={blurb}
                  onChange={(e) => setBlurb(e.target.value)}
                  placeholder="What is this project about?"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left"
                onClick={() => {
                  if (!project) return;
                  onSaveProject({
                    ...project,
                    publish: {
                      coverEmoji: coverEmoji.trim() || undefined,
                      blurb: blurb.trim() || undefined,
                    },
                  });
                  setShowPublish(false);
                }}
              >
                Save settings
              </button>

              <button
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left"
                onClick={() => setShowPublish(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRename && !isRO && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowRename(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-black p-4 text-white">
            <div className="font-semibold">Rename project</div>
            <div className="mt-2 text-sm opacity-80">
              Change the title. It will persist in My projects.
            </div>

            <input
              className="mt-4 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Project title…"
              autoFocus
            />

            <div className="mt-4 flex flex-col gap-2">
              <button
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left"
                onClick={() => {
                  if (!project) return;
                  const t = renameValue.trim();
                  if (!t) return;
                  onSaveProject({ ...project, title: t });
                  setShowRename(false);
                  setRenameValue("");
                }}
              >
                Save
              </button>

              <button
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left"
                onClick={() => {
                  setShowRename(false);
                  setRenameValue("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showExit && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowExit(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-black p-4 text-white">
            <div className="font-semibold">Leave this world?</div>
            <div className="mt-2 text-sm opacity-80">
              {isRO ? "Exit preview." : "Choose: save, delete, or stay."}
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left"
                onClick={() => {
                  setShowExit(false);
                  onExitToHome();
                }}
              >
                {isRO ? "Exit" : "Save and exit"}
              </button>

              {!isRO && (
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
      )}
    </div>
  );
}
