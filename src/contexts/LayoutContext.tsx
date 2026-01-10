import { createContext, useContext, useState, type ReactNode } from "react";

interface LayoutContextType {
  isLeftSidebarOpen: boolean;
  toggleLeftSidebar: () => void;

  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleLeftSidebar = () => setIsLeftSidebarOpen((p) => !p);
  const toggleMobileMenu = () => setIsMobileMenuOpen((p) => !p);

  return (
    <LayoutContext.Provider
      value={{
        isLeftSidebarOpen,
        toggleLeftSidebar,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        toggleMobileMenu,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout must be used within LayoutProvider");
  return ctx;
}
