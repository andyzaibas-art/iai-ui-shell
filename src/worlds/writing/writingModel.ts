export type WritingType = "story" | "letter" | "description" | "script" | "unknown";
export type WritingTone = "warm" | "serious" | "funny" | "neutral" | "unknown";
export type WritingLength = "short" | "medium" | "long" | "unknown";
export type WritingAudience = "me" | "child" | "adult" | "everyone" | "unknown";

export type WritingState = {
  stepIndex: number;

  type?: WritingType;
  tone?: WritingTone;
  length?: WritingLength;
  audience?: WritingAudience;

  seed?: string; // optional short seed
  result?: string;

  status?: "draft" | "done";
};

export function newWritingState(): WritingState {
  return { stepIndex: 0, status: "draft" };
}

export function clampSeed(s: string) {
  const cleaned = (s ?? "").replace(/\s+/g, " ").trim();
  return cleaned.slice(0, 160);
}

function titleFor(t: WritingType) {
  switch (t) {
    case "story":
      return "Story";
    case "letter":
      return "Letter";
    case "description":
      return "Description";
    case "script":
      return "Script";
    default:
      return "Writing";
  }
}

function toneHint(t: WritingTone) {
  switch (t) {
    case "warm":
      return "warm";
    case "serious":
      return "serious";
    case "funny":
      return "funny";
    case "neutral":
      return "neutral";
    default:
      return "clear";
  }
}

function audienceHint(a: WritingAudience) {
  switch (a) {
    case "child":
      return "for a child";
    case "adult":
      return "for an adult";
    case "everyone":
      return "for everyone";
    case "me":
      return "for me";
    default:
      return "for the reader";
  }
}

function lengthHint(l: WritingLength) {
  switch (l) {
    case "short":
      return "short";
    case "medium":
      return "medium-length";
    case "long":
      return "long";
    default:
      return "short";
  }
}

// v0.1 rules-based generator (no AI yet)
export function generateText(s: WritingState): string {
  const t = s.type ?? "unknown";
  const tone = s.tone ?? "unknown";
  const len = s.length ?? "unknown";
  const aud = s.audience ?? "unknown";

  const title = titleFor(t);
  const seed = (s.seed ?? "").trim();

  const header = `${title} (${toneHint(tone)}, ${lengthHint(len)}, ${audienceHint(aud)})`;

  const seedLine = seed ? `Seed: ${seed}\n\n` : "";

  // simple body template
  const bodyShort = `This is a ${toneHint(tone)} ${title.toLowerCase()} ${audienceHint(aud)}.\n` +
    `It starts clearly and stays focused.\n` +
    `It ends with a clean finish.\n`;

  const bodyMedium = bodyShort +
    `\nA little more detail is added to make it feel real.\n` +
    `The middle stays calm, then moves toward the end.\n`;

  const bodyLong = bodyMedium +
    `\nExtra depth: a second perspective, a small twist, and a stronger closing.\n` +
    `The final lines feel complete and memorable.\n`;

  const body =
    len === "long" ? bodyLong : len === "medium" ? bodyMedium : bodyShort;

  // If it's a letter, add greeting/closing
  if (t === "letter") {
    return (
      `${header}\n\n` +
      seedLine +
      `Hello,\n\n` +
      body +
      `\nSincerely,\n`
    );
  }

  // If it's a script, add scene formatting
  if (t === "script") {
    return (
      `${header}\n\n` +
      seedLine +
      `SCENE 1 — INT. QUIET ROOM — DAY\n\n` +
      `NARRATOR: ${body.replace(/\n/g, " ")}\n`
    );
  }

  return `${header}\n\n${seedLine}${body}`;
}
