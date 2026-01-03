import { useMemo } from "react";
import {
  PlannerCategory,
  PlannerInputMode,
  PlannerState,
  buildPlan,
  formatHm,
  resizeBlockMinutes,
  shiftBlockMinutes,
  newPlannerState,
} from "./plannerModel";

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

export default function PlannerFlow({
  value,
  onChange,
}: {
  value?: PlannerState;
  onChange: (next: PlannerState) => void;
}) {
  const st = value ?? newPlannerState();

  const inputMode: PlannerInputMode | undefined = st.inputMode;
  const inputText =
    inputMode === "task_list" ? st.taskListText ?? "" : st.missionText ?? "";

  const category: PlannerCategory = st.category ?? "unknown";

  const canGoNextFromInput = useMemo(() => {
    if (!inputMode) return false;
    return inputText.trim().length > 0;
  }, [inputMode, inputText]);

  function set(next: PlannerState) {
    onChange(next);
  }
  function next() {
    set({ ...st, stepIndex: st.stepIndex + 1 });
  }
  function prev() {
    set({ ...st, stepIndex: Math.max(0, st.stepIndex - 1) });
  }

  if (st.stepIndex === 0) {
    return (
      <div className="space-y-4">
        <div className="text-xl font-semibold">Personal Planner</div>
        <div className="opacity-80">
          Write a mission or a task list — I will build a schedule.
        </div>
        <Btn onClick={() => set({ ...st, stepIndex: 1 })}>Start</Btn>
      </div>
    );
  }

  if (st.stepIndex === 1) {
    return (
      <div className="space-y-3">
        <div className="text-lg font-semibold">How do you want to enter it?</div>
        <Btn onClick={() => set({ ...st, inputMode: "mission_text", stepIndex: 2 })}>
          Quick text
        </Btn>
        <Btn onClick={() => set({ ...st, inputMode: "task_list", stepIndex: 2 })}>
          Task list
        </Btn>
      </div>
    );
  }

  if (st.stepIndex === 2) {
    const isTaskList = inputMode === "task_list";
    return (
      <div className="space-y-3">
        <div className="text-lg font-semibold">
          {isTaskList ? "Enter tasks (one per line)" : "Enter a mission (1–2 lines)"}
        </div>

        <textarea
          className="w-full rounded-2xl border p-3 min-h-[120px]"
          value={inputText}
          onChange={(e) => {
            const v = e.target.value;
            set(isTaskList ? { ...st, taskListText: v } : { ...st, missionText: v });
          }}
          placeholder={
            isTaskList
              ? "Example:\nWrite draft\nBuy tickets\nCall the client"
              : "Example: Write an article and book a trip by Friday."
          }
        />

        <div className="flex gap-2">
          <button className="rounded-xl border px-4 py-2" onClick={prev}>
            Back
          </button>
          <button
            className="rounded-xl border px-4 py-2"
            onClick={next}
            disabled={!canGoNextFromInput}
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  if (st.stepIndex === 3) {
    return (
      <div className="space-y-3">
        <div className="text-lg font-semibold">When is the deadline?</div>

        <Btn onClick={() => set({ ...st, deadlineType: "today" })}>Today</Btn>
        <Btn onClick={() => set({ ...st, deadlineType: "tomorrow" })}>Tomorrow</Btn>
        <Btn onClick={() => set({ ...st, deadlineType: "this_week" })}>This week</Btn>
        <Btn onClick={() => set({ ...st, deadlineType: "date" })}>Pick a date</Btn>
        <Btn onClick={() => set({ ...st, deadlineType: "unknown" })}>I don't know</Btn>

        {st.deadlineType === "date" && (
          <input
            className="w-full rounded-2xl border p-3"
            type="date"
            value={st.deadlineDate ?? ""}
            onChange={(e) => set({ ...st, deadlineDate: e.target.value })}
          />
        )}

        <div className="flex gap-2">
          <button className="rounded-xl border px-4 py-2" onClick={prev}>
            Back
          </button>
          <button className="rounded-xl border px-4 py-2" onClick={next}>
            Next
          </button>
        </div>
      </div>
    );
  }

  if (st.stepIndex === 4) {
    return (
      <div className="space-y-3">
        <div className="text-lg font-semibold">How much time do you have?</div>

        <Btn onClick={() => set({ ...st, timeBudgetMinutes: 30 })}>30 min</Btn>
        <Btn onClick={() => set({ ...st, timeBudgetMinutes: 60 })}>1 hour</Btn>
        <Btn onClick={() => set({ ...st, timeBudgetMinutes: 120 })}>2 hours</Btn>
        <Btn onClick={() => set({ ...st, timeBudgetMinutes: 240 })}>4 hours</Btn>
        <Btn onClick={() => set({ ...st, timeBudgetMinutes: undefined })}>I don't know</Btn>

        <div className="flex gap-2">
          <button className="rounded-xl border px-4 py-2" onClick={prev}>
            Back
          </button>
          <button className="rounded-xl border px-4 py-2" onClick={next}>
            Next
          </button>
        </div>
      </div>
    );
  }

  if (st.stepIndex === 5) {
    return (
      <div className="space-y-3">
        <div className="text-lg font-semibold">What matters most?</div>

        <Btn onClick={() => set({ ...st, category: "work" })}>Work</Btn>
        <Btn onClick={() => set({ ...st, category: "life" })}>Life</Btn>
        <Btn onClick={() => set({ ...st, category: "create" })}>Create</Btn>
        <Btn onClick={() => set({ ...st, category: "unknown" })}>Not sure</Btn>

        <div className="flex gap-2">
          <button className="rounded-xl border px-4 py-2" onClick={prev}>
            Back
          </button>
          <button
            className="rounded-xl border px-4 py-2"
            onClick={() => set({ ...st, stepIndex: 6 })}
          >
            Build plan
          </button>
        </div>
      </div>
    );
  }

  if (st.stepIndex === 6) {
    const mode = st.inputMode ?? "mission_text";
    const text = (mode === "task_list" ? st.taskListText : st.missionText) ?? "";

    const planA = buildPlan({
      inputMode: mode,
      text,
      category,
      timeBudgetMinutes: st.timeBudgetMinutes,
    });

    const planB = buildPlan({
      inputMode: mode,
      text,
      category,
      timeBudgetMinutes: Math.max(30, (st.timeBudgetMinutes ?? 60) + 30),
    });

    return (
      <div className="space-y-4">
        <div className="text-lg font-semibold">I built a plan</div>

        <div className="flex flex-col gap-2">
          <Btn onClick={() => set({ ...st, variants: { A: planA, B: planB, active: "A" }, stepIndex: 7 })}>
            Variant A
          </Btn>
          <Btn onClick={() => set({ ...st, variants: { A: planA, B: planB, active: "B" }, stepIndex: 7 })}>
            Variant B
          </Btn>
        </div>

        <div className="flex gap-2">
          <button className="rounded-xl border px-4 py-2" onClick={prev}>
            Back
          </button>
        </div>
      </div>
    );
  }

  const activeKey = st.variants?.active ?? "A";
  const active =
    (activeKey === "B" ? st.variants?.B : st.variants?.A) ?? { blocks: [], tasks: [] };

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Schedule</div>

      <div className="space-y-3">
        {active.blocks.map((b) => (
          <div key={b.id} className="rounded-2xl border p-4">
            <div className="font-semibold">{b.title}</div>
            <div className="text-sm opacity-70">
              {formatHm(b.start)} – {formatHm(b.end)} · {b.category}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="rounded-xl border px-3 py-2"
                onClick={() => {
                  const updatedBlocks = active.blocks.map((x) =>
                    x.id === b.id ? shiftBlockMinutes(x, -15) : x
                  );
                  set({ ...st, variants: { ...st.variants, [activeKey]: { ...active, blocks: updatedBlocks } } });
                }}
              >
                ← 15m
              </button>

              <button
                className="rounded-xl border px-3 py-2"
                onClick={() => {
                  const updatedBlocks = active.blocks.map((x) =>
                    x.id === b.id ? shiftBlockMinutes(x, 15) : x
                  );
                  set({ ...st, variants: { ...st.variants, [activeKey]: { ...active, blocks: updatedBlocks } } });
                }}
              >
                15m →
              </button>

              <button
                className="rounded-xl border px-3 py-2"
                onClick={() => {
                  const updatedBlocks = active.blocks.map((x) =>
                    x.id === b.id ? resizeBlockMinutes(x, -15) : x
                  );
                  set({ ...st, variants: { ...st.variants, [activeKey]: { ...active, blocks: updatedBlocks } } });
                }}
              >
                -15m
              </button>

              <button
                className="rounded-xl border px-3 py-2"
                onClick={() => {
                  const updatedBlocks = active.blocks.map((x) =>
                    x.id === b.id ? resizeBlockMinutes(x, 15) : x
                  );
                  set({ ...st, variants: { ...st.variants, [activeKey]: { ...active, blocks: updatedBlocks } } });
                }}
              >
                +15m
              </button>
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="text-lg font-semibold">Tasks</div>
        <div className="mt-2 space-y-2">
          {active.tasks.map((t) => (
            <div key={t.id} className="rounded-2xl border p-3 flex items-center justify-between">
              <div>
                <div className="font-semibold">{t.title}</div>
                <div className="text-sm opacity-70">
                  {t.scheduledStart && t.scheduledEnd
                    ? `${formatHm(t.scheduledStart)}–${formatHm(t.scheduledEnd)}`
                    : ""}
                  {t.estMinutes ? ` · ~${t.estMinutes}m` : ""}
                </div>
              </div>
              <button
                className="rounded-xl border px-3 py-2"
                onClick={() => {
                  const updatedTasks = active.tasks.map((x) =>
                    x.id === t.id
                      ? { ...x, status: x.status === "done" ? "planned" : "done" }
                      : x
                  );
                  set({ ...st, variants: { ...st.variants, [activeKey]: { ...active, tasks: updatedTasks } } });
                }}
              >
                {t.status === "done" ? "Undo" : "Done"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 flex gap-2 flex-wrap">
        <button
          className="rounded-xl border px-4 py-2"
          onClick={() => set({ ...st, stepIndex: 1, variants: undefined })}
        >
          Create a new plan
        </button>

        <button
          className="rounded-xl border px-4 py-2"
          onClick={() => {
            const nextKey = activeKey === "A" ? "B" : "A";
            set({ ...st, variants: { ...st.variants, active: nextKey as "A" | "B" } });
          }}
          disabled={!st.variants?.A || !st.variants?.B}
        >
          Switch variant
        </button>
      </div>
    </div>
  );
}
