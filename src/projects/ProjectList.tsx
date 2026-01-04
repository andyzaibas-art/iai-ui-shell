import { useRef, useState } from "react";
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
  onImportProjectJson,
  onRenameProject,
}: {
  projects: Project[];
  onOpenProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onBackHome: () => void;
  onImportProjectJson: (raw: unknown) => void;
  onRenameProject: (id: string, title: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  async function handleImportFile(file: File) {
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      onImportProjectJson(raw);
    } catch {
      alert("Failed to import. Please select a valid project JSON file.");
    }
  }

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

      <div className="flex-1 p-6 overflow-auto">
        {projects.length === 0 ? (
          <div className="opacity-80">
            No projects yet. Open a world from Home to create one, or import a JSON.
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => {
              const worldLabel = WORLD_CATALOG[p.worldId]?.label ?? p.worldId;
              const isRenaming = renameId === p.id;

              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  {!isRenaming ? (
                    <>
                      <div className="font-semibold">{p.title}</div>
                      <div className="text-sm opacity-70">
                        {worldLabel} · {p.status} · {fmt(p.updatedAt)}
                      </div>

                      <div className="mt-3 flex gap-2 flex-wrap">
                        <button
                          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                          onClick={() => onOpenProject(p.id)}
                        >
                          Continue
                        </button>

                        <button
                          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                          onClick={() => {
                            setRenameId(p.id);
                            setRenameValue(p.title);
                          }}
                        >
                          Rename
                        </button>

                        <button
                          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                          onClick={() => onDeleteProject(p.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm opacity-70 mb-2">Rename project</div>
                      <input
                        className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        placeholder="Project title…"
                        autoFocus
                      />

                      <div className="mt-3 flex gap-2 flex-wrap">
                        <button
                          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                          onClick={() => {
                            const t = renameValue.trim();
                            if (!t) return;
                            onRenameProject(p.id, t);
                            setRenameId(null);
                            setRenameValue("");
                          }}
                        >
                          Save
                        </button>

                        <button
                          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                          onClick={() => {
                            setRenameId(null);
                            setRenameValue("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
