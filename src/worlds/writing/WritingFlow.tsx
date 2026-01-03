import { useMemo } from "react";
import {
  WritingState,
  newWritingState,
  clampSeed,
  generateText,
  WritingType,
  WritingTone,
  WritingLength,
  WritingAudience,
} from "./writingModel";

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

export default function WritingFlow({
  value,
  onChange,
}: {
  value?: WritingState;
  onChange: (next: WritingState) => void;
}) {
  const st = value ?? newWritingState();

  function set(next: WritingState) {
    onChange(next);
  }
  function next() {
    set({ ...st, stepIndex: st.stepIndex + 1 });
  }
  function prev() {
    set({ ...st, stepIndex: Math.max(0, st.stepIndex - 1) });
  }

  const hasType = useMemo(() => !!st.type, [st.type]);
  const hasTone = useMemo(() => !!st.tone, [st.tone]);
  const hasLength = useMemo(() => !!st.length, [st.length]);
  const hasAudience = useMemo(() => !!st.audience, [st.audience]);

  // STEP 0: Entry
  if (st.stepIndex === 0) {
    return (
      <div className="space-y-4">
        <div className="text-xl font-semibold">Writing</div>
        <div className="opacity-80">
          Answer a few choices — I will generate a text you can edit.
        </div>
        <Btn onClick={() => set({ ...st, stepIndex: 1 })}>Start</Btn>
      </div>
    );
  }

  // STEP 1: Type
  if (st.stepIndex === 1) {
    const pick = (t: WritingType) => set({ ...st, type: t });
    return (
      <div className="space-y-3">
        <div className="text-lg font-semibold">What are we creating?</div>
        <Btn onClick={() => { pick("story"); next(); }}>Story</Btn>
        <Btn onClick={() => { pick("letter"); next(); }}>Letter</Btn>
        <Btn onClick={() => { pick("description"); next(); }}>Description</Btn>
        <Btn onClick={() => { pick("script"); next(); }}>Script</Btn>
        <Btn onClick={() => { pick("unknown"); next(); }}>Not sure</Btn>

        <div className="pt-2">
          <button className="rounded-xl border px-4 py-2" onClick={prev}>Back</button>
        </div>
      </div>
    );
  }

  // STEP 2: Tone
  if (st.stepIndex === 2) {
    const pick = (t: WritingTone) => set({ ...st, tone: t });
    return (
      <div className="space-y-3">
        <div className="text-lg font-semibold">Tone</div>
        <Btn onClick={() => { pick("warm"); next(); }}>Warm</Btn>
        <Btn onClick={() => { pick("serious"); next(); }}>Serious</Btn>
        <Btn onClick={() => { pick("funny"); next(); }}>Funny</Btn>
        <Btn onClick={() => { pick("neutral"); next(); }}>Neutral</Btn>
        <Btn onClick={() => { pick("unknown"); next(); }}>Not sure</Btn>

        <div className="pt-2">
          <button className="rounded-xl border px-4 py-2" onClick={prev}>Back</button>
        </div>
      </div>
    );
  }

  // STEP 3: Length
  if (st.stepIndex === 3) {
    const pick = (t: WritingLength) => set({ ...st, length: t });
    return (
      <div className="space-y-3">
        <div className="text-lg font-semibold">Length</div>
        <Btn onClick={() => { pick("short"); next(); }}>Short</Btn>
        <Btn onClick={() => { pick("medium"); next(); }}>Medium</Btn>
        <Btn onClick={() => { pick("long"); next(); }}>Long</Btn>
        <Btn onClick={() => { pick("unknown"); next(); }}>Not sure</Btn>

        <div className="pt-2">
          <button className="rounded-xl border px-4 py-2" onClick={prev}>Back</button>
        </div>
      </div>
    );
  }

  // STEP 4: Audience
  if (st.stepIndex === 4) {
    const pick = (t: WritingAudience) => set({ ...st, audience: t });
    return (
      <div className="space-y-3">
        <div className="text-lg font-semibold">Audience</div>
        <Btn onClick={() => { pick("me"); next(); }}>Me</Btn>
        <Btn onClick={() => { pick("child"); next(); }}>A child</Btn>
        <Btn onClick={() => { pick("adult"); next(); }}>An adult</Btn>
        <Btn onClick={() => { pick("everyone"); next(); }}>Everyone</Btn>
        <Btn onClick={() => { pick("unknown"); next(); }}>Not sure</Btn>

        <div className="pt-2">
          <button className="rounded-xl border px-4 py-2" onClick={prev}>Back</button>
        </div>
      </div>
    );
  }

  // STEP 5: Seed (optional)
  if (st.stepIndex === 5) {
    return (
      <div className="space-y-3">
        <div className="text-lg font-semibold">One sentence (optional)</div>
        <div className="opacity-80">
          Add a seed sentence. You can also skip.
        </div>

        <input
          className="w-full rounded-2xl border p-3"
          value={st.seed ?? ""}
          onChange={(e) => set({ ...st, seed: clampSeed(e.target.value) })}
          placeholder="One sentence…"
        />

        <div className="flex gap-2">
          <button className="rounded-xl border px-4 py-2" onClick={prev}>Back</button>
          <button
            className="rounded-xl border px-4 py-2"
            onClick={() => set({ ...st, stepIndex: 6 })}
          >
            Generate
          </button>
        </div>
      </div>
    );
  }

  // STEP 6: Generate (rules-based now)
  if (st.stepIndex === 6) {
    const ready = hasType && hasTone && hasLength && hasAudience;
    const text = generateText(st);
    return (
      <div className="space-y-4">
        <div className="text-lg font-semibold">Result</div>

        <div className="rounded-2xl border p-4 whitespace-pre-wrap text-sm">
          {text}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-xl border px-4 py-2"
            onClick={() => {
              // Save result into state, mark done
              set({ ...st, result: text, status: "done", stepIndex: 7 });
            }}
          >
            Save result
          </button>
          <button className="rounded-xl border px-4 py-2" onClick={prev}>
            Back
          </button>
        </div>

        {!ready && (
          <div className="text-sm opacity-60">
            Note: some choices were “Not sure” — that’s fine for v0.1.
          </div>
        )}
      </div>
    );
  }

  // STEP 7: Saved (basic actions)
  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Saved</div>

      <div className="rounded-2xl border p-4 whitespace-pre-wrap text-sm">
        {st.result ?? "(empty)"}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-xl border px-4 py-2"
          onClick={() => {
            // Start over (branch later)
            set(newWritingState());
          }}
        >
          Create another
        </button>
        <button
          className="rounded-xl border px-4 py-2"
          onClick={() => {
            // Return to step 1 but keep state (edit choices)
            set({ ...st, stepIndex: 1, status: "draft" });
          }}
        >
          Edit choices
        </button>
      </div>
    </div>
  );
}
