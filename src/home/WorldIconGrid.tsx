import { useEffect, useMemo } from "react";
import { WorldId, worldCatalog } from "../app/modes";
import { setIconOrder, useUiPrefs } from "../app/stores/UiPrefsStore";

function isComingSoon(meta: unknown): boolean {
  const m = meta as any;
  return Boolean(m?.comingSoon ?? m?.disabled ?? (m?.available === false) ?? (m?.status === "comingSoon"));
}

function swap(arr: WorldId[], a: number, b: number): WorldId[] {
  if (a < 0 || b < 0 || a >= arr.length || b >= arr.length) return arr;
  const next = arr.slice();
  const tmp = next[a];
  next[a] = next[b];
  next[b] = tmp;
  return next;
}

function renderIcon(meta: any) {
  const icon = meta?.icon ?? meta?.emoji;
  const iconSrc = meta?.iconSrc ?? meta?.iconUrl ?? meta?.iconPath;

  if (typeof iconSrc === "string" && iconSrc.length > 0) {
    return <img src={iconSrc} alt="" className="w-8 h-8" draggable={false} />;
  }

  if (typeof icon === "string" && icon.length > 0) {
    return <span className="leading-none">{icon}</span>;
  }

  return <span className="leading-none">⬚</span>;
}

export default function WorldIconGrid({
  onSelect,
}: {
  onSelect: (id: WorldId) => void;
}) {
  const prefs = useUiPrefs();

  const allIds = useMemo(() => Object.keys(worldCatalog) as WorldId[], []);

  const ordered = useMemo(() => {
    const available = new Set(allIds);
    const fromPrefs = (prefs.iconOrder ?? []).filter((id) => available.has(id));
    const missing = allIds.filter((id) => !fromPrefs.includes(id));
    return [...fromPrefs, ...missing];
  }, [prefs.iconOrder, allIds]);

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
        {ordered.map((id) => {
          const meta: any = (worldCatalog as any)[id];
          if (!meta) return null;

          const label: string = meta.label ?? meta.title ?? id;
          const comingSoon = isComingSoon(meta);

          const idx = ordered.indexOf(id);
          const canLeft = idx > 0;
          const canRight = idx < ordered.length - 1;

          const moveLeft = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!canLeft) return;
            setIconOrder(swap(ordered, idx, idx - 1));
          };

          const moveRight = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!canRight) return;
            setIconOrder(swap(ordered, idx, idx + 1));
          };

          return (
            <button
              key={id}
              className={[
                "flex flex-col items-center text-center select-none w-[72px] relative",
                comingSoon ? "opacity-50 cursor-not-allowed" : "",
              ].join(" ")}
              onClick={() => {
                if (!comingSoon) onSelect(id);
              }}
              aria-label={label}
              disabled={comingSoon}
            >
              <div className="absolute -top-2 -left-2 flex gap-1">
                <button
                  type="button"
                  className="text-[10px] px-1.5 py-0.5 rounded-md border border-white/15 bg-white/5 text-white/80 disabled:opacity-30"
                  onClick={moveLeft}
                  disabled={!canLeft}
                  aria-label="Move left"
                >
                  ◀
                </button>
                <button
                  type="button"
                  className="text-[10px] px-1.5 py-0.5 rounded-md border border-white/15 bg-white/5 text-white/80 disabled:opacity-30"
                  onClick={moveRight}
                  disabled={!canRight}
                  aria-label="Move right"
                >
                  ▶
                </button>
              </div>

              <div className="w-16 h-16 rounded-2xl border border-white/15 bg-white/5 flex items-center justify-center text-2xl">
                {renderIcon(meta)}
              </div>

              <div className="mt-2 text-[11px] font-medium leading-tight h-7 flex items-start justify-center text-white">
                {label}
              </div>

              <div className="text-[10px] opacity-60 h-3 leading-tight text-white">
                {comingSoon ? "Coming soon" : ""}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
