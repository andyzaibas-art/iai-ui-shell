import { GameState, applyChoice, getNode, newGameState } from "./gameModel";

export default function GameFlow({
  value,
  onChange,
}: {
  value?: GameState;
  onChange: (next: GameState) => void;
}) {
  const st = value ?? newGameState();
  const node = getNode(st.nodeId);

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">{node.title}</div>
      <div className="opacity-80 leading-relaxed">{node.body}</div>

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
