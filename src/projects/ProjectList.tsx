import { useMemo, useRef, useState } from "react";
import { Project } from "./ProjectStore";
import { WORLD_CATALOG } from "../app/worldCatalog";

function fmt(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

type SortMode = "recent" | "world" | "title";

export default function ProjectList({
  projects,
  onOpenProject,
  onDeleteProject,
  onBackHome,
  onImportProjectJson,
}: {
  projects: Project[];
  onOpenProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onBackHome: () => void;
  onImportProjectJson: (raw: unknown) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [filterWorld, setFilterWorld] = useState<"all" | Project["worldId"]>("all");
  const [sortMode, setSortMode] = useState<SortMode>("recent");

  async function handleImportFile(file: File) {
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      onImportProjectJson(raw);
    } catch {
      alert("Failed to import. Please select a valid project JSON file.");
    }
  }

  const worldOptions = useMemo(() => {
    const ids = Array.from(new Set(projects.map((p) => p.worldId)));
    ids.sort();
    return ids;
  }, [projects]);

  const visible = useMemo(() => {
    let items = projects.slice();

    if (filterWorld !== "all") {
      items = items.filter((p) => p.worldId === filterWorld);
    }

    if (sortMode === "recent") {
      items.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    } else if (sortMode === "world") {
      items.sort((a, b) => {
        if (a.worldId === b.worldId) return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
        return a.worldId.localeCompare(b.worldId);
      });
    } else {
      items.sort((a, b) => {
        const at = (a.title ?? "").toLowerCase();
        const bt = (b.title ?? "").toLowerCase();
        if (at === bt) return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
        return at.localeCompare(bt);
      });
    }

    return items;
  }, [projects, filterWorld, sortMode]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-white/10 bg-black/40">
        <div className="font-semibold">My projects</div>

        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.currentTarget.value = "";
              if (!f) return;
              void handleImportFile(f);
            }}
          />

          <button
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            onClick={() => fileRef.current?.click()}
          >
            Import
          </button>

          <button
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            onClick={onBackHome}
          >
            Home
          </button>
        </div>
      </div>

      <div className="px-6 pt-4 flex flex-wrap gap-2 items-center">
        <div className="text-xs opacity-70">Filter</div>
        <select
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
          value={filterWorld}
          onChange={(e) => setFilterWorld(e.target.value as any)}
        >
          <option value="all">All worlds</option>
          {worldOptions.map((id) => (
            <option key={id} value={id}>
              {WORLD_CATALOG[id]?.label ?? id}
            </option>
          ))}
        </select>

        <div className="text-xs opacity-70 ml-2">Sort</div>
        <select
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
        >
          <option value="recent">Most recent</option>
          <option value="world">World</option>
          <option value="title">Title</option>
        </select>

        <div className="ml-auto text-xs opacity-60">
          {visible.length} shown / {projects.length} total
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {projects.length === 0 ? (
          <div className="opacity-80">
            No projects yet. Open a world from Home to create one, or import a JSON.
          </div>
        ) : visible.length === 0 ? (
          <div className="opacity-80">
            No projects match this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((p) => {
              const worldLabel = WORLD_CATALOG[p.worldId]?.label ?? p.worldId;

              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
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
