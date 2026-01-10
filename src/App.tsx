import {
  RouterProvider,
  createRouter,
  createRoute,
  createRootRoute,
  redirect,
  Outlet,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { AppModeProvider, useAppMode } from "./contexts/AppModeContext";
import { LayoutProvider } from "./contexts/LayoutContext";

import TopBar from "./components/TopBar";
import AppSidebar from "./components/AppSidebar";
import MobileMenu from "./components/MobileMenu";

import OnboardingScreen from "./pages/OnboardingScreen";
import ChatPage from "./pages/ChatPage";
import WritePage from "./pages/WritePage";
import SearchPage from "./pages/SearchPage";
import HistoryPage from "./pages/HistoryPage";
import RulesPage from "./pages/RulesPage";
import SettingsPage from "./pages/SettingsPage";
import HelpPage from "./pages/HelpPage";

function ChatLayout() {
  return (
    <LayoutProvider>
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-neutral-950 text-neutral-100">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <div className="flex-1 min-w-0 overflow-hidden">
            <Outlet />
          </div>
        </div>
        <MobileMenu />
        <Toaster theme="dark" richColors />
      </div>
    </LayoutProvider>
  );
}

const rootRoute = createRootRoute({
  component: ChatLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/chat" });
  },
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/home",
  beforeLoad: () => {
    throw redirect({ to: "/chat" });
  },
});

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chat",
  component: ChatPage,
});

const writeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/write",
  component: WritePage,
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/search",
  component: SearchPage,
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: HistoryPage,
});

const rulesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rules",
  component: RulesPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const helpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/help",
  component: HelpPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  homeRoute,
  chatRoute,
  writeRoute,
  searchRoute,
  historyRoute,
  rulesRoute,
  settingsRoute,
  helpRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function AppRoot() {
  const { mode } = useAppMode();
  if (mode === "onboarding") return <OnboardingScreen />;
  return <RouterProvider router={router} />;
}

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppModeProvider>
        <AppRoot />
      </AppModeProvider>
    </QueryClientProvider>
  );
}
