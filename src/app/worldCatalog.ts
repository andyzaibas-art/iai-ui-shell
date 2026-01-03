import type { WorldId } from "./modes";

export type WorldMeta = {
  id: WorldId;
  label: string;
  enabled: boolean; // false = dim + no click
  iconText?: string; // emoji fallback
  iconSrc?: string; // optional svg in /public
};

export const WORLD_DEFAULT_ORDER: WorldId[] = [
  "game",
  "not_sure",
  "planner",
  "writing",
  "video",
  "app",
];

export const WORLD_CATALOG: Record<WorldId, WorldMeta> = {
  game: {
    id: "game",
    label: "Game",
    enabled: true,
    iconSrc: "/icons/worlds/game.svg",
    iconText: "🎮",
  },
  not_sure: {
    id: "not_sure",
    label: "Not sure",
    enabled: true,
    iconSrc: "/icons/worlds/not_sure.svg",
    iconText: "❓",
  },
  planner: {
    id: "planner",
    label: "Planner",
    enabled: true,
    iconSrc: "/icons/worlds/planner.svg",
    iconText: "🗓️",
  },
  writing: {
    id: "writing",
    label: "Writing",
    enabled: true,
    iconSrc: "/icons/worlds/writing.svg",
    iconText: "✍️",
  },
  video: {
    id: "video",
    label: "Video",
    enabled: false,
    iconText: "🎥",
  },
  app: {
    id: "app",
    label: "App / Tool",
    enabled: false,
    iconText: "🛠️",
  },
};
