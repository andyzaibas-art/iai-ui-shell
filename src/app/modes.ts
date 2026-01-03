export type AppMode = "home" | "world" | "projects";

export type WorldId =
  | "game"
  | "not_sure"
  | "planner"
  | "writing"
  | "video"
  | "app";

export type AppState = {
  mode: AppMode;
  activeWorld?: WorldId;
  activeProjectId?: string;
};
