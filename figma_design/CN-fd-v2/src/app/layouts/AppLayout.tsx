import React, { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, useLocation } from "react-router";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { IconRail } from "../components/sidebars/IconRail";
import { ContextPanel } from "../components/sidebars/ContextPanel";
import { RightSidebar } from "../components/sidebars/RightSidebar";
import { CommandPalette } from "../components/modals/CommandPalette";
import { SettingsModal } from "../modals/SettingsModal";
import { motion, AnimatePresence } from "motion/react";
import { Bot } from "lucide-react";

export function AppLayout() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [contextPanelOpen, setContextPanelOpen] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(true);
  const [rightSidebarSize, setRightSidebarSize] = useState(25);

  // Draggable FAB state
  const [fabPos, setFabPos] = useState({ x: 0, y: 0 }); // offset from default bottom-right
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number; moved: boolean } | null>(null);

  const location = useLocation();
  const isEditor = location.pathname.includes("/editor");

  useEffect(() => {
    setContextPanelOpen(isEditor);
  }, [isEditor]);

  const toggleRightSidebar = () => setRightSidebarCollapsed((prev) => !prev);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
      if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setContextPanelOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Auto-show right sidebar on editor/graph
  const defaultShowRight = isEditor || location.pathname.includes("/graph");
  useEffect(() => {
    setRightSidebarCollapsed(!defaultShowRight);
  }, [location.pathname]);

  // FAB drag handlers
  const handleFabMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: fabPos.x,
      startPosY: fabPos.y,
      moved: false,
    };
    setIsDragging(true);
  }, [fabPos]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragRef.current.moved = true;
      }
      setFabPos({
        x: dragRef.current.startPosX + dx,
        y: dragRef.current.startPosY + dy,
      });
    };

    const handleMouseUp = () => {
      if (dragRef.current && !dragRef.current.moved) {
        toggleRightSidebar();
      }
      dragRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="flex h-screen w-full bg-[#0D0D0D] text-[#F0F0F0] overflow-hidden font-sans relative">
      <IconRail
        onSettingsClick={() => setIsSettingsOpen(true)}
        onSearchClick={() => setIsSearchOpen(true)}
        onProjectsClick={() => setContextPanelOpen((prev) => !prev)}
        isProjectsActive={isEditor && contextPanelOpen}
      />

      {/* Context Panel */}
      <AnimatePresence>
        {contextPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 200, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="shrink-0 border-r border-[#2A2A2A] bg-[#1A1A1A] relative z-[30] overflow-hidden"
          >
            <ContextPanel onToggleCollapse={() => setContextPanelOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content + Right Sidebar */}
      <PanelGroup direction="horizontal" className="flex-1 min-w-0">
        <Panel
          id="main-content"
          order={1}
          className="flex flex-col relative min-w-0 bg-[#0D0D0D]"
        >
          {rightSidebarCollapsed && defaultShowRight && (
            <button
              onClick={toggleRightSidebar}
              className="absolute top-[16px] right-[16px] z-[20] p-[6px] rounded-[6px] hover:bg-[#1E1E1E] transition-colors duration-150 border border-[#2A2A2A] bg-[#1A1A1A] text-[#888888] hover:text-[#F0F0F0]"
              aria-label="打开 Creo 面板"
            >
              <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h6v18h-6M10 17l5-5-5-5" />
              </svg>
            </button>
          )}
          <main className="flex-1 flex flex-col overflow-y-auto">
            <Outlet />
          </main>
        </Panel>

        {!rightSidebarCollapsed && (
          <>
            <PanelResizeHandle className="w-[1px] bg-[#2A2A2A] hover:bg-[#3A3A3A] transition-colors duration-150" />
            <Panel
              id="right-sidebar"
              order={2}
              defaultSize={rightSidebarSize}
              minSize={20}
              maxSize={40}
              onResize={setRightSidebarSize}
              className="bg-[#1A1A1A] border-l border-[#2A2A2A] flex flex-col relative"
            >
              <RightSidebar onToggleCollapse={toggleRightSidebar} />
            </Panel>
          </>
        )}
      </PanelGroup>

      {/* Creo Floating Button — Draggable */}
      <div
        onMouseDown={handleFabMouseDown}
        className="fixed z-[100]"
        style={{
          bottom: `${24 - fabPos.y}px`,
          right: `${24 - fabPos.x}px`,
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
          touchAction: "none",
        }}
      >
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="w-[44px] h-[44px] rounded-full bg-[#7AA2F7] shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center justify-center text-[#0D0D0D]"
        >
          <Bot className="w-[20px] h-[20px]" />
        </motion.div>
      </div>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      <CommandPalette open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </div>
  );
}
