import { WorldId } from "../modes";

type DrawerProps = {
  isOpen: boolean;
  onClose: () => void;

  onGoHome: () => void;
  onGoProjects: () => void;
  onEnterWorld: (id: WorldId) => void;
};

const worlds: { id: WorldId; label: string; meta?: string }[] = [
  { id: "game", label: "Game" },
  { id: "not_sure", label: "Not sure" },
  { id: "planner", label: "Planner" },
  { id: "writing", label: "Writing" },
  { id: "video", label: "Video", meta: "Coming soon" },
  { id: "app", label: "App / Tool", meta: "Coming soon" },
];

export default function Drawer({
  isOpen,
  onClose,
  onGoHome,
  onGoProjects,
  onEnterWorld,
}: DrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <button
        className="absolute inset-0 bg-black/50"
        aria-label="Close menu"
        onClick={onClose}
      />

      {/* panel */}
      <div className="absolute left-0 top-0 h-full w-[320px] max-w-[85vw] bg-black text-white border-r border-white/10 p-4 flex flex-col">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Menu</div>
          <button
            className="rounded-xl border border-white/20 px-3 py-2"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <button
            className="w-full rounded-xl border border-white/20 px-4 py-3 text-left"
            onClick={() => {
              onGoHome();
              onClose();
            }}
          >
            Home
          </button>

          <button
            className="w-full rounded-xl border border-white/20 px-4 py-3 text-left"
            onClick={() => {
              onGoProjects();
              onClose();
            }}
          >
            My projects
          </button>
        </div>

        <div className="mt-6 text-sm font-semibold text-white/80">Worlds</div>
        <div className="mt-2 space-y-2">
          {worlds.map((w) => (
            <button
              key={w.id}
              className="w-full rounded-xl border border-white/15 px-4 py-3 text-left flex items-center justify-between"
              onClick={() => {
                onEnterWorld(w.id);
                onClose();
              }}
            >
              <span>{w.label}</span>
              {w.meta && <span className="text-xs opacity-70">{w.meta}</span>}
            </button>
          ))}
        </div>

        <div className="mt-6 text-sm font-semibold text-white/80">System</div>
        <div className="mt-2 space-y-2">
          <button
            className="w-full rounded-xl border border-white/15 px-4 py-3 text-left opacity-70"
            onClick={() => {}}
            disabled
          >
            Language — later
          </button>

          <button
            className="w-full rounded-xl border border-white/15 px-4 py-3 text-left opacity-70"
            onClick={() => {}}
            disabled
          >
            ICP mode (8/88/888) — later
          </button>
        </div>

        <div className="mt-auto pt-6 text-xs opacity-70">
          IAI is private by default. No silent writes.
        </div>
      </div>
    </div>
  );
}
