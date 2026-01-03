export type PlannerInputMode = "mission_text" | "task_list";

export type PlannerCategory = "work" | "life" | "create" | "unknown";

export type PlannerDeadlineType =
  | "today"
  | "tomorrow"
  | "this_week"
  | "date"
  | "unknown";

export type PlannerTaskStatus = "planned" | "done" | "skipped";

export type PlannerTask = {
  id: string;
  title: string;
  status: PlannerTaskStatus;
  estMinutes?: number;
  scheduledStart?: string; // ISO local
  scheduledEnd?: string; // ISO local
};

export type PlannerBlock = {
  id: string;
  title: string;
  start: string; // ISO local
  end: string; // ISO local
  category: PlannerCategory;
};

export type PlannerVariant = {
  blocks: PlannerBlock[];
  tasks: PlannerTask[];
};

export type PlannerState = {
  stepIndex: number;

  inputMode?: PlannerInputMode;
  missionText?: string;
  taskListText?: string;

  deadlineType?: PlannerDeadlineType;
  deadlineDate?: string; // YYYY-MM-DD
  timeBudgetMinutes?: number;
  category?: PlannerCategory;

  variants?: {
    A?: PlannerVariant;
    B?: PlannerVariant;
    active?: "A" | "B";
  };
};

export function newPlannerState(): PlannerState {
  return { stepIndex: 0 };
}

export function genId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function splitTasksFromText(inputMode: PlannerInputMode, text: string): string[] {
  const cleaned = (text ?? "").trim();
  if (!cleaned) return [];
  if (inputMode === "task_list") {
    return cleaned
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 20);
  }
  // mission_text -> one task line
  return [cleaned.slice(0, 200)];
}

function toLocalIso(d: Date) {
  // Local ISO without timezone "Z"
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatHm(isoLocal: string) {
  // isoLocal like 2025-12-30T18:15:00
  const hm = isoLocal.split("T")[1]?.slice(0, 5) ?? "";
  return hm;
}

export function buildPlan(params: {
  inputMode: PlannerInputMode;
  text: string;
  category: PlannerCategory;
  timeBudgetMinutes?: number;
}): PlannerVariant {
  const titles = splitTasksFromText(params.inputMode, params.text);
  const tasks: PlannerTask[] = titles.map((t) => ({
    id: genId("task"),
    title: t,
    status: "planned",
  }));

  const budget = params.timeBudgetMinutes ?? 60;
  const perTask = tasks.length > 0 ? Math.max(15, Math.floor(budget / tasks.length)) : 30;

  // Start at next 15-minute slot
  const start = new Date();
  start.setSeconds(0);
  const m = start.getMinutes();
  const rounded = Math.ceil(m / 15) * 15;
  start.setMinutes(rounded === 60 ? 0 : rounded);
  if (rounded === 60) start.setHours(start.getHours() + 1);

  const blocks: PlannerBlock[] = [];
  let cursor = new Date(start);

  if (tasks.length === 0) {
    // fallback single block
    const end = new Date(cursor);
    end.setMinutes(end.getMinutes() + budget);
    blocks.push({
      id: genId("block"),
      title: "Focus block",
      start: toLocalIso(cursor),
      end: toLocalIso(end),
      category: params.category,
    });
  } else {
    for (const task of tasks) {
      const end = new Date(cursor);
      end.setMinutes(end.getMinutes() + perTask);

      const sIso = toLocalIso(cursor);
      const eIso = toLocalIso(end);

      blocks.push({
        id: genId("block"),
        title: task.title,
        start: sIso,
        end: eIso,
        category: params.category,
      });

      task.estMinutes = perTask;
      task.scheduledStart = sIso;
      task.scheduledEnd = eIso;

      cursor = new Date(end);
      // add 5 min buffer
      cursor.setMinutes(cursor.getMinutes() + 5);
    }
  }

  return { blocks, tasks };
}

export function shiftBlockMinutes(block: PlannerBlock, minutes: number): PlannerBlock {
  const start = new Date(block.start);
  const end = new Date(block.end);
  start.setMinutes(start.getMinutes() + minutes);
  end.setMinutes(end.getMinutes() + minutes);
  return { ...block, start: toLocalIso(start), end: toLocalIso(end) };
}

export function resizeBlockMinutes(block: PlannerBlock, deltaMinutes: number): PlannerBlock {
  const start = new Date(block.start);
  const end = new Date(block.end);
  end.setMinutes(end.getMinutes() + deltaMinutes);
  if (end <= start) {
    end.setMinutes(start.getMinutes() + 5);
  }
  return { ...block, end: toLocalIso(end) };
}
