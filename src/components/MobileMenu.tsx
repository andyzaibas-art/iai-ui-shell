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
  X,
} from "lucide-react";
import { useLayout } from "../contexts/LayoutContext";
import { Button } from "./ui/button";

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

export default function MobileMenu() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useLayout();

  const close = () => setIsMobileMenuOpen(false);

  if (!isMobileMenuOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-40 md:hidden"
        onClick={close}
      />
      <div className="fixed inset-y-0 left-0 w-[280px] bg-neutral-950 border-r border-neutral-900 z-50 md:hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-900">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-900">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold tracking-wider">I•A•I</span>
          </div>
          <Button variant="ghost" size="icon" onClick={close} className="h-9 w-9">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-6">
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
                    onClick={close}
                    className={[
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors",
                      isActive
                        ? "bg-neutral-900 text-neutral-100"
                        : "text-neutral-200 hover:bg-neutral-900/60",
                    ].join(" ")}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
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
                    onClick={close}
                    className={[
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors",
                      isActive
                        ? "bg-neutral-900 text-neutral-100"
                        : "text-neutral-200 hover:bg-neutral-900/60",
                    ].join(" ")}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="border-t border-neutral-900 p-4">
          <p className="text-xs text-neutral-500 text-center">© 2025 · UI Shell</p>
        </div>
      </div>
    </>
  );
}
