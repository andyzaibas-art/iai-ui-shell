import { useEffect, useMemo, useRef, useState } from "react";
import { exportBackup, importBackup } from "../lib/backup";
import { Project, type ProjectStatus } from "./ProjectStore";
import { WORLD_CATALOG, WORLD_DEFAULT_ORDER } from "../app/worldCatalog";
import type { WorldId } from "../app/modes";
import {
  useUiPrefs,
  togglePinnedProject,
  setGallerySort,
  setProjectsView,
  setProjectsWorldFilter,
  setProjectsStatusFilter,
  setProjectsQuery,
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

// Single modal state (prevents overlap)
type Modal =
  | { kind: "preview"; id: string }
  | { kind: "delete"; id: string }
  | { kind: "import_code" }
  | { kind: "import_string" }
  | null;

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
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
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

// --- Portable share string (cross-device) ---
// IAI1: = raw JSON bytes base64url
// IAI2: = gzip(JSON) bytes base64url (shorter, if supported)
const SHARE_STR_PREFIX = "IAI1:";
const SHARE_STR_GZ_PREFIX = "IAI2:";

function bytesToB64Url(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    bin += String.fromCharCode(...slice);
  }
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64UrlToBytes(s: string): Uint8Array | null {
  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

async function readAllBytes(rs: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = rs.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.length;
    }
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

async function gzipCompress(bytes: Uint8Array): Promise<Uint8Array | null> {
  const CS = (globalThis as any).CompressionStream;
  if (!CS) return null;
  try {
    const cs = new CS("gzip");
    const stream = new Blob([bytes as unknown as BlobPart]).stream().pipeThrough(cs as any) as ReadableStream<Uint8Array>;
    return await readAllBytes(stream);
  } catch {
    return null;
  }
}

async function gzipDecompress(bytes: Uint8Array): Promise<Uint8Array | null> {
  const DS = (globalThis as any).DecompressionStream;
  if (!DS) return null;
  try {
    const ds = new DS("gzip");
    const stream = new Blob([bytes as unknown as BlobPart]).stream().pipeThrough(ds as any) as ReadableStream<Uint8Array>;
    return await readAllBytes(stream);
  } catch {
    return null;
  }
}

async function encodeShareString(project: Project): Promise<string> {
  const payload = { v: 1, worldId: project.worldId, title: project.title, publish: project.publish, state: project.state };
  const json = JSON.stringify(payload);
  const raw = new TextEncoder().encode(json);

  const gz = await gzipCompress(raw);
  if (gz && gz.length > 0 && gz.length < raw.length) {
    return SHARE_STR_GZ_PREFIX + bytesToB64Url(gz);
  }
  return SHARE_STR_PREFIX + bytesToB64Url(raw);
}

async function decodeShareString(input: string): Promise<unknown | null> {
  const raw = (input ?? "").trim();
  if (!raw) return null;

  if (raw.startsWith(SHARE_STR_GZ_PREFIX)) {
    const bytes = b64UrlToBytes(raw.slice(SHARE_STR_GZ_PREFIX.length));
    if (!bytes) return null;
    const dec = await gzipDecompress(bytes);
    if (!dec) return null;
    try {
      const json = new TextDecoder().decode(dec);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  const s = raw.startsWith(SHARE_STR_PREFIX) ? raw.slice(SHARE_STR_PREFIX.length) : raw;
  const bytes = b64UrlToBytes(s);
  if (!bytes) return null;
  try {
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch {
    return null;
  }
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
  const backupRef = useRef<HTMLInputElement | null>(null);

  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [modal, setModal] = useState<Modal>(null);
  const [previewTab, setPreviewTab] = useState<PreviewTab>("summary");

  const [importCodeValue, setImportCodeValue] = useState("");
  const [importStringValue, setImportStringValue] = useState("");

  const [toast, setToast] = useState<Toast>(null);

  const [q, setQ] = useState(() => ui.projectsQuery ?? "");
  const [worldFilter, setWorldFilter] = useState<WorldFilter>(() => (ui.projectsWorldFilter as WorldFilter) ?? "all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => (ui.projectsStatusFilter as StatusFilter) ?? "all");
  const [view, setView] = useState<ViewMode>(() => (ui.projectsView === "gallery" ? "gallery" : "list"));

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

  function openPreview(id: string) {
    setPreviewTab("summary");
    setModal({ kind: "preview", id });
  }

  function openDelete(id: string) {
    setModal({ kind: "delete", id });
  }

  function openImportCode() {
    setImportCodeValue("");
    setModal({ kind: "import_code" });
  }

  function openImportString() {
    setImportStringValue("");
    setModal({ kind: "import_string" });
  }

  function closeModal() {
    setModal(null);
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
    closeModal();
    void toastMsg(`Imported from code: ${code}`);
  }

  async function importFromString() {
    const decoded = await decodeShareString(importStringValue);
    if (!decoded || typeof decoded !== "object") {
      void toastMsg("Invalid share string");
      return;
    }
    const o: any = decoded;
    const t = Date.now();
    const imported: any = {
      ...o,
      id: "",
      createdAt: t,
      updatedAt: t,
      status: "draft",
      title: `${(typeof o.title === "string" && o.title.trim()) ? o.title.trim() : "Shared project"} (shared)`,
    };
    onImportProjectJson(imported);
    closeModal();
    void toastMsg("Imported from share string");
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
      if (ap !== bp) return ap ? -1 : 1;

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
    if (!modal || modal.kind !== "delete") return null;
    return projects.find((p) => p.id === modal.id) ?? null;
  }, [projects, modal]);

  const previewProject = useMemo(() => {
    if (!modal || modal.kind !== "preview") return null;
    return projects.find((p) => p.id === modal.id) ?? null;
  }, [projects, modal]);

  useEffect(() => {
    if (modal?.kind === "preview" && !previewProject) closeModal();
  }, [modal, previewProject]);

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

          <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" onClick={() => fileRef.current?.click()}>
            Import file
          </button>

          <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" onClick={openImportCode}>
            Import code
          </button>

          <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" onClick={openImportString} title="Paste from another device">
            Import string
          </button>

          <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" onClick={onBackHome}>
            Home
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-white/10 bg-black/20">
        <div className="flex flex-col lg:flex-row gap-2">
          <input className="flex-1 rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white" value={q} onChange={(e) => {
              const v = e.target.value;
              setQ(v);
              setProjectsQuery(v);
            }} placeholder="Search projects…" />

          <select className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white" value={worldFilter} onChange={(e) => {
              const v = e.target.value as WorldFilter;
              setWorldFilter(v);
              setProjectsWorldFilter(v);
            }}>
            <option value="all">All worlds</option>
            {WORLD_DEFAULT_ORDER.map((id) => (
              <option key={id} value={id}>{WORLD_CATALOG[id]?.label ?? id}</option>
            ))}
          </select>

          <select className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white disabled:opacity-60" value={statusFilter} onChange={(e) => {
              const v = e.target.value as StatusFilter;
              setStatusFilter(v);
              setProjectsStatusFilter(v);
            }} disabled={view === "gallery"}>
            <option value="all">All status</option>
            <option value="draft">Draft</option>
            <option value="done">Published</option>
          </select>

          <select className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white" value={sortMode} onChange={(e) => setGallerySort(e.target.value as GallerySort)}>
            <option value="pinned_recent">Pinned → Recent</option>
            <option value="recent">Recent</option>
            <option value="title">Title A–Z</option>
          </select>

          <div className="flex gap-2">
            <button className={`rounded-xl border border-white/10 px-3 py-2 ${view === "list" ? "bg-white/10" : "bg-white/5"}`} onClick={() => {
                setView("list");
                setProjectsView("list");
              }}>List</button>
            <button className={`rounded-xl border border-white/10 px-3 py-2 ${view === "gallery" ? "bg-white/10" : "bg-white/5"}`} onClick={() => {
                setView("gallery");
                setProjectsView("gallery");
              }}>Gallery</button>
            <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" onClick={() => {
                setQ("");
                setProjectsQuery("");
                setWorldFilter("all");
                setProjectsWorldFilter("all");
                setStatusFilter("all");
                setProjectsStatusFilter("all");
                setView("list");
                setProjectsView("list");
              }}>Clear</button>
          </div>
        </div>

        <div className="mt-2 text-xs text-white/60">
          Showing {sorted.length} of {projects.length}{view === "gallery" ? " (Published only)" : ""}{pinnedIds.length ? ` · Pinned: ${pinnedIds.length}` : ""}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {projects.length === 0 ? (
          <div className="opacity-80">No projects yet. Open a world from Home to create one, or import a file/code/string.</div>
        ) : sorted.length === 0 ? (
          <div className="opacity-80">{view === "gallery" ? "No published projects yet." : "No matches."}</div>
        ) : view === "gallery" ? (
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
                      <div className="text-xs opacity-70 truncate">{worldLabel} · {fmt(p.updatedAt)}</div>
                      {p.publish?.blurb && p.publish.blurb.trim() ? (
                        <div className="mt-2 text-sm text-white/70 line-clamp-3">{p.publish.blurb.trim()}</div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2 flex-wrap">
                    <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => openPreview(p.id)}>Preview</button>
                    <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => togglePinnedProject(p.id)}>{isPinned ? "Unpin" : "Pin"}</button>
                    <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => exportProject(p)}>Export</button>
                    <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => onDuplicateProject(p.id)}>Copy</button>
                    <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => onSetStatus(p.id, "draft")}>Unpublish</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
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
                      <div className="text-sm opacity-70">{worldLabel} · {statusLabel(p.status)} · {fmt(p.updatedAt)}</div>

                      <div className="mt-3 flex gap-2 flex-wrap">
                        <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => onOpenProject(p.id)}>Continue</button>
                        <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => togglePinnedProject(p.id)}>{isPinned ? "Unpin" : "Pin"}</button>
                        <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => onSetStatus(p.id, p.status === "done" ? "draft" : "done")}>{p.status === "done" ? "Unpublish" : "Publish"}</button>
                        <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => onDuplicateProject(p.id)}>Duplicate</button>
                        <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => exportProject(p)}>Export</button>
                        <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => { setRenameId(p.id); setRenameValue(p.title); }}>Rename</button>
                        <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => openDelete(p.id)}>Delete</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm opacity-70 mb-2">Rename project</div>
                      <input className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} autoFocus />
                      <div className="mt-3 flex gap-2 flex-wrap">
                        <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => { const t = renameValue.trim(); if (!t) return; onRenameProject(p.id, t); setRenameId(null); setRenameValue(""); }}>Save</button>
                        <button className="rounded-xl border border-white/10 bg-black/30 px-3 py-2" onClick={() => { setRenameId(null); setRenameValue(""); }}>Cancel</button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal?.kind === "preview" && previewProject && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-black p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold truncate">{previewProject.title}</div>
                <div className="text-xs opacity-70 truncate">
                  {(WORLD_CATALOG[previewProject.worldId]?.label ?? previewProject.worldId)} · {fmt(previewProject.updatedAt)} · {statusLabel(previewProject.status)} · {previewPinned ? "Pinned" : "Not pinned"}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap justify-end text-xs">
                <button className={`rounded-xl border border-white/10 px-3 py-2 ${previewTab === "summary" ? "bg-white/10" : "bg-white/5"}`} onClick={() => setPreviewTab("summary")}>Summary</button>
                <button className={`rounded-xl border border-white/10 px-3 py-2 ${previewTab === "json" ? "bg-white/10" : "bg-white/5"}`} onClick={() => setPreviewTab("json")}>JSON</button>

                <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" onClick={() => togglePinnedProject(previewProject.id)}>{previewPinned ? "Unpin" : "Pin"}</button>
                <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" onClick={() => exportProject(previewProject)}>Export</button>

                <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" onClick={() => doCopy("JSON", previewJson)}>Copy JSON</button>
                <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" onClick={() => doCopy("Summary", previewLines.join("\n"))}>Copy summary</button>

                <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" onClick={async () => { const code = putShare(previewProject); const ok = await copyText(code); await toastMsg(ok ? `Share code copied: ${code}` : `Code: ${code}`); }}>Share code</button>

                <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" onClick={async () => { const s = await encodeShareString(previewProject); const ok = await copyText(s); await toastMsg(ok ? "Share string copied" : "Copy failed"); }} title="Compressed if supported">
                  Share string
                </button>

                <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" onClick={() => { const id = previewProject.id; closeModal(); onOpenProjectReadOnly(id); }}>Open (RO)</button>
                <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" onClick={() => { const id = previewProject.id; closeModal(); onOpenProject(id); }}>Edit</button>
                <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" onClick={closeModal}>Close</button>
              </div>
            </div>

            {previewTab === "summary" ? (
              <div className="mt-4 space-y-2">
                <div className="text-xs opacity-60">Human preview. Share string now uses gzip when available (shorter).</div>
                <div className="rounded-xl border border-white/15 bg-black/30 p-4 text-sm">
                  {previewLines.map((l, i) => <div key={i} className="leading-relaxed">{l}</div>)}
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <div className="text-xs opacity-60">Read-only JSON</div>
                <textarea className="mt-3 w-full rounded-xl border border-white/15 bg-black/30 p-3 text-xs text-white font-mono min-h-[320px]" readOnly value={previewJson} />
              </div>
            )}
          </div>
        </div>
      )}

      {modal?.kind === "import_code" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-black p-4 text-white">
            <div className="font-semibold">Import from code</div>
            <div className="mt-2 text-sm opacity-80">Local-only: works in same browser profile.</div>
            <input className="mt-4 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white" value={importCodeValue} onChange={(e) => setImportCodeValue(e.target.value)} placeholder="ABCD-EFGH" autoFocus />
            <div className="mt-4 flex flex-col gap-2">
              <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left" onClick={importFromCode}>Import</button>
              <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {modal?.kind === "import_string" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-black p-4 text-white">
            <div className="font-semibold">Import share string</div>
            <div className="mt-2 text-sm opacity-80">Paste `IAI1:` or `IAI2:` string (IAI2 is shorter).</div>
            <textarea className="mt-4 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white min-h-[140px]" value={importStringValue} onChange={(e) => setImportStringValue(e.target.value)} placeholder="IAI2:..." autoFocus />
            <div className="mt-4 flex flex-col gap-2">
              <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left" onClick={() => void importFromString()}>Import</button>
              <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {modal?.kind === "delete" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-black p-4 text-white">
            <div className="font-semibold">Delete project?</div>
            <div className="mt-2 text-sm opacity-80">This will permanently remove <span className="font-semibold">{deleteProject?.title ?? "this project"}</span>.</div>
            <div className="mt-4 flex flex-col gap-2">
              <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left" onClick={() => { const id = modal.id; closeModal(); onDeleteProject(id); }}>Delete</button>
              <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60]">
          <div className="rounded-xl border border-white/10 bg-black/90 px-4 py-2 text-sm text-white">{toast.msg}</div>
        </div>
      )}
    </div>
  );
}
