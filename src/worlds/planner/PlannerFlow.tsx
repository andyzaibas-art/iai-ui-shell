import { useMemo } from "react";
import {
  PlannerCategory,
  PlannerInputMode,
  PlannerState,
  PlannerVariant,
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
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      className={[
        "rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left disabled:opacity-50",
        active ? "ring-2 ring-white/25" : "",
      ].join(" ")}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function dateStr(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function endOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay(); // 0 Sun
  const delta = day === 0 ? 7 : 7 - day;
  x.setDate(x.getDate() + delta);
  return x;
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
  const isTaskList = inputMode === "task_list";
  const inputText = isTaskList ? st.taskListText ?? "" : st.missionText ?? "";

  const category: PlannerCategory = st.category ?? "unknown";
  const timeBudgetMinutes = st.timeBudgetMinutes;

  const deadlineType = st.deadlineType ?? "unknown";
  const hasDeadline = Boolean(st.deadlineDate) || deadlineType !== "unknown";
  const canNextDeadline = !hasDeadline || Boolean(st.deadlineDate);

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
        <div className="opacity-80">Write a mission or a task list — I will build a schedule.</div>
        <Btn onClick={() => set({ ...st, stepIndex: 1 })}>Start</Btn>
      </div>
    );
  }

  if (st.stepIndex === 1) {
    return (
      <div className="space-y-3">
        <div className="text-lg font-semibold">How do you want to enter it?</div>
        <Btn onClick={() => set({ ...st, inputMode: "mission_text", stepIndex: 2 })}>Quick text</Btn>
        <Btn onClick={() => set({ ...st, inputMode: "task_list", stepIndex: 2 })}>Task list</Btn>
      </div>
    );
  }

  if (st.stepIndex === 2) {
    return (
      <div className="space-y-3">
        <div className="text-lg font-semibold">
          {isTaskList ? "Enter tasks (one per line)" : "Enter a mission (1–2 lines)"}
        </div>

        <textarea
          className="w-full rounded-2xl border border-white/15 bg-white/5 p-3 min-h-[120px] text-white"
          value={inputText}
          onChange={(e) => {
            const v = e.target.value;
            set(isTaskList ? { ...st, taskListText: v } : { ...st, missionText: v });
          }}
          placeholder={
            isTaskList
              ? "Example:\nWrite draft\nBuy tickets\nCall the client"
              : "Example: Finish the proposal and send it by Friday."
          }
        />

        <div className="flex gap-2">
          <button className="rounded-xl border border-white/15 bg-white/5 px-4 py-2" onClick={prev}>
            Back
          </button>
          <button
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 disabled:opacity-50"
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

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Btn
            active={deadlineType === "today"}
            onClick={() => {
              const d = new Date();
              set({
                ...st,
                deadlineType: "today",
                deadlineDate: dateStr(d),
                deadlineTime: st.deadlineTime ?? "17:00",
              });
            }}
          >
            Today
          </Btn>

          <Btn
            active={deadlineType === "tomorrow"}
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              set({
                ...st,
                deadlineType: "tomorrow",
                deadlineDate: dateStr(d),
                deadlineTime: st.deadlineTime ?? "17:00",
              });
            }}
          >
            Tomorrow
          </Btn>

          <Btn
            active={deadlineType === "this_week"}
            onClick={() => {
              const d = endOfWeek(new Date());
              set({
                ...st,
                deadlineType: "this_week",
                deadlineDate: dateStr(d),
                deadlineTime: st.deadlineTime ?? "17:00",
              });
            }}
          >
            This week
          </Btn>

          <Btn
            active={deadlineType === "unknown" && !st.deadlineDate}
            onClick={() =>
              set({
                ...st,
                deadlineType: "unknown",
                deadlineDate: undefined,
                deadlineTime: undefined,
              })
            }
          >
            No deadline
          </Btn>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/5 p-4 space-y-2">
          <div className="text-sm font-semibold">Custom deadline</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="text-xs opacity-70">Date</div>
              <input
                className="w-full rounded-xl border border-white/15 bg-black/30 p-3 text-white"
                type="date"
                value={st.deadlineDate ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  set({
                    ...st,
                    deadlineType: v ? "date" : "unknown",
                    deadlineDate: v || undefined,
                  });
                }}
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs opacity-70">Time (optional)</div>
              <input
                className="w-full rounded-xl border border-white/15 bg-black/30 p-3 text-white"
                type="time"
                value={st.deadlineTime ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  set({
                    ...st,
                    deadlineType: st.deadlineDate ? "date" : (st.deadlineType ?? "unknown"),
                    deadlineTime: v || undefined,
                  });
                }}
              />
            </div>
          </div>

          <div className="text-xs opacity-60">Galima įrašyti tiesiai. Laikas neprivalomas.</div>
        </div>

        <div className="flex gap-2">
          <button className="rounded-xl border border-white/15 bg-white/5 px-4 py-2" onClick={prev}>
            Back
          </button>
          <button
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 disabled:opacity-50"
            onClick={next}
            disabled={!canNextDeadline}
          >
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

        <div className="rounded-2xl border border-white/15 bg-white/5 p-4 space-y-2">
          <div className="text-sm font-semibold">Custom time</div>
          <div className="text-xs opacity-70">Minutes (example: 75)</div>
          <input
            className="w-full rounded-xl border border-white/15 bg-black/30 p-3 text-white"
            type="number"
            min={5}
            step={5}
            value={timeBudgetMinutes ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw.trim() === "") {
                set({ ...st, timeBudgetMinutes: undefined });
                return;
              }
              const n = Number(raw);
              if (!Number.isFinite(n)) return;
              set({ ...st, timeBudgetMinutes: Math.max(5, Math.round(n)) });
            }}
            placeholder="60"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Btn active={timeBudgetMinutes === 30} onClick={() => set({ ...st, timeBudgetMinutes: 30 })}>
            30 min
          </Btn>
          <Btn active={timeBudgetMinutes === 60} onClick={() => set({ ...st, timeBudgetMinutes: 60 })}>
            1 hour
          </Btn>
          <Btn active={timeBudgetMinutes === 120} onClick={() => set({ ...st, timeBudgetMinutes: 120 })}>
            2 hours
          </Btn>
          <Btn active={timeBudgetMinutes === 240} onClick={() => set({ ...st, timeBudgetMinutes: 240 })}>
            4 hours
          </Btn>
          <Btn active={timeBudgetMinutes == null} onClick={() => set({ ...st, timeBudgetMinutes: undefined })}>
            I don’t know
          </Btn>
        </div>

        <div className="flex gap-2">
          <button className="rounded-xl border border-white/15 bg-white/5 px-4 py-2" onClick={prev}>
            Back
          </button>
          <button className="rounded-xl border border-white/15 bg-white/5 px-4 py-2" onClick={next}>
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
        <div className="text-xs opacity-70">Pasirinkus iškart bus sugeneruotas planas.</div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Btn active={category === "work"} onClick={() => set({ ...st, category: "work", stepIndex: 6 })}>
            Work
          </Btn>
          <Btn active={category === "life"} onClick={() => set({ ...st, category: "life", stepIndex: 6 })}>
            Life
          </Btn>
          <Btn active={category === "create"} onClick={() => set({ ...st, category: "create", stepIndex: 6 })}>
            Create
          </Btn>
          <Btn active={category === "unknown"} onClick={() => set({ ...st, category: "unknown", stepIndex: 6 })}>
            Not sure
          </Btn>
        </div>

        <div className="flex gap-2">
          <button className="rounded-xl border border-white/15 bg-white/5 px-4 py-2" onClick={prev}>
            Back
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

        <div className="text-xs opacity-70">
          Category: <span className="opacity-90">{category}</span>{" · "}
          Time: <span className="opacity-90">{st.timeBudgetMinutes ?? "unknown"}m</span>{" · "}
          Deadline:{" "}
          <span className="opacity-90">
            {st.deadlineDate ? `${st.deadlineDate}${st.deadlineTime ? " " + st.deadlineTime : ""}` : "none"}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <Btn onClick={() => set({ ...st, variants: { A: planA, B: planB, active: "A" }, stepIndex: 7 })}>
            Variant A
          </Btn>
          <Btn onClick={() => set({ ...st, variants: { A: planA, B: planB, active: "B" }, stepIndex: 7 })}>
            Variant B
          </Btn>
        </div>

        <div className="flex gap-2">
          <button className="rounded-xl border border-white/15 bg-white/5 px-4 py-2" onClick={prev}>
            Back
          </button>
        </div>
      </div>
    );
  }

  const activeKey = (st.variants?.active ?? "A") as "A" | "B";
  const active: PlannerVariant =
    (activeKey === "B" ? st.variants?.B : st.variants?.A) ?? { blocks: [], tasks: [] };

  function setActiveVariant(nextVar: PlannerVariant) {
    const nextVariants = {
      ...(st.variants ?? {}),
      [activeKey]: nextVar,
      active: activeKey,
    } as PlannerState["variants"];
    set({ ...st, variants: nextVariants });
  }

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Schedule</div>

      <div className="space-y-3">
        {active.blocks.map((b) => (
          <div key={b.id} className="rounded-2xl border border-white/15 bg-white/5 p-4">
            <div className="font-semibold">{b.title}</div>
            <div className="text-sm opacity-70">
              {formatHm(b.start)} – {formatHm(b.end)} · {b.category}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="rounded-xl border border-white/15 bg-black/30 px-3 py-2"
                onClick={() => {
                  const updatedBlocks = active.blocks.map((x) => (x.id === b.id ? shiftBlockMinutes(x, -15) : x));
                  setActiveVariant({ ...active, blocks: updatedBlocks });
                }}
              >
                ← 15m
              </button>

              <button
                className="rounded-xl border border-white/15 bg-black/30 px-3 py-2"
                onClick={() => {
                  const updatedBlocks = active.blocks.map((x) => (x.id === b.id ? shiftBlockMinutes(x, 15) : x));
                  setActiveVariant({ ...active, blocks: updatedBlocks });
                }}
              >
                15m →
              </button>

              <button
                className="rounded-xl border border-white/15 bg-black/30 px-3 py-2"
                onClick={() => {
                  const updatedBlocks = active.blocks.map((x) => (x.id === b.id ? resizeBlockMinutes(x, -15) : x));
                  setActiveVariant({ ...active, blocks: updatedBlocks });
                }}
              >
                -15m
              </button>

              <button
                className="rounded-xl border border-white/15 bg-black/30 px-3 py-2"
                onClick={() => {
                  const updatedBlocks = active.blocks.map((x) => (x.id === b.id ? resizeBlockMinutes(x, 15) : x));
                  setActiveVariant({ ...active, blocks: updatedBlocks });
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
            <div
              key={t.id}
              className="rounded-2xl border border-white/15 bg-white/5 p-3 flex items-center justify-between"
            >
              <div>
                <div className="font-semibold">{t.title}</div>
                <div className="text-sm opacity-70">
                  {t.scheduledStart && t.scheduledEnd ? `${formatHm(t.scheduledStart)}–${formatHm(t.scheduledEnd)}` : ""}
                  {t.estMinutes ? ` · ~${t.estMinutes}m` : ""}
                </div>
              </div>

              <button
                className="rounded-xl border border-white/15 bg-black/30 px-3 py-2"
                onClick={() => {
                  const updatedTasks = active.tasks.map((x) =>
                    x.id === t.id ? { ...x, status: x.status === "done" ? "planned" : "done" } : x
                  );
                  setActiveVariant({ ...active, tasks: updatedTasks });
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
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2"
          onClick={() => set({ ...st, stepIndex: 1, variants: undefined })}
        >
          Create a new plan
        </button>

        <button
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 disabled:opacity-50"
          disabled={!st.variants?.A || !st.variants?.B}
          onClick={() => {
            const nextKey = activeKey === "A" ? "B" : "A";
            set({ ...st, variants: { ...(st.variants ?? {}), active: nextKey } });
          }}
        >
          Switch variant
        </button>
      </div>
    </div>
  );
}
