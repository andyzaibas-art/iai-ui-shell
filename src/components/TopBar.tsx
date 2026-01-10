import { Menu } from "lucide-react";
import { Button } from "./ui/button";
import { useLayout } from "../contexts/LayoutContext";

export default function TopBar() {
  const { toggleLeftSidebar, toggleMobileMenu } = useLayout();

  return (
    <header className="flex h-14 items-center justify-between border-b border-neutral-900 bg-neutral-950 px-4">
      <div className="flex items-center gap-2">
        {/* Desktop */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLeftSidebar}
          className="hidden md:inline-flex h-9 w-9"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileMenu}
          className="md:hidden h-9 w-9"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="text-sm font-semibold tracking-wide">I•A•I</div>
      </div>

      <div className="hidden sm:flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/30 px-3 py-1 text-xs text-neutral-200">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Online
        </div>
        <div className="flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/30 px-3 py-1 text-xs text-neutral-200">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          Authorized
        </div>
      </div>
    </header>
  );
}
