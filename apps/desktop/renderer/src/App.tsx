import React from "react";

import { AppShell } from "./components/layout/AppShell";
import { OnboardingPage } from "./features/onboarding";
import { invoke } from "./lib/ipcClient";
import { GlobalErrorToastBridge } from "./lib/GlobalErrorToastBridge";
import { createPreferenceStore } from "./lib/preferences";
import { createAiStore, AiStoreProvider } from "./stores/aiStore";
import { createEditorStore, EditorStoreProvider } from "./stores/editorStore";
import { createFileStore, FileStoreProvider } from "./stores/fileStore";
import { createKgStore, KgStoreProvider } from "./stores/kgStore";
import { createLayoutStore, LayoutStoreProvider } from "./stores/layoutStore";
import { createMemoryStore, MemoryStoreProvider } from "./stores/memoryStore";
import {
  createOnboardingStore,
  OnboardingStoreProvider,
  useOnboardingStore,
} from "./stores/onboardingStore";
import { createSearchStore, SearchStoreProvider } from "./stores/searchStore";
import {
  createThemeStore,
  ThemeStoreProvider,
  type ThemeMode,
} from "./stores/themeStore";
import {
  createProjectStore,
  ProjectStoreProvider,
} from "./stores/projectStore";
import {
  createVersionStore,
  VersionStoreProvider,
} from "./stores/versionStore";
import { WindowTitleBar } from "./components/window/WindowTitleBar";

/**
 * AppRouter decides which screen to show based on onboarding status.
 *
 * Why: First-time users should see the onboarding flow before the main app.
 */
function AppRouter(): JSX.Element {
  const onboardingCompleted = useOnboardingStore((s) => s.completed);
  const completeOnboarding = useOnboardingStore((s) => s.complete);

  if (!onboardingCompleted) {
    return <OnboardingPage onComplete={completeOnboarding} />;
  }

  return <AppShell />;
}

/**
 * App bootstraps renderer stores and mounts the Workbench shell.
 */
export function App(): JSX.Element {
  const preferences = React.useMemo(() => {
    return createPreferenceStore(window.localStorage);
  }, []);

  const themeStore = React.useMemo(() => {
    return createThemeStore(preferences);
  }, [preferences]);

  React.useLayoutEffect(() => {
    const system = window.matchMedia("(prefers-color-scheme: dark)");

    function resolve(mode: ThemeMode): "dark" | "light" {
      if (mode === "system") {
        return system.matches ? "dark" : "light";
      }
      return mode;
    }

    function apply(mode: ThemeMode): void {
      document.documentElement.setAttribute("data-theme", resolve(mode));
    }

    function onSystemChange(): void {
      if (themeStore.getState().mode === "system") {
        apply("system");
      }
    }

    apply(themeStore.getState().mode);
    const unsubscribe = themeStore.subscribe((state) => apply(state.mode));

    system.addEventListener("change", onSystemChange);

    return () => {
      unsubscribe();
      system.removeEventListener("change", onSystemChange);
    };
  }, [themeStore]);

  const layoutStore = React.useMemo(() => {
    return createLayoutStore(preferences);
  }, [preferences]);

  const onboardingStore = React.useMemo(() => {
    return createOnboardingStore(preferences);
  }, [preferences]);

  const editorStore = React.useMemo(() => {
    return createEditorStore({ invoke });
  }, []);

  const projectStore = React.useMemo(() => {
    return createProjectStore({
      invoke,
      flushPendingAutosave: async () => {
        await editorStore.getState().flushPendingAutosave();
      },
      getOperatorId: () => "renderer",
      createTraceId: () => {
        if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
          return crypto.randomUUID();
        }
        return "trace-fallback";
      },
    });
  }, [editorStore]);

  const aiStore = React.useMemo(() => {
    return createAiStore({ invoke });
  }, []);

  const fileStore = React.useMemo(() => {
    return createFileStore({ invoke });
  }, []);

  const kgStore = React.useMemo(() => {
    return createKgStore({ invoke });
  }, []);

  const searchStore = React.useMemo(() => {
    return createSearchStore({ invoke });
  }, []);

  const memoryStore = React.useMemo(() => {
    return createMemoryStore({ invoke });
  }, []);

  const versionStore = React.useMemo(() => {
    return createVersionStore({ invoke });
  }, []);

  return (
    <ThemeStoreProvider store={themeStore}>
      <OnboardingStoreProvider store={onboardingStore}>
        <AiStoreProvider store={aiStore}>
          <ProjectStoreProvider store={projectStore}>
            <EditorStoreProvider store={editorStore}>
              <FileStoreProvider store={fileStore}>
                <KgStoreProvider store={kgStore}>
                  <SearchStoreProvider store={searchStore}>
                    <MemoryStoreProvider store={memoryStore}>
                      <VersionStoreProvider store={versionStore}>
                        <LayoutStoreProvider store={layoutStore}>
                          <div className="flex h-full min-h-0 flex-col">
                            <WindowTitleBar />
                            <div className="min-h-0 flex-1">
                              <AppRouter />
                            </div>
                          </div>
                          <GlobalErrorToastBridge />
                        </LayoutStoreProvider>
                      </VersionStoreProvider>
                    </MemoryStoreProvider>
                  </SearchStoreProvider>
                </KgStoreProvider>
              </FileStoreProvider>
            </EditorStoreProvider>
          </ProjectStoreProvider>
        </AiStoreProvider>
      </OnboardingStoreProvider>
    </ThemeStoreProvider>
  );
}
