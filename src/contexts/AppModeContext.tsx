import { createContext, useContext, useState, type ReactNode } from "react";

export type AppMode = "onboarding" | "chat";
export type ProjectType = "game" | "video" | "app" | "writing" | "not sure" | null;

interface AppModeContextType {
  mode: AppMode;
  projectType: ProjectType;
  transitionToChat: (selectedOption: ProjectType) => void;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>("onboarding");
  const [projectType, setProjectType] = useState<ProjectType>(null);

  const transitionToChat = (selectedOption: ProjectType) => {
    setProjectType(selectedOption);

    // užtikrinam, kad po onboarding visada patektum į /chat
    try {
      window.history.replaceState({}, "", "/chat");
    } catch {}

    setMode("chat");
  };

  return (
    <AppModeContext.Provider value={{ mode, projectType, transitionToChat }}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error("useAppMode must be used within AppModeProvider");
  return ctx;
}
