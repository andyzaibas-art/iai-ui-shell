import { useMemo, useState, type ReactNode } from "react";
import { WorldId, AppMode } from "../modes";
import { WORLD_CATALOG, WORLD_DEFAULT_ORDER } from "../worldCatalog";
import { useUiPrefs } from "../stores/UiPrefsStore";

function WorldIcon({ id }: { id: WorldId }) {
  const meta = WORLD_CATALOG[id];
  if (meta.iconSrc) {
    return (
      <img
        src={meta.iconSrc}
        alt=""
        className="w-5 h-5 opacity-90"
        draggable={false}
      />
    );
  }
  return <span>{meta.iconText ?? "⬚"}</span>;
}

export default function AppShell({
  mode,
  onHome,
  onProjects,
  onOpenWorld,
  children,
}: {
  mode: AppMode;
  onHome: () => void;
  onProjects: () => void;
  onOpenWorld: (id: WorldId) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const prefs = useUiPrefs();

  const orderedIds = useMemo(() => {
    const available = new Set(WORLD_DEFAULT_ORDER);
    const fromPrefs = (prefs.iconOrder ?? []).filter((id) => available.has(id));
    const missing = WORLD_DEFAULT_ORDER.filter((id) => !fromPrefs.includes(id));
    return [...fromPrefs, ...missing];
  }, [prefs.iconOrder]);

  const worlds = orderedIds.map((id) => WORLD_CATALOG[id]);

  return (
    <div className="h-dvh w-full flex overflow-hidden bg-black text-white">
      {/* Desktop rail */}
      <div className="hidden md:flex w-16 flex-col items-center gap-3 border-r border-white/10 bg-black/60 py-4">
        <button
          className="w-10 h-10 rounded-xl border border-white/10 bg-white/5"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          title="Menu"
        >
          ☰
        </button>

        <button
          className={`w-10 h-10 rounded-xl border border-white/10 bg-white/5 ${
            mode === "home" ? "ring-2 ring-white/20" : ""
          }`}
          onClick={onHome}
          aria-label="Home"
          title="Home"
        >
          🏠
        </button>

        <button
          className={`w-10 h-10 rounded-xl border border-white/10 bg-white/5 ${
            mode === "projects" ? "ring-2 ring-white/20" : ""
          }`}
          onClick={onProjects}
          aria-label="My projects"
          title="My projects"
        >
          📁
        </button>
      </div>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-12 flex items-center justify-between px-3 border-b border-white/10 bg-black/60">
          <button
            className="md:hidden w-10 h-10 rounded-xl border border-white/10 bg-white/5"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>

          <div className="text-sm font-semibold tracking-[0.22em] text-white/90">
            I•A•I
          </div>

          <div className="w-10 h-10 md:hidden" />
          <div className="hidden md:block w-10 h-10" />
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-auto">{children}</div>
      </div>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] h-full bg-black border-r border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Menu</div>
              <button
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <button
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left"
                onClick={() => {
                  setOpen(false);
                  onHome();
                }}
              >
                🏠 Home
              </button>

              <button
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left"
                onClick={() => {
                  setOpen(false);
                  onProjects();
                }}
              >
                📁 My projects
              </button>
            </div>

            <div className="mt-6 text-sm font-semibold text-white/80">Worlds</div>
            <div className="mt-2 space-y-2">
              {worlds.map((w) => (
                <button
                  key={w.id}
                  className={`w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left ${
                    !w.enabled ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                  disabled={!w.enabled}
                  onClick={() => {
                    if (!w.enabled) return;
                    setOpen(false);
                    onOpenWorld(w.id);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <WorldIcon id={w.id} />
                      <span>{w.label}</span>
                    </div>
                    {!w.enabled && (
                      <span className="text-xs opacity-70">Coming soon</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 text-sm font-semibold text-white/80">System</div>
            <div className="mt-2 space-y-2">
              <button
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left opacity-70"
                disabled
              >
                Language — later
              </button>
              <button
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left opacity-70"
                disabled
              >
                ICP mode (8/88/888) — later
              </button>
            </div>

            <div className="mt-6 text-xs text-white/60">
              IAI is private by default. No silent writes.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
