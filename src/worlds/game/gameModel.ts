export type GameChoice = {
  label: string;
  to: string;
};

export type GameNode = {
  id: string;
  title: string;
  body: string;
  choices: GameChoice[];
  isEnd?: boolean;
};

export type GameDraft = {
  title?: string;
  hero?: string;
  setting?: string;
  goal?: string;
  twist?: string;
  tone?: "fun" | "focus" | "mystery";
};

export type GameMode = "play" | "create";

export type GameState = {
  mode?: GameMode;
  nodeId: string;
  history: { nodeId: string; choiceLabel: string }[];
  draft?: GameDraft;
  story?: Record<string, GameNode>;
};

export function newGameState(): GameState {
  return {
    mode: "play",
    nodeId: "start",
    history: [],
    draft: { tone: "mystery" },
  };
}

// Built-in story (fallback). Keep it short, fun, universal.
export const GAME_STORY: Record<string, GameNode> = {
  start: {
    id: "start",
    title: "The Door",
    body:
      "You find a glowing door in the middle of a quiet street. A small sign says: “Choose wisely.”",
    choices: [
      { label: "Open the door", to: "inside" },
      { label: "Walk around it", to: "around" },
      { label: "Knock politely", to: "knock" },
    ],
  },

  knock: {
    id: "knock",
    title: "Knock Knock",
    body:
      "A tiny voice answers: “Password?” You don't know it… but you can try something.",
    choices: [
      { label: "Say: “Friend”", to: "friend" },
      { label: "Say: “Please”", to: "please" },
      { label: "Run away laughing", to: "run" },
    ],
  },

  friend: {
    id: "friend",
    title: "Friend",
    body:
      "The door clicks! It likes that word. A warm light spills out, like a sunrise in a box.",
    choices: [
      { label: "Step inside", to: "inside" },
      { label: "Ask what's inside", to: "ask" },
    ],
  },

  please: {
    id: "please",
    title: "Please",
    body:
      "The door doesn't open, but the sign changes to: “Good manners detected.” A small key appears.",
    choices: [
      { label: "Use the key", to: "inside" },
      { label: "Pocket the key and leave", to: "leave_key" },
    ],
  },

  around: {
    id: "around",
    title: "Around the Door",
    body:
      "Behind the door you find a map drawn in chalk. It shows three paths: Sky, City, Forest.",
    choices: [
      { label: "Sky path", to: "sky" },
      { label: "City path", to: "city" },
      { label: "Forest path", to: "forest" },
    ],
  },

  inside: {
    id: "inside",
    title: "Inside",
    body:
      "Inside is a control room with three buttons: FUN, FOCUS, and MYSTERY. You can press only one.",
    choices: [
      { label: "FUN", to: "fun_end" },
      { label: "FOCUS", to: "focus_end" },
      { label: "MYSTERY", to: "mystery_end" },
    ],
  },

  ask: {
    id: "ask",
    title: "A Question",
    body:
      "A calm voice says: “This place becomes what you choose.” The buttons glow brighter.",
    choices: [
      { label: "Press FUN", to: "fun_end" },
      { label: "Press FOCUS", to: "focus_end" },
      { label: "Press MYSTERY", to: "mystery_end" },
    ],
  },

  run: {
    id: "run",
    title: "Giggle Escape",
    body:
      "You run away laughing. The door laughs too. Somehow… you feel a little braver than before.",
    choices: [{ label: "Play again", to: "start" }],
    isEnd: true,
  },

  leave_key: {
    id: "leave_key",
    title: "The Key",
    body:
      "You keep the key. Maybe you'll need it later. The door fades, but the key stays in your hand.",
    choices: [{ label: "Play again", to: "start" }],
    isEnd: true,
  },

  sky: {
    id: "sky",
    title: "Sky Path",
    body:
      "You climb invisible stairs into the sky. A cloud offers you a crown made of rainbows.",
    choices: [
      { label: "Wear the crown", to: "mystery_end" },
      { label: "Give it to someone else", to: "focus_end" },
    ],
  },

  city: {
    id: "city",
    title: "City Path",
    body:
      "In the city you find a robot that lost its schedule. It asks: “Can you help me plan my day?”",
    choices: [
      { label: "Help the robot", to: "focus_end" },
      { label: "Tell a joke first", to: "fun_end" },
    ],
  },

  forest: {
    id: "forest",
    title: "Forest Path",
    body:
      "In the forest, a friendly owl gives you a notebook and says: “Write the next line.”",
    choices: [
      { label: "Write a brave line", to: "focus_end" },
      { label: "Write a silly line", to: "fun_end" },
    ],
  },

  fun_end: {
    id: "fun_end",
    title: "FUN Ending",
    body:
      "You chose FUN. The room turns into a tiny carnival. You win a badge: “Joy Builder.”",
    choices: [{ label: "Play again", to: "start" }],
    isEnd: true,
  },

  focus_end: {
    id: "focus_end",
    title: "FOCUS Ending",
    body:
      "You chose FOCUS. The room becomes calm and clear. You win a badge: “Mission Finisher.”",
    choices: [{ label: "Play again", to: "start" }],
    isEnd: true,
  },

  mystery_end: {
    id: "mystery_end",
    title: "MYSTERY Ending",
    body:
      "You chose MYSTERY. A hidden door appears, and a new story begins… You win a badge: “Explorer.”",
    choices: [{ label: "Play again", to: "start" }],
    isEnd: true,
  },
};

export function getNode(id: string, story?: Record<string, GameNode>): GameNode {
  const g = story ?? GAME_STORY;
  return g[id] ?? g["start"];
}

export function applyChoice(state: GameState, choice: GameChoice): GameState {
  return {
    ...state,
    nodeId: choice.to,
    history: [...state.history, { nodeId: state.nodeId, choiceLabel: choice.label }],
  };
}

function t(s?: string) {
  return (s ?? "").trim();
}

export function generateStory(draft: GameDraft): Record<string, GameNode> {
  const title = t(draft.title) || "The Choice";
  const hero = t(draft.hero) || "You";
  const setting = t(draft.setting) || "a quiet unknown place";
  const goal = t(draft.goal) || "reach something important";
  const twist = t(draft.twist);
  const tone = draft.tone ?? "mystery";

  const mood =
    tone === "fun"
      ? "Everything feels playful, like the world is winking at you."
      : tone === "focus"
      ? "Everything feels sharp and clear. Every step matters."
      : "Something hidden is watching. Small details feel important.";

  const twistLine = twist ? `\n\nTwist: ${twist}` : "";

  const start: GameNode = {
    id: "start",
    title,
    body: `${hero} is in ${setting}.\n\nGoal: ${goal}.\n\n${mood}${twistLine}`,
    choices: [
      { label: "Take the direct path", to: "path_a" },
      { label: "Ask for help first", to: "path_b" },
      { label: "Try a risky shortcut", to: "path_c" },
    ],
  };

  const pathA: GameNode = {
    id: "path_a",
    title: "Direct Path",
    body:
      "You move straight toward your goal. The road answers with one question: how steady are you today?",
    choices: [{ label: "Keep going", to: "end_a" }],
  };

  const pathB: GameNode = {
    id: "path_b",
    title: "A Helping Hand",
    body:
      "You stop and ask. Someone (or something) offers guidance — but it wants a promise in return.",
    choices: [{ label: "Accept the guidance", to: "end_b" }],
  };

  const pathC: GameNode = {
    id: "path_c",
    title: "Shortcut",
    body:
      "You take the shortcut. It’s faster… and stranger. You feel the world bend slightly around your decision.",
    choices: [{ label: "Commit to the shortcut", to: "end_c" }],
  };

  const endA: GameNode = {
    id: "end_a",
    title: "Ending: Discipline",
    body: "You arrive by pure discipline. It wasn’t easy, but it was yours.",
    choices: [{ label: "Play again", to: "start" }],
    isEnd: true,
  };

  const endB: GameNode = {
    id: "end_b",
    title: "Ending: Alliance",
    body: "You arrive with help — and you don’t forget who stood with you.",
    choices: [{ label: "Play again", to: "start" }],
    isEnd: true,
  };

  const endC: GameNode = {
    id: "end_c",
    title: "Ending: Wild Card",
    body: "You arrive through chaos. The reward feels bigger… and a bit dangerous.",
    choices: [{ label: "Play again", to: "start" }],
    isEnd: true,
  };

  return {
    start,
    path_a: pathA,
    path_b: pathB,
    path_c: pathC,
    end_a: endA,
    end_b: endB,
    end_c: endC,
  };
}
