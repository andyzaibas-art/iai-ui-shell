import { WorldId } from "../app/modes";

type WorldIcon = {
  id: WorldId;
  label: string;
  icon: string;
  hint?: string;
};

const worlds: WorldIcon[] = [
  { id: "game", label: "Game", icon: "🎮" },
  { id: "not_sure", label: "Not sure", icon: "❓" },
  { id: "planner", label: "Planner", icon: "🗓️" },
  { id: "writing", label: "Writing", icon: "✍️" },
  { id: "video", label: "Video", icon: "🎥", hint: "Soon" },
  { id: "app", label: "App / Tool", icon: "🛠️", hint: "Soon" },
];

export default function WorldIconGrid({
  onSelect,
}: {
  onSelect: (id: WorldId) => void;
}) {
  return (
    <div className="w-full max-w-md">
      <div
        className="gap-x-4 gap-y-5"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 72px)",
          justifyContent: "center",
          justifyItems: "center",
        }}
      >
        {worlds.map((w) => (
          <button
            key={w.id}
            className="flex flex-col items-center text-center select-none w-[72px]"
            onClick={() => onSelect(w.id)}
            aria-label={w.label}
          >
            <div className="w-16 h-16 rounded-2xl border border-white/15 bg-white/5 flex items-center justify-center text-2xl">
              <span className="leading-none">{w.icon}</span>
            </div>

            <div className="mt-2 text-[11px] font-medium leading-tight h-7 flex items-start justify-center text-white">
              {w.label}
            </div>

            <div className="text-[10px] opacity-60 h-3 leading-tight text-white">
              {w.hint ?? ""}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
