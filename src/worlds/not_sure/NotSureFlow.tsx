import { WorldId } from "../../app/modes";
import {
  NotSureState,
  clampOneSentence,
  computeSuggestion,
  newNotSureState,
} from "./notSureModel";
import { useMemo, useState } from "react";

function Btn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className="rounded-xl border px-4 py-3 text-left disabled:opacity-50"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default function NotSureFlow({
  value,
  onChange,
  onChooseWorld,
}: {
  value?: NotSureState;
  onChange: (next: NotSureState) => void;
  onChooseWorld: (worldId: WorldId) => void;
}) {
  const st = value ?? newNotSureState();
  const [customOpen, setCustomOpen] = useState(false);

  function set(next: NotSureState) {
    onChange(next);
  }
  function next() {
    set({ ...st, stepIndex: st.stepIndex + 1 });
  }
  function prev() {
    set({ ...st, stepIndex: Math.max(0, st.stepIndex - 1) });
  }

  const customOk = useMemo(() => {
    return (st.customText ?? "").trim().length > 0;
  }, [st.customText]);

  // STEP 0: Entry
  if (st.stepIndex === 0) {
    return (
      <div className="space-y-4">
        <div className="text-xl font-semibold">Not sure</div>
        <div className="opacity-80">
          No problem. Answer a few simple questions and I’ll guide you to the right world.
        </div>
        <Btn onClick={() => set({ ...st, stepIndex: 1 })}>Start</Btn>
      </div>
    );
  }

  // STEP 1: Mood
  if (st.stepIndex === 1) {
    return (
      <div className="space-y-3">
        <div className="text-lg font-semibold">How do you want to feel?</div>

        <Btn onClick={() => { setCustomOpen(false); set({ ...st, mood: "fun" }); next(); }}>
          Fun
        </Btn>
        <Btn onClick={() => { setCustomOpen(false); set({ ...st, mood: "calm" }); next(); }}>
          Calm
        </Btn>
        <Btn onClick={() => { setCustomOpen(false); set({ ...st, mood: "curious" }); next(); }}>
          Curious
        </Btn>
        <Btn onClick={() => { setCustomOpen(false); set({ ...st, mood: "weird" }); next(); }}>
          Weird
        </Btn>
        <Btn onClick={() => { setCustomOpen(false); set({ ...st, mood: "unknown" }); next(); }}>
          I don’t know
        </Btn>

        <Btn
          onClick={() => {
            setCustomOpen(true);
            set({ ...st, mood: "custom" });
          }}
        >
          Other (1 sentence)
        </Btn>

        {customOpen && (
          <div className="space-y-2">
            <input
              className="w-full rounded-2xl border p-3"
              value={st.customText ?? ""}
              onChange={(e) =>
                set({ ...st, customText: clampOneSentence(e.target.value) })
              }
              placeholder="One sentence…"
            />
            <div className="flex gap-2">
              <button className="rounded-xl border px-4 py-2" onClick={() => setCustomOpen(false)}>
                Cancel
              </button>
              <button
                className="rounded-xl border px-4 py-2"
                disabled={!customOk}
                onClick={() => {
                  setCustomOpen(false);
                  next();
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button className="rounded-xl border px-4 py-2" onClick={prev}>
            Back
          </button>
        </div>
      </div>
    );
  }

  // STEP 2: Time
  if (st.stepIndex === 2) {
    return (
      <div className="space-y-3">
        <div className="text-lg font-semibold">How much time do you have right now?</div>

        <Btn onClick={() => { set({ ...st, time: "5m" }); next(); }}>5 minutes</Btn>
        <Btn onClick={() => { set({ ...st, time: "15m" }); next(); }}>15 minutes</Btn>
        <Btn onClick={() => { set({ ...st, time: "no_rush" }); next(); }}>No rush</Btn>
        <Btn onClick={() => { set({ ...st, time: "unknown" }); next(); }}>I don’t know</Btn>

        <Btn
          onClick={() => {
            setCustomOpen(true);
            set({ ...st, time: "custom" });
          }}
        >
          Other (1 sentence)
        </Btn>

        {customOpen && (
          <div className="space-y-2">
            <input
              className="w-full rounded-2xl border p-3"
              value={st.customText ?? ""}
              onChange={(e) =>
                set({ ...st, customText: clampOneSentence(e.target.value) })
              }
              placeholder="One sentence…"
            />
            <div className="flex gap-2">
              <button className="rounded-xl border px-4 py-2" onClick={() => setCustomOpen(false)}>
                Cancel
              </button>
              <button
                className="rounded-xl border px-4 py-2"
                disabled={!customOk}
                onClick={() => {
                  setCustomOpen(false);
                  next();
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button className="rounded-xl border px-4 py-2" onClick={prev}>
            Back
          </button>
        </div>
      </div>
    );
  }

  // STEP 3: Intent
  if (st.stepIndex === 3) {
    return (
      <div className="space-y-3">
        <div className="text-lg font-semibold">What do you want to do?</div>

        <Btn onClick={() => { setCustomOpen(false); set({ ...st, intent: "game" }); next(); }}>
          Play / create something fun
        </Btn>
        <Btn onClick={() => { setCustomOpen(false); set({ ...st, intent: "planner" }); next(); }}>
          Plan my day
        </Btn>
        <Btn onClick={() => { setCustomOpen(false); set({ ...st, intent: "writing" }); next(); }}>
          Write something
        </Btn>
        <Btn onClick={() => { setCustomOpen(false); set({ ...st, intent: "unknown" }); next(); }}>
          I don’t know
        </Btn>

        <Btn
          onClick={() => {
            setCustomOpen(true);
            set({ ...st, intent: "custom" });
          }}
        >
          Other (1 sentence)
        </Btn>

        {customOpen && (
          <div className="space-y-2">
            <input
              className="w-full rounded-2xl border p-3"
              value={st.customText ?? ""}
              onChange={(e) =>
                set({ ...st, customText: clampOneSentence(e.target.value) })
              }
              placeholder="One sentence…"
            />
            <div className="flex gap-2">
              <button className="rounded-xl border px-4 py-2" onClick={() => setCustomOpen(false)}>
                Cancel
              </button>
              <button
                className="rounded-xl border px-4 py-2"
                disabled={!customOk}
                onClick={() => {
                  setCustomOpen(false);
                  next();
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button className="rounded-xl border px-4 py-2" onClick={prev}>
            Back
          </button>
        </div>
      </div>
    );
  }

  // STEP 4: Suggestion
  if (st.stepIndex === 4) {
    const suggestion = st.suggestion ?? computeSuggestion(st);
    const [manualPick, setManualPick] = useState(false);

    return (
      <div className="space-y-4">
        <div className="text-lg font-semibold">Suggested world</div>
        <div className="rounded-2xl border p-4">
          <div className="font-semibold">{suggestion.worldId.toUpperCase()}</div>
          <div className="mt-2 text-sm opacity-70">
            {suggestion.confidence === "medium"
              ? "Good match based on your answers."
              : "Best guess — you can change it."}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Btn
            onClick={() => {
              set({ ...st, suggestion, stepIndex: 5 });
            }}
          >
            Start here
          </Btn>

          <Btn onClick={() => setManualPick((v) => !v)}>
            Choose another
          </Btn>
        </div>

        {manualPick && (
          <div className="space-y-2">
            <Btn onClick={() => set({ ...st, suggestion: { worldId: "game", confidence: "medium" }, stepIndex: 5 })}>
              Game
            </Btn>
            <Btn onClick={() => set({ ...st, suggestion: { worldId: "planner", confidence: "medium" }, stepIndex: 5 })}>
              Planner
            </Btn>
            <Btn onClick={() => set({ ...st, suggestion: { worldId: "writing", confidence: "medium" }, stepIndex: 5 })}>
              Writing
            </Btn>
          </div>
        )}

        <div className="pt-2">
          <button className="rounded-xl border px-4 py-2" onClick={prev}>
            Back
          </button>
        </div>
      </div>
    );
  }

  // STEP 5: Handoff
  const finalWorld = st.suggestion?.worldId ?? computeSuggestion(st).worldId;

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Ready</div>
      <div className="opacity-80">
        I will take you to <b>{finalWorld}</b>.
      </div>

      <Btn onClick={() => onChooseWorld(finalWorld)}>Go</Btn>

      <button className="rounded-xl border px-4 py-2" onClick={prev}>
        Back
      </button>
    </div>
  );
}
