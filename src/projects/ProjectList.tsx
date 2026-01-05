import { useEffect, useMemo, useRef, useState } from "react";
import { Project, type ProjectStatus } from "./ProjectStore";
import { WORLD_CATALOG, WORLD_DEFAULT_ORDER } from "../app/worldCatalog";
import type { WorldId } from "../app/modes";
import {
  useUiPrefs,
  togglePinnedProject,
  setGallerySort,
  type GallerySort,
} from "../app/stores/UiPrefsStore";

function fmt(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

function hm(isoLocal?: string) {
  if (!isoLocal || typeof isoLocal !== "string") return "";
  const t = isoLocal.split("T")[1];
  return t ? t.slice(0, 5) : "";
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

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

type WorldFilter = "all" | WorldId;
type StatusFilter = "all" | ProjectStatus;
type ViewMode = "list" | "gallery";
type PreviewTab = "summary" | "json";
type Toast = { msg: string; at: number } | null;

// --- Local share codes (localStorage) ---
const SHARE_KEY = "iai_ui_share_codes_v1";
type ShareRecord = { project: Project; createdAt: number };

function loadShareMap(): Record<string, ShareRecord> {
  try {
    const raw = localStorage.getItem(SHARE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, ShareRecord>;
  } catch {
    return {};
  }
}

function saveShareMap(map: Record<string, ShareRecord>) {
  try {
    localStorage.setItem(SHARE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function normalizeCode(input: string) {
  const s = (input ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const trimmed = s.slice(0, 8);
  if (trimmed.length <= 4) return trimmed;
  return `${trimmed.slice(0, 4)}-${trimmed.slice(4)}`;
}

function randomChars(len: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid I/O/1/0 confusion
  const out: string[] = [];
  try {
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    for (let i = 0; i < len; i++) out.push(alphabet[arr[i] % alphabet.length]);
  } catch {
    for (let i = 0; i < len; i++) out.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
  }
  return out.join("");
}

function generateCode(existing: Record<string, ShareRecord>) {
  for (let i = 0; i < 20; i++) {
    const raw = randomChars(8);
    const code = `${raw.slice(0, 4)}-${raw.slice(4)}`;
    if (!existing[code]) return code;
  }
  // fallback
  const raw = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
  return normalizeCode(raw);
}

function pruneShareMap(map: Record<string, ShareRecord>, max = 50) {
  const entries = Object.entries(map);
  if (entries.length <= max) return map;

  entries.sort((a, b) => (b[1]?.createdAt ?? 0) - (a[1]?.createdAt ?? 0));
  const keep = entries.slice(0, max);

  const next: Record<string, ShareRecord> = {};
  for (const [k, v] of keep) next[k] = v;
  return next;
}

function putShare(project: Project): string {
  const map = loadShareMap();
  const code = generateCode(map);
  map[code] = { project, createdAt: Date.now() };
  saveShareMap(pruneShareMap(map));
  return code;
}

function getShare(codeInput: string): Project | null {
  const code = normalizeCode(codeInput);
  if (!code || code.length < 4) return null;
  const map = loadShareMap();
  return map[code]?.project ?? null;
}

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

function previewSummaryLines(p: Project): string[] {
  const lines: string[] = [];

  const game: any = (p.state as any)?.game;
  if (game && typeof game === "object") {
    const isGenerated = Boolean(game.story);
    const draftTitle = typeof game.draft?.title === "string" ? game.draft.title.trim() : "";
    const hist = Array.isArray(game.history) ? game.history : [];
    const lastChoices = hist
      .slice(-3)
      .map((x: any) => (typeof x?.choiceLabel === "string" ? x.choiceLabel : ""))
      .filter(Boolean);

    lines.push(`Game: ${isGenerated ? "Generated story" : "Built-in story"}`);
    if (draftTitle) lines.push(`Title: ${draftTitle}`);
    if (lastChoices.length) lines.push(`Last choices: ${lastChoices.join(" → ")}`);
    return lines;
  }

  const planner: any = (p.state as any)?.planner;
  if (planner && typeof planner === "object") {
    const variants = planner.variants;
    const activeKey = variants?.active === "B" ? "B" : "A";
    const active = activeKey === "B" ? variants?.B : variants?.A;

    const blocks = Array.isArray(active?.blocks) ? active.blocks : [];
    const tasks = Array.isArray(active?.tasks) ? active.tasks : [];

    lines.push(`Planner: ${blocks.length} blocks, ${tasks.length} tasks`);
    if (blocks.length) {
      const first = blocks.slice(0, 6).map((b: any) => {
        const s = hm(b?.start);
        const e = hm(b?.end);
        const title = typeof b?.title === "string" ? b.title : "Block";
        const range = s && e ? `${s}–${e}` : "";
        return range ? `${range} ${title}` : title;
      });
      lines.push(...first);
      if (blocks.length > 6) lines.push(`… +${blocks.length - 6} more`);
    } else {
      lines.push("No schedule built yet.");
    }
    return lines;
  }

  const writing: any = (p.state as any)?.writing;
  if (writing && typeof writing === "object") {
    const candidates = [
      writing.text,
      writing.content,
      writing.body,
      writing.draft,
      writing.draftText,
      writing.value,
    ];
    const txt = candidates.find((x) => typeof x === "string") as string | undefined;

    lines.push("Writing:");
    if (txt && txt.trim()) {
      const clean = txt.trim().replace(/\s+/g, " ");
      lines.push(clean.length > 280 ? `${clean.slice(0, 280)}…` : clean);
    } else {
      lines.push("No text yet.");
    }
    return lines;
  }

  lines.push("No preview available for this project yet.");
  return lines;
}

export default function ProjectList({
  projects,
  onOpenProject,
  onOpenProjectReadOnly,
  onDeleteProject,
  onBackHome,
  onImportProjectJson,
  onRenameProject,
  onDuplicateProject,
  onSetStatus,
}: {
  projects: Project[];
  onOpenProject: (id: string) => void;
  onOpenProjectReadOnly: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onBackHome: () => void;
  onImportProjectJson: (raw: unknown) => void;
  onRenameProject: (id: string, title: string) => void;
  onDuplicateProject: (id: string) => void;
  onSetStatus: (id: string, status: ProjectStatus) => void;
}) {
  const ui = useUiPrefs();
  const pinnedIds = ui.pinnedProjectIds ?? [];
  const sortMode: GallerySort = ui.gallerySort ?? "pinned_recent";
  const pinnedSet = useMemo(() => new Set(pinnedIds), [pinnedIds]);

  const fileRef = useRef<HTMLInputElement | null>(null);

  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<PreviewTab>("summary");

  const [showImportCode, setShowImportCode] = useState(false);
  const [importCodeValue, setImportCodeValue] = useState("");

  const [toast, setToast] = useState<Toast>(null);

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

  async function toastMsg(msg: string) {
    setToast({ msg, at: Date.now() });
    setTimeout(() => setToast(null), 1400);
  }

  async function doCopy(label: string, text: string) {
    const ok = await copyText(text);
    await toastMsg(ok ? `${label} copied` : `Copy failed`);
  }

  function importFromCode() {
    const code = normalizeCode(importCodeValue);
    if (!code || code.length < 4) {
      void toastMsg("Enter a valid code");
      return;
    }
    const p = getShare(code);
    if (!p) {
      void toastMsg("Code not found (local only)");
      return;
    }

    // Import as a new editable draft copy
    const t = Date.now();
    const sharedCopy: any = {
      ...p,
      id: "",
      createdAt: t,
      updatedAt: t,
      status: "draft",
      title: `${p.title} (shared)`,
    };

    onImportProjectJson(sharedCopy);
    setShowImportCode(false);
    setImportCodeValue("");
    void toastMsg(`Imported from code: ${code}`);
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

  const sorted = useMemo(() => {
    const idx = new Map<string, number>();
    pinnedIds.forEach((id, i) => idx.set(id, i));

    const arr = filtered.slice();
    arr.sort((a, b) => {
      const ap = pinnedSet.has(a.id);
      const bp = pinnedSet.has(b.id);
      if (ap !== bp) return ap ? -1 : 1; // pinned first

      if (sortMode === "title") return a.title.localeCompare(b.title);
      if (sortMode === "recent") return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);

      if (ap && bp) {
        const ai = idx.get(a.id) ?? 999999;
        const bi = idx.get(b.id) ?? 999999;
        if (ai !== bi) return ai - bi;
      }
      return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
    });

    return arr;
  }, [filtered, pinnedIds, pinnedSet, sortMode]);

  const deleteProject = useMemo(() => {
    if (!deleteId) return null;
    return projects.find((p) => p.id === deleteId) ?? null;
  }, [projects, deleteId]);

  const previewProject = useMemo(() => {
    if (!previewId) return null;
    return projects.find((p) => p.id === previewId) ?? null;
  }, [projects, previewId]);

  useEffect(() => {
    if (previewId && !previewProject) setPreviewId(null);
  }, [previewId, previewProject]);

  const previewJson = useMemo(() => {
    if (!previewProject) return "";
    try {
      return JSON.stringify(previewProject, null, 2);
    } catch {
      return "";
    }
  }, [previewProject]);

  const previewLines = useMemo(() => {
    if (!previewProject) return [];
    return previewSummaryLines(previewProject);
  }, [previewProject]);

  const previewPinned = previewProject ? pinnedSet.has(previewProject.id) : false;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-white/10 bg-black/40">
        <div className="font-semibold">My projects</div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
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
            Import file
          </button>

          <button
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            onClick={() => setShowImportCode(true)}
            title="Import from local share code"
          >
            Import code
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

          <select
            className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white"
            value={sortMode}
            onChange={(e) => setGallerySort(e.target.value as GallerySort)}
            title="Sort"
          >
            <option value="pinned_recent">Pinned → Recent</option>
            <option value="recent">Recent</option>
            <option value="title">Title A–Z</option>
          </select>

          <div className="flex gap-2">
            <button
              className={`rounded-xl border border-white/10 px-3 py-2 ${view === "list" ? "bg-white/10" : "bg-white/5"}`}
              onClick={() => setView("list")}
            >
              List
            </button>
            <button
              className={`rounded-xl border border-white/10 px-3 py-2 ${view === "gallery" ? "bg-white/10" : "bg-white/5"}`}
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
          Showing {sorted.length} of {projects.length}
          {view === "gallery" ? " (Published only)" : ""}
          {pinnedIds.length ? ` · Pinned: ${pinnedIds.length}` : ""}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {projects.length === 0 ? (
          <div className="opacity-80">
            No projects yet. Open a world from Home to create one, or import a file/code.
          </div>
        ) : sorted.length === 0 ? (
          <div className="opacity-80">
            {view === "gallery" ? "No published projects yet. Publish one from List view." : "No matches."}
          </div>
        ) : view === "list" ? (
          <div className="space-y-3">
            {sorted.map((p) => {
              const worldLabel = WORLD_CATALOG[p.worldId]?.label ?? p.worldId;
              const isRenaming = renameId === p.id;
              const isPinned = pinnedSet.has(p.id);

              return (
                <div key={p.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  {!isRenaming ? (
                    <>
                      <div className="font-semibold">{isPinned ? "📌 " : ""}{p.title}</div>
                      <div className="text-sm opacity-70">
                        {worldLabel} · {statusLabel(p.status)} · {fmt(p.updatedAt)}
                      </div>

                      <div className="mt-3 flex gap-2 flex-wrap">
                        <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => onOpenProject(p.id)}>
                          Continue
                        </button>

                        <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => togglePinnedProject(p.id)}>
                          {isPinned ? "Unpin" : "Pin"}
                        </button>

                        <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => onSetStatus(p.id, p.status === "done" ? "draft" : "done")}>
                          {p.status === "done" ? "Unpublish" : "Publish"}
                        </button>

                        <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => onDuplicateProject(p.id)}>
                          Duplicate
                        </button>

                        <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => exportProject(p)}>
                          Export
                        </button>

                        <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => { setRenameId(p.id); setRenameValue(p.title); }}>
                          Rename
                        </button>

                        <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => setDeleteId(p.id)}>
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
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
            {sorted.map((p) => {
              const meta = WORLD_CATALOG[p.worldId];
              const worldLabel = meta?.label ?? p.worldId;
              const isPinned = pinnedSet.has(p.id);

              return (
                <div key={p.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2">
                    {(p.publish?.coverEmoji && p.publish.coverEmoji.trim()) ? (
                      <span className="text-2xl">{p.publish.coverEmoji.trim().slice(0, 2)}</span>
                    ) : meta?.iconSrc ? (
                      <img src={meta.iconSrc} alt="" className="w-7 h-7 opacity-90" draggable={false} />
                    ) : (
                      <span className="text-xl">{meta?.iconText ?? "⬚"}</span>
                    )}

                    <div className="min-w-0">
                      <div className="font-semibold truncate">{isPinned ? "📌 " : ""}{p.title}</div>
                      <div className="text-xs opacity-70 truncate">
                        {worldLabel} · {fmt(p.updatedAt)}
                      </div>

                      {p.publish?.blurb && p.publish.blurb.trim() ? (
                        <div className="mt-2 text-sm text-white/70 line-clamp-3">
                          {p.publish.blurb.trim()}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2 flex-wrap">
                    <button
                      className="rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                      onClick={() => {
                        setPreviewId(p.id);
                        setPreviewTab("summary");
                      }}
                    >
                      Preview
                    </button>

                    <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => togglePinnedProject(p.id)}>
                      {isPinned ? "Unpin" : "Pin"}
                    </button>

                    <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => exportProject(p)}>
                      Export
                    </button>

                    <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => onDuplicateProject(p.id)}>
                      Copy
                    </button>

                    <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => onSetStatus(p.id, "draft")} title="Unpublish">
                      Unpublish
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {previewId && previewProject && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85" onClick={() => setPreviewId(null)} />
          <div className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-black p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold truncate">{previewProject.title}</div>
                <div className="text-xs opacity-70 truncate">
                  {(WORLD_CATALOG[previewProject.worldId]?.label ?? previewProject.worldId)} ·{" "}
                  {fmt(previewProject.updatedAt)} · {statusLabel(previewProject.status)}
                  {" · "}
                  {previewPinned ? "Pinned" : "Not pinned"}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap justify-end text-xs">
                <button
                  className={`rounded-xl border border-white/10 px-3 py-2 ${previewTab === "summary" ? "bg-white/10" : "bg-white/5"}`}
                  onClick={() => setPreviewTab("summary")}
                >
                  Summary
                </button>
                <button
                  className={`rounded-xl border border-white/10 px-3 py-2 ${previewTab === "json" ? "bg-white/10" : "bg-white/5"}`}
                  onClick={() => setPreviewTab("json")}
                >
                  JSON
                </button>

                <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" onClick={() => togglePinnedProject(previewProject.id)}>
                  {previewPinned ? "Unpin" : "Pin"}
                </button>

                <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" onClick={() => exportProject(previewProject)}>
                  Export
                </button>

                <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" onClick={() => doCopy("JSON", previewJson)}>
                  Copy JSON
                </button>

                <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" onClick={() => doCopy("Summary", previewLines.join("\n"))}>
                  Copy summary
                </button>

                <button
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  onClick={async () => {
                    const code = putShare(previewProject);
                    const ok = await copyText(code);
                    await toastMsg(ok ? `Share code copied: ${code}` : `Code: ${code}`);
                  }}
                  title="Local share code"
                >
                  Share code
                </button>

                <button
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  onClick={() => {
                    const id = previewProject.id;
                    setPreviewId(null);
                    onOpenProjectReadOnly(id);
                  }}
                  title="Open read-only"
                >
                  Open (RO)
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
                  Edit
                </button>

                <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" onClick={() => setPreviewId(null)}>
                  Close
                </button>
              </div>
            </div>

            {previewTab === "summary" ? (
              <div className="mt-4 space-y-2">
                <div className="text-xs opacity-60">
                  Human preview. “Share code” works on this device/browser only (local-first).
                </div>
                <div className="rounded-xl border border-white/15 bg-black/30 p-4 text-sm">
                  {previewLines.map((l, i) => (
                    <div key={i} className="leading-relaxed">
                      {l}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <div className="text-xs opacity-60">Read-only JSON</div>
                <textarea
                  className="mt-3 w-full rounded-xl border border-white/15 bg-black/30 p-3 text-xs text-white font-mono min-h-[320px]"
                  readOnly
                  value={previewJson}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {showImportCode && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85" onClick={() => setShowImportCode(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-black p-4 text-white">
            <div className="font-semibold">Import from code</div>
            <div className="mt-2 text-sm opacity-80">
              Local-only: works in the same browser profile. Imports as a new draft copy.
            </div>

            <input
              className="mt-4 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white"
              value={importCodeValue}
              onChange={(e) => setImportCodeValue(e.target.value)}
              placeholder="ABCD-EFGH"
              autoFocus
            />

            <div className="mt-4 flex flex-col gap-2">
              <button
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left"
                onClick={importFromCode}
              >
                Import
              </button>

              <button
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left"
                onClick={() => setShowImportCode(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85" onClick={() => setDeleteId(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-black p-4 text-white">
            <div className="font-semibold">Delete project?</div>
            <div className="mt-2 text-sm opacity-80">
              This will permanently remove{" "}
              <span className="font-semibold">{deleteProject?.title ?? "this project"}</span>.
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

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60]">
          <div className="rounded-xl border border-white/10 bg-black/90 px-4 py-2 text-sm text-white">
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}
