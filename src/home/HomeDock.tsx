import { WorldId } from "../app/modes";

type DockItem =
  | { kind: "world"; id: WorldId; label: string; icon: string }
  | { kind: "projects"; label: string; icon: string };

const items: DockItem[] = [
  { kind: "world", id: "not_sure", label: "Not sure", icon: "❓" },
  { kind: "world", id: "game", label: "Game", icon: "🎮" },
  { kind: "world", id: "planner", label: "Planner", icon: "🗓️" },
  { kind: "projects", label: "Projects", icon: "📁" },
];

export default function HomeDock({
  onEnterWorld,
  onOpenProjects,
}: {
  onEnterWorld: (worldId: WorldId) => void;
  onOpenProjects: () => void;
}) {
  return (
    <div className="px-4 pb-4">
      <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          {items.map((it, idx) => (
            <button
              key={idx}
              className="flex flex-col items-center gap-1"
              onClick={() => {
                if (it.kind === "projects") onOpenProjects();
                else onEnterWorld(it.id);
              }}
            >
              <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-2xl">
                {it.icon}
              </div>
              <div className="text-[10px] text-white/80">{it.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
