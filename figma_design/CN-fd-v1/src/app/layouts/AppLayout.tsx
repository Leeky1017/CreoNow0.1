import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { cn } from "../components/ui/utils";
import { LeftSidebar } from "../components/sidebars/LeftSidebar";
import { RightSidebar } from "../components/sidebars/RightSidebar";
import { CommandPalette } from "../components/modals/CommandPalette";
import { SettingsModal } from "../modals/SettingsModal";

export function AppLayout() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const [leftSidebarSize, setLeftSidebarSize] = useState(15);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);

  const [rightSidebarSize, setRightSidebarSize] = useState(25);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(true);

  const location = useLocation();

  const toggleLeftSidebar = () => setLeftSidebarCollapsed((prev) => !prev);
  const toggleRightSidebar = () => setRightSidebarCollapsed((prev) => !prev);

  // Handle Cmd+K for Search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
      if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleLeftSidebar();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Default to show right sidebar on editor or specific pages
  const defaultShowRight = location.pathname.includes("/editor") || location.pathname.includes("/graph");

  useEffect(() => {
    if (defaultShowRight) {
      setRightSidebarCollapsed(false);
    } else {
      setRightSidebarCollapsed(true);
    }
  }, [location.pathname]);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans dark relative">
      <PanelGroup direction="horizontal">
        {/* Left Sidebar */}
        {!leftSidebarCollapsed && (
          <>
            <Panel
              id="left-sidebar"
              order={1}
              defaultSize={leftSidebarSize}
              minSize={15}
              maxSize={30}
              onResize={setLeftSidebarSize}
              className="bg-sidebar border-r border-sidebar-border flex flex-col relative"
            >
              <LeftSidebar 
                onSettingsClick={() => setIsSettingsOpen(true)} 
                onSearchClick={() => setIsSearchOpen(true)}
                onToggleCollapse={toggleLeftSidebar}
              />
            </Panel>
            <PanelResizeHandle className="w-1 bg-transparent hover:bg-white/10 active:bg-white/20 transition-colors" />
          </>
        )}

        {/* Main Content */}
        <Panel
          id="main-content"
          order={2}
          defaultSize={
            leftSidebarCollapsed && rightSidebarCollapsed
              ? 100
              : !leftSidebarCollapsed && !rightSidebarCollapsed
              ? 60
              : leftSidebarCollapsed
              ? 75  // only right sidebar open: 100 - 25 = 75
              : 85  // only left sidebar open: 100 - 15 = 85
          }
          className="flex flex-col relative min-w-0 bg-[#0a0a0a]"
        >
          {leftSidebarCollapsed && (
            <button
              onClick={toggleLeftSidebar}
              className="absolute top-1/2 -translate-y-1/2 left-0 z-50 p-1.5 rounded-r-md hover:bg-white/10 transition-all border-y border-r border-white/10 bg-black/50 backdrop-blur-md group w-6 hover:w-8 flex items-center justify-center overflow-hidden"
              title="Expand Sidebar"
            >
              <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          )}
          {rightSidebarCollapsed && defaultShowRight && (
            <button
              onClick={toggleRightSidebar}
              className="absolute top-4 right-4 z-50 p-1.5 rounded-md hover:bg-white/10 transition-colors border border-white/10 bg-black/50 backdrop-blur-md"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v18h-6M10 17l5-5-5-5" /></svg>
            </button>
          )}
          <main className="flex-1 flex flex-col overflow-y-auto">
            <Outlet />
          </main>
        </Panel>

        {/* Right Sidebar */}
        {!rightSidebarCollapsed && (
          <>
            <PanelResizeHandle className="w-1 bg-transparent hover:bg-white/10 active:bg-white/20 transition-colors" />
            <Panel
              id="right-sidebar"
              order={3}
              defaultSize={rightSidebarSize}
              minSize={20}
              maxSize={40}
              onResize={setRightSidebarSize}
              className="bg-sidebar border-l border-sidebar-border flex flex-col relative"
            >
              <RightSidebar onToggleCollapse={toggleRightSidebar} />
            </Panel>
          </>
        )}
      </PanelGroup>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      <CommandPalette open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </div>
  );
}