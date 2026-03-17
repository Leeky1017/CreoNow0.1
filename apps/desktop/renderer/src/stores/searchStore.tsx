import React from "react";
import { create } from "zustand";

import type { IpcError, IpcResponseData } from "@shared/types/ipc-generated";
import type { IpcInvoke } from "../lib/ipcTypes";

export type { IpcInvoke };

export type SearchItem = IpcResponseData<"search:fts:query">["results"][number];

export type SearchStatus = "idle" | "loading" | "ready" | "error";
export type SearchIndexState = "ready" | "rebuilding";

export type SearchScope = "current" | "all";

export type SearchState = {
  query: string;
  scope: SearchScope;
  items: SearchItem[];
  status: SearchStatus;
  indexState: SearchIndexState;
  total: number;
  hasMore: boolean;
  lastError: IpcError | null;
};

export type SearchActions = {
  setQuery: (query: string) => void;
  setScope: (scope: SearchScope) => void;
  runFulltext: (args: {
    projectId: string;
    limit?: number;
    scope?: SearchScope;
  }) => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
};

export type SearchStore = SearchState & SearchActions;

export type UseSearchStore = ReturnType<typeof createSearchStore>;

const SearchStoreContext = React.createContext<UseSearchStore | null>(null);

/**
 * Create a zustand store for search state.
 *
 * Why: search results must be driven through typed IPC with a stable, testable
 * state machine and recoverable error handling.
 */
export function createSearchStore(deps: { invoke: IpcInvoke }) {
  let latestSearchRequestId = 0;
  let activeSearchController: AbortController | null = null;

  return create<SearchStore>((set, get) => ({
    query: "",
    scope: "current" as SearchScope,
    items: [],
    status: "idle",
    indexState: "ready",
    total: 0,
    hasMore: false,
    lastError: null,

    setQuery: (query) => set({ query }),
    setScope: (scope) => set({ scope }),

    clearResults: () => {
      latestSearchRequestId += 1;
      activeSearchController?.abort();
      activeSearchController = null;

      set({
        items: [],
        status: "idle",
        total: 0,
        hasMore: false,
        indexState: "ready",
      });
    },

    clearError: () => set({ lastError: null }),

    runFulltext: async ({ projectId, limit, scope }) => {
      const query = get().query;
      const effectiveScope = scope ?? get().scope;
      if (query.trim().length === 0) {
        latestSearchRequestId += 1;
        activeSearchController?.abort();
        activeSearchController = null;

        set({
          items: [],
          status: "idle",
          indexState: "ready",
          total: 0,
          hasMore: false,
          lastError: null,
        });
        return;
      }

      latestSearchRequestId += 1;
      const requestId = latestSearchRequestId;
      activeSearchController?.abort();
      const controller = new AbortController();
      activeSearchController = controller;

      set({ status: "loading", lastError: null });

      try {
        const res = await deps.invoke("search:fts:query", {
          projectId,
          query,
          limit,
          offset: 0,
          scope: effectiveScope,
        });

        const shouldCommit =
          !controller.signal.aborted &&
          requestId === latestSearchRequestId &&
          activeSearchController === controller &&
          get().query === query;

        if (!shouldCommit) {
          return;
        }

        if (!res.ok) {
          set({
            status: "error",
            lastError: res.error,
            items: [],
            total: 0,
            hasMore: false,
          });
          if (activeSearchController === controller) {
            activeSearchController = null;
          }
          return;
        }

        set({
          status: "ready",
          items: res.data.results,
          total: res.data.total,
          hasMore: res.data.hasMore,
          indexState: res.data.indexState,
          lastError: null,
        });
      } catch (error) {
        const shouldCommit =
          !controller.signal.aborted &&
          requestId === latestSearchRequestId &&
          activeSearchController === controller &&
          get().query === query;

        if (!shouldCommit) {
          return;
        }

        set({
          status: "error",
          items: [],
          total: 0,
          hasMore: false,
          lastError: {
            code: "INTERNAL",
            message: "Search request failed",
            details: {
              message: error instanceof Error ? error.message : String(error),
            },
          },
        });
      } finally {
        if (activeSearchController === controller) {
          activeSearchController = null;
        }
      }
    },
  }));
}

/**
 * Provide a search store instance for the Workbench UI.
 */
export function SearchStoreProvider(props: {
  store: UseSearchStore;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <SearchStoreContext.Provider value={props.store}>
      {props.children}
    </SearchStoreContext.Provider>
  );
}

/**
 * Read values from the injected search store.
 */
export function useSearchStore<T>(selector: (state: SearchStore) => T): T {
  const store = React.useContext(SearchStoreContext);
  if (!store) {
    throw new Error("SearchStoreProvider is missing");
  }
  return store(selector);
}
