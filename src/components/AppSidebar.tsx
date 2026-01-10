import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  MessageSquare,
  PenLine,
  Search,
  History,
  FileText,
  Settings,
  HelpCircle,
} from "lucide-react";
import { useLayout } from "../contexts/LayoutContext";

const mainNavItems = [
  { title: "Home", icon: Home, path: "/chat" },
  { title: "Chat", icon: MessageSquare, path: "/chat" },
  { title: "Write", icon: PenLine, path: "/write" },
  { title: "Search", icon: Search, path: "/search" },
  { title: "History", icon: History, path: "/history" },
];

const secondaryNavItems = [
  { title: "Rules", icon: FileText, path: "/rules" },
  { title: "Settings", icon: Settings, path: "/settings" },
  { title: "Help", icon: HelpCircle, path: "/help" },
];

export default function AppSidebar() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { isLeftSidebarOpen } = useLayout();

  return (
    <aside
      className="hidden md:flex flex-shrink-0 border-r border-neutral-900 bg-neutral-950 transition-all duration-300 ease-in-out overflow-hidden"
      style={{ width: isLeftSidebarOpen ? "240px" : "0px" }}
    >
      <div className="flex h-full w-[240px] flex-col">
        <div className="border-b border-neutral-900 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-900">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold tracking-wider">I•A•I</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-4">
            <div className="mb-2 px-3 text-xs font-semibold text-neutral-500">
              Main
            </div>
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const isActive = currentPath === item.path;
                return (
                  <Link
                    key={item.title}
                    to={item.path}
                    className={[
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-neutral-900 text-neutral-100"
                        : "text-neutral-200 hover:bg-neutral-900/60",
                    ].join(" ")}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="px-3 py-4">
            <div className="mb-2 px-3 text-xs font-semibold text-neutral-500">
              Settings
            </div>
            <nav className="space-y-1">
              {secondaryNavItems.map((item) => {
                const isActive = currentPath === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={[
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-neutral-900 text-neutral-100"
                        : "text-neutral-200 hover:bg-neutral-900/60",
                    ].join(" ")}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="border-t border-neutral-900 p-4">
          <p className="text-xs text-neutral-500 text-center">
            © 2025 · UI Shell
          </p>
        </div>
      </div>
    </aside>
  );
}
