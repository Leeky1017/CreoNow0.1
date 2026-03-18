import React from "react";

/**
 * Hook managing dashboard layout state — sidebar visibility and responsive breakpoints.
 */
export function useDashboardLayout() {
  const [sidebarVisible, setSidebarVisible] = React.useState(true);

  const toggleSidebar = React.useCallback(() => {
    setSidebarVisible((prev) => !prev);
  }, []);

  return {
    sidebarVisible,
    toggleSidebar,
  };
}
