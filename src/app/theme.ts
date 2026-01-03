export type ThemeMode = "auto" | "dark" | "light";

const KEY = "iai_theme_mode_v1";

export function loadThemeMode(): ThemeMode {
  const raw = localStorage.getItem(KEY);
  if (raw === "dark" || raw === "light" || raw === "auto") return raw;
  return "auto";
}

export function saveThemeMode(mode: ThemeMode) {
  localStorage.setItem(KEY, mode);
}

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;

  const setDark = (isDark: boolean) => {
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  };

  if (mode === "dark") {
    setDark(true);
    return;
  }
  if (mode === "light") {
    setDark(false);
    return;
  }

  // auto: follow system
  const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
  setDark(!!mq?.matches);
}

export function watchSystemTheme(onChange: (isDark: boolean) => void) {
  const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (!mq) return () => {};

  const handler = () => onChange(!!mq.matches);

  // Safari compatibility
  if ("addEventListener" in mq) {
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }

  // @ts-expect-error legacy
  mq.addListener(handler);
  // @ts-expect-error legacy
  return () => mq.removeListener(handler);
}

