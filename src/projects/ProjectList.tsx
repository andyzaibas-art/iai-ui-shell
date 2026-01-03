import { Project } from "./ProjectStore";
import { WORLD_CATALOG } from "../app/worldCatalog";

function fmt(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

export default function ProjectList({
  projects,
  onOpenProject,
  onDeleteProject,
  onBackHome,
}: {
  projects: Project[];
  onOpenProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onBackHome: () => void;
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-white/10 bg-black/40">
        <div className="font-semibold">My projects</div>
        <button
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
          onClick={onBackHome}
        >
          Home
        </button>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {projects.length === 0 ? (
          <div className="opacity-80">
            No projects yet. Open a world from Home to create one.
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => {
              const worldLabel = WORLD_CATALOG[p.worldId]?.label ?? p.worldId;

              return (
                <div key={p.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="font-semibold">{p.title}</div>
                  <div className="text-sm opacity-70">
                    {worldLabel} · {p.status} · {fmt(p.updatedAt)}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      className="rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                      onClick={() => onOpenProject(p.id)}
                    >
                      Continue
                    </button>
                    <button
                      className="rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                      onClick={() => onDeleteProject(p.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
