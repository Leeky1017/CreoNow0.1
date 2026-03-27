import { createBrowserRouter } from "react-router";
import { LoginPage } from "./pages/LoginPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EditorPage } from "./pages/EditorPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { CalendarPage } from "./pages/CalendarPage";
import { CharactersPage } from "./pages/CharactersPage";
import { KnowledgeGraphPage } from "./pages/KnowledgeGraphPage";
import { AppLayout } from "./layouts/AppLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginPage,
  },
  {
    path: "/onboarding",
    Component: OnboardingPage,
  },
  {
    path: "/app",
    Component: AppLayout,
    children: [
      { index: true, Component: DashboardPage },
      { path: "analytics", Component: AnalyticsPage },
      { path: "calendar", Component: CalendarPage },
      { path: "characters", Component: CharactersPage },
      { path: "graph", Component: KnowledgeGraphPage },
      { path: "editor/:id", Component: EditorPage },
      { path: "*", Component: DashboardPage },
    ],
  },
  {
    path: "*",
    Component: LoginPage,
  },
]);
