import { GameDraft, GameState, applyChoice, generateStory, getNode, newGameState } from "./gameModel";

function setDraftField(st: GameState, patch: Partial<GameDraft>): GameState {
  return {
    ...st,
    draft: {
      ...(st.draft ?? {}),
      ...patch,
    },
  };
}

export default function GameFlow({
  value,
  onChange,
}: {
  value?: GameState;
  onChange: (next: GameState) => void;
}) {
  const st = value ?? newGameState();
  const mode = st.mode ?? "play";
  const node = getNode(st.nodeId, st.story);

  const usingGenerated = Boolean(st.story);

  if (mode === "create") {
    const d = st.draft ?? {};

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xl font-semibold">Create (Quick)</div>
          <div className="flex gap-2">
            <button
              className="rounded-xl border px-3 py-2"
              onClick={() => onChange({ ...st, mode: "play" })}
            >
              Back to Play
            </button>
          </div>
        </div>

        <div className="rounded-2xl border p-4 space-y-3">
          <div className="text-sm opacity-80">
            Fill a few fields. We generate a short story you can play immediately.
          </div>

          <div className="space-y-2">
            <label className="block text-xs opacity-70">Title</label>
            <input
              className="w-full rounded-xl border px-4 py-3 bg-transparent"
              value={d.title ?? ""}
              onChange={(e) => onChange(setDraftField(st, { title: e.target.value }))}
              placeholder="The Choice"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs opacity-70">Hero</label>
            <input
              className="w-full rounded-xl border px-4 py-3 bg-transparent"
              value={d.hero ?? ""}
              onChange={(e) => onChange(setDraftField(st, { hero: e.target.value }))}
              placeholder="You / Neo / The Traveler…"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs opacity-70">Setting</label>
            <input
              className="w-full rounded-xl border px-4 py-3 bg-transparent"
              value={d.setting ?? ""}
              onChange={(e) => onChange(setDraftField(st, { setting: e.target.value }))}
              placeholder="A city at night / a forest / a station…"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs opacity-70">Goal</label>
            <input
              className="w-full rounded-xl border px-4 py-3 bg-transparent"
              value={d.goal ?? ""}
              onChange={(e) => onChange(setDraftField(st, { goal: e.target.value }))}
              placeholder="Find the signal / escape / deliver…"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs opacity-70">Twist (optional)</label>
            <textarea
              className="w-full rounded-xl border px-4 py-3 bg-transparent min-h-[96px]"
              value={d.twist ?? ""}
              onChange={(e) => onChange(setDraftField(st, { twist: e.target.value }))}
              placeholder="A secret is revealed…"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs opacity-70">Tone</label>
            <select
              className="w-full rounded-xl border px-4 py-3 bg-transparent"
              value={d.tone ?? "mystery"}
              onChange={(e) =>
                onChange(
                  setDraftField(st, {
                    tone: (e.target.value as GameDraft["tone"]) ?? "mystery",
                  })
                )
              }
            >
              <option value="fun">Fun</option>
              <option value="focus">Focus</option>
              <option value="mystery">Mystery</option>
            </select>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              className="w-full rounded-xl border px-4 py-3 text-left"
              onClick={() => {
                const story = generateStory(st.draft ?? {});
                onChange({
                  ...st,
                  mode: "play",
                  story,
                  nodeId: "start",
                  history: [],
                });
              }}
            >
              Generate story & play
            </button>

            <button
              className="w-full rounded-xl border px-4 py-3 text-left opacity-80"
              onClick={() =>
                onChange({
                  ...st,
                  story: undefined,
                  nodeId: "start",
                  history: [],
                  mode: "play",
                })
              }
            >
              Use built-in story (reset)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PLAY MODE
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xl font-semibold">{node.title}</div>
          <div className="text-xs opacity-60">
            {usingGenerated ? "Generated story" : "Built-in story"}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            className="rounded-xl border px-3 py-2"
            onClick={() => onChange({ ...st, mode: "create" })}
          >
            Create
          </button>
          <button
            className="rounded-xl border px-3 py-2"
            onClick={() => onChange({ ...st, nodeId: "start", history: [] })}
          >
            Restart
          </button>
        </div>
      </div>

      <div className="opacity-80 leading-relaxed whitespace-pre-line">{node.body}</div>

      <div className="space-y-2">
        {node.choices.map((c) => (
          <button
            key={c.label}
            className="w-full rounded-xl border px-4 py-3 text-left"
            onClick={() => onChange(applyChoice(st, c))}
          >
            {c.label}
          </button>
        ))}
      </div>

      {st.history.length > 0 && (
        <div className="rounded-2xl border p-4">
          <div className="font-semibold">Your path</div>
          <div className="mt-2 text-sm opacity-70 space-y-1">
            {st.history.slice(-5).map((h, idx) => (
              <div key={`${h.nodeId}-${idx}`}>• {h.choiceLabel}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
