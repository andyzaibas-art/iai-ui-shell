import { useEffect, useMemo } from "react";
import { WorldId } from "../app/modes";
import { setIconOrder, useUiPrefs } from "../app/stores/UiPrefsStore";

type WorldIcon = {
  id: WorldId;
  label: string;
  icon: string;
  disabled?: boolean; // dim + no click
};

const worlds: WorldIcon[] = [
  { id: "game", label: "Game", icon: "🎮" },
  { id: "not_sure", label: "Not sure", icon: "❓" },
  { id: "planner", label: "Planner", icon: "🗓️" },
  { id: "writing", label: "Writing", icon: "✍️" },
  { id: "video", label: "Video", icon: "🎥", disabled: true },
  { id: "app", label: "App / Tool", icon: "🛠️", disabled: true },
];

function swap(arr: WorldId[], a: number, b: number): WorldId[] {
  if (a < 0 || b < 0 || a >= arr.length || b >= arr.length) return arr;
  const next = arr.slice();
  const t = next[a];
  next[a] = next[b];
  next[b] = t;
  return next;
}

export default function WorldIconGrid({
  onSelect,
}: {
  onSelect: (id: WorldId) => void;
}) {
  const prefs = useUiPrefs();

  const worldIds = useMemo(() => worlds.map((w) => w.id), []);
  const byId = useMemo(() => {
    const m = new Map<WorldId, WorldIcon>();
    for (const w of worlds) m.set(w.id, w);
    return m;
  }, []);

  const ordered = useMemo(() => {
    const available = new Set(worldIds);
    const fromPrefs = (prefs.iconOrder ?? []).filter((id) => available.has(id));
    const missing = worldIds.filter((id) => !fromPrefs.includes(id));
    return [...fromPrefs, ...missing];
  }, [prefs.iconOrder, worldIds]);

  useEffect(() => {
    const current = prefs.iconOrder ?? [];
    const same =
      current.length === ordered.length &&
      current.every((v, i) => v === ordered[i]);
    if (!same) setIconOrder(ordered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordered]);

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
        {ordered.map((id, idx) => {
          const w = byId.get(id);
          if (!w) return null;

          const disabled = Boolean(w.disabled);
          const canLeft = idx > 0;
          const canRight = idx < ordered.length - 1;

          return (
            <div
              key={w.id}
              className={[
                "flex flex-col items-center text-center select-none w-[72px] relative",
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
              ].join(" ")}
              role={disabled ? undefined : "button"}
              tabIndex={disabled ? -1 : 0}
              aria-label={w.label}
              onClick={() => {
                if (!disabled) onSelect(w.id);
              }}
              onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(w.id);
                }
              }}
            >
              <div className="absolute -top-2 -left-2 flex gap-1">
                <button
                  type="button"
                  className="text-[10px] px-1.5 py-0.5 rounded-md border border-white/15 bg-white/5 text-white/80 disabled:opacity-30"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canLeft) return;
                    setIconOrder(swap(ordered, idx, idx - 1));
                  }}
                  disabled={!canLeft}
                  aria-label="Move left"
                >
                  ◀
                </button>
                <button
                  type="button"
                  className="text-[10px] px-1.5 py-0.5 rounded-md border border-white/15 bg-white/5 text-white/80 disabled:opacity-30"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canRight) return;
                    setIconOrder(swap(ordered, idx, idx + 1));
                  }}
                  disabled={!canRight}
                  aria-label="Move right"
                >
                  ▶
                </button>
              </div>

              <div className="w-16 h-16 rounded-2xl border border-white/15 bg-white/5 flex items-center justify-center text-2xl">
                <span className="leading-none">{w.icon}</span>
              </div>

              <div className="mt-2 text-[11px] font-medium leading-tight h-7 flex items-start justify-center text-white">
                {w.label}
              </div>

              <div className="text-[10px] opacity-60 h-3 leading-tight text-white">
                {disabled ? "Coming soon" : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
