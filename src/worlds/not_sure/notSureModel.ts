import { WorldId } from "../../app/modes";

export type NotSureMood = "fun" | "calm" | "curious" | "weird" | "unknown" | "custom";
export type NotSureTime = "5m" | "15m" | "no_rush" | "unknown" | "custom";
export type NotSureIntent = "game" | "planner" | "writing" | "unknown" | "custom";

export type NotSureState = {
  stepIndex: number;

  mood?: NotSureMood;
  time?: NotSureTime;
  intent?: NotSureIntent;

  customText?: string; // one sentence

  suggestion?: {
    worldId: WorldId;
    confidence: "low" | "medium";
  };
};

export function newNotSureState(): NotSureState {
  return { stepIndex: 0 };
}

export function clampOneSentence(s: string) {
  const cleaned = (s ?? "").replace(/\s+/g, " ").trim();
  // keep it short and safe
  return cleaned.slice(0, 160);
}

export function computeSuggestion(s: NotSureState): { worldId: WorldId; confidence: "low" | "medium" } {
  // Default strategy: fun first -> Game
  // If user clearly picked planner or writing, respect it.
  if (s.intent === "planner") return { worldId: "planner", confidence: "medium" };
  if (s.intent === "writing") return { worldId: "writing", confidence: "medium" };
  if (s.intent === "game") return { worldId: "game", confidence: "medium" };

  // Heuristics:
  if (s.mood === "fun") return { worldId: "game", confidence: "medium" };
  if (s.mood === "calm") return { worldId: "planner", confidence: "low" };
  if (s.mood === "curious") return { worldId: "game", confidence: "low" };

  // fallback
  return { worldId: "game", confidence: "low" };
}
