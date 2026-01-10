import { useMemo } from "react";
import type { WorldId } from "../app/modes";
import { WORLD_CATALOG, WORLD_DEFAULT_ORDER } from "../app/worldCatalog";
import { useUiPrefs } from "../app/stores/UiPrefsStore";
import type { Project } from "../projects/ProjectStore";
import Page from "../app/ui/Page";
import { cn } from "../app/ui/cn";

function WorldIcon({ id }: { id: WorldId }) {
  const meta = WORLD_CATALOG[id];
  if (meta?.iconSrc) {
    return (
      <img
        src={meta.iconSrc}
        alt=""
        className="h-6 w-6 opacity-90"
        draggable={false}
      />
    );
  }
  return <span className="text-lg leading-none">{meta?.iconText ?? "⬚"}</span>;
}

export default function HomeScreen({
  onEnterWorld,
  onOpenProjects,
  lastProject,
  onResumeProject,
}: {
  onEnterWorld: (worldId: WorldId) => void;
  onOpenProjects: () => void;
  lastProject?: Project;
  onResumeProject?: (id: string) => void;
}) {
  const ui = useUiPrefs();

  const ordered = useMemo(() => {
    const out: WorldId[] = [];
    const seen = new Set<string>();

    const all = [...(ui.iconOrder ?? []), ...WORLD_DEFAULT_ORDER];
    for (const id of all) {
      if (!id) continue;
      const k = id as string;
      if (seen.has(k)) continue;
      if (!WORLD_CATALOG[id]) continue;
      seen.add(k);
      out.push(id);
    }
    return out;
  }, [ui.iconOrder]);

  return (
    <Page center maxWidthClass="max-w-2xl">
      <div className="text-center">
        <div className="text-4xl font-semibold tracking-tight text-neutral-100">
          I•A•I
        </div>
        <div className="mt-2 text-sm text-neutral-400">
          Local-first · Private by default
        </div>
        <div className="mt-8 text-lg font-medium text-neutral-200">
          What do you want to create today?
        </div>
      </div>

      {lastProject && onResumeProject ? (
        <div className="mt-6">
          <button
            className={cn(
              "w-full rounded-2xl border border-neutral-800 bg-neutral-900 px-5 py-4 text-left",
              "hover:bg-neutral-800/60 transition-colors"
            )}
            onClick={() => onResumeProject(lastProject.id)}
          >
            <div className="text-sm text-neutral-400">Resume last project</div>
            <div className="mt-1 text-base font-medium text-neutral-100 truncate">
              {lastProject.title}
            </div>
          </button>
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {ordered.map((id) => {
          const meta = WORLD_CATALOG[id];
          const label = meta?.label ?? id;

          return (
            <button
              key={id}
              className={cn(
                "w-full rounded-2xl border border-neutral-800 bg-neutral-900 px-5 py-4 text-left",
                "hover:bg-neutral-800/60 transition-colors"
              )}
              onClick={() => onEnterWorld(id)}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950">
                  <WorldIcon id={id} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-base font-medium text-neutral-100">
                    {label}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-center">
        <button
          className="text-sm text-neutral-400 hover:text-neutral-200 underline underline-offset-4"
          onClick={onOpenProjects}
        >
          My projects
        </button>
      </div>
    </Page>
  );
}
