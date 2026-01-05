import { useMemo, useRef, useState } from "react";
import { Project, type ProjectStatus } from "./ProjectStore";
import { WORLD_CATALOG, WORLD_DEFAULT_ORDER } from "../app/worldCatalog";
import type { WorldId } from "../app/modes";

function fmt(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

type WorldFilter = "all" | WorldId;
type StatusFilter = "all" | ProjectStatus;
type ViewMode = "list" | "gallery";

export default function ProjectList({
  projects,
  onOpenProject,
  onDeleteProject,
  onBackHome,
  onImportProjectJson,
  onRenameProject,
  onDuplicateProject,
  onSetStatus,
}: {
  projects: Project[];
  onOpenProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onBackHome: () => void;
  onImportProjectJson: (raw: unknown) => void;
  onRenameProject: (id: string, title: string) => void;
  onDuplicateProject: (id: string) => void;
  onSetStatus: (id: string, status: ProjectStatus) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [worldFilter, setWorldFilter] = useState<WorldFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [view, setView] = useState<ViewMode>("list");

  async function handleImportFile(file: File) {
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      onImportProjectJson(raw);
    } catch {
      alert("Failed to import. Please select a valid project JSON file.");
    }
  }

  const effectiveStatus: StatusFilter = view === "gallery" ? "done" : statusFilter;

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return projects.filter((p) => {
      if (worldFilter !== "all" && p.worldId !== worldFilter) return false;
      if (effectiveStatus !== "all" && p.status !== effectiveStatus) return false;

      if (!query) return true;
      const hay = `${p.title} ${p.worldId} ${p.status}`.toLowerCase();
      return hay.includes(query);
    });
  }, [projects, q, worldFilter, effectiveStatus]);

  const deleteProject = useMemo(() => {
    if (!deleteId) return null;
    return projects.find((p) => p.id === deleteId) ?? null;
  }, [projects, deleteId]);

  const previewProject = useMemo(() => {
    if (!previewId) return null;
    return projects.find((p) => p.id === previewId) ?? null;
  }, [projects, previewId]);

  const previewJson = useMemo(() => {
    if (!previewProject) return "";
    try {
      return JSON.stringify(previewProject, null, 2);
    } catch {
      return "";
    }
  }, [previewProject]);

  function statusLabel(s: ProjectStatus) {
    return s === "done" ? "Published" : "Draft";
  }

  function exportProject(p: Project) {
    const safeTitle = (p.title || "project")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    downloadJson(`iai_${p.worldId}_${safeTitle}_${p.id}.json`, p);
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

      <div className="p-4 border-b border-white/10 bg-black/20">
        <div className="flex flex-col lg:flex-row gap-2">
          <input
            className="flex-1 rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects…"
          />

          <select
            className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white"
            value={worldFilter}
            onChange={(e) => setWorldFilter(e.target.value as WorldFilter)}
          >
            <option value="all">All worlds</option>
            {WORLD_DEFAULT_ORDER.map((id) => (
              <option key={id} value={id}>
                {WORLD_CATALOG[id]?.label ?? id}
              </option>
            ))}
          </select>

          <select
            className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white disabled:opacity-60"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            disabled={view === "gallery"}
            title={view === "gallery" ? "Gallery shows Published only" : "Status filter"}
          >
            <option value="all">All status</option>
            <option value="draft">Draft</option>
            <option value="done">Published</option>
          </select>

          <div className="flex gap-2">
            <button
              className={`rounded-xl border border-white/10 px-3 py-2 ${
                view === "list" ? "bg-white/10" : "bg-white/5"
              }`}
              onClick={() => setView("list")}
            >
              List
            </button>
            <button
              className={`rounded-xl border border-white/10 px-3 py-2 ${
                view === "gallery" ? "bg-white/10" : "bg-white/5"
              }`}
              onClick={() => setView("gallery")}
            >
              Gallery
            </button>
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
              onClick={() => {
                setQ("");
                setWorldFilter("all");
                setStatusFilter("all");
                setView("list");
              }}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-2 text-xs text-white/60">
          Showing {filtered.length} of {projects.length}
          {view === "gallery" ? " (Published only)" : ""}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {projects.length === 0 ? (
          <div className="opacity-80">
            No projects yet. Open a world from Home to create one, or import a JSON.
          </div>
        ) : filtered.length === 0 ? (
          <div className="opacity-80">
            {view === "gallery"
              ? "No published projects yet. Publish one from List view."
              : "No matches."}
          </div>
        ) : view === "list" ? (
          <div className="space-y-3">
            {filtered.map((p) => {
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
                        {worldLabel} · {statusLabel(p.status)} · {fmt(p.updatedAt)}
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
                          onClick={() =>
                            onSetStatus(p.id, p.status === "done" ? "draft" : "done")
                          }
                        >
                          {p.status === "done" ? "Unpublish" : "Publish"}
                        </button>

                        <button
                          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                          onClick={() => onDuplicateProject(p.id)}
                        >
                          Duplicate
                        </button>

                        <button
                          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                          onClick={() => exportProject(p)}
                        >
                          Export
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
                          onClick={() => setDeleteId(p.id)}
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
        ) : (
          // GALLERY VIEW (details stub)
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
          >
            {filtered.map((p) => {
              const meta = WORLD_CATALOG[p.worldId];
              const worldLabel = meta?.label ?? p.worldId;

              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center gap-2">
                    {meta?.iconSrc ? (
                      <img
                        src={meta.iconSrc}
                        alt=""
                        className="w-7 h-7 opacity-90"
                        draggable={false}
                      />
                    ) : (
                      <span className="text-xl">{meta?.iconText ?? "⬚"}</span>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{p.title}</div>
                      <div className="text-xs opacity-70 truncate">
                        {worldLabel} · {fmt(p.updatedAt)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2 flex-wrap">
                    <button
                      className="rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                      onClick={() => setPreviewId(p.id)}
                    >
                      Preview
                    </button>

                    <button
                      className="rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                      onClick={() => exportProject(p)}
                    >
                      Export
                    </button>

                    <button
                      className="rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                      onClick={() => onDuplicateProject(p.id)}
                    >
                      Copy
                    </button>

                    <button
                      className="rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                      onClick={() => onSetStatus(p.id, "draft")}
                      title="Unpublish"
                    >
                      Unpublish
                    </button>

                    <button
                      className="rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                      onClick={() => setDeleteId(p.id)}
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

      {/* Preview modal */}
      {previewId && previewProject && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setPreviewId(null)}
          />
          <div className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-black p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold truncate">{previewProject.title}</div>
                <div className="text-xs opacity-70 truncate">
                  {(WORLD_CATALOG[previewProject.worldId]?.label ?? previewProject.worldId)} ·{" "}
                  {fmt(previewProject.updatedAt)} · {statusLabel(previewProject.status)}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  onClick={() => exportProject(previewProject)}
                >
                  Export
                </button>
                <button
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  onClick={() => {
                    const id = previewProject.id;
                    setPreviewId(null);
                    onOpenProject(id);
                  }}
                  title="Open editable"
                >
                  Open
                </button>
                <button
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  onClick={() => setPreviewId(null)}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-3 text-xs opacity-60">
              Read-only preview (JSON). Use Export to share.
            </div>

            <textarea
              className="mt-3 w-full rounded-xl border border-white/15 bg-black/30 p-3 text-xs text-white font-mono min-h-[320px]"
              readOnly
              value={previewJson}
            />
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setDeleteId(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-black p-4 text-white">
            <div className="font-semibold">Delete project?</div>
            <div className="mt-2 text-sm opacity-80">
              This will permanently remove{" "}
              <span className="font-semibold">
                {deleteProject?.title ?? "this project"}
              </span>
              .
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left"
                onClick={() => {
                  const id = deleteId;
                  setDeleteId(null);
                  if (!id) return;
                  onDeleteProject(id);
                }}
              >
                Delete
              </button>

              <button
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* If preview is open and project disappears, close it */}
      {previewId && !previewProject && (
        <div className="hidden">{setTimeout(() => setPreviewId(null), 0)}</div>
      )}
    </div>
  );
}
