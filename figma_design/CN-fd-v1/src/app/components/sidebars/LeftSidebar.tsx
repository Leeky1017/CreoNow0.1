import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router";
import { cn } from "../ui/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { CreateProjectModal } from "../modals/CreateProjectModal";
import {
  Search,
  Inbox,
  Clock,
  LayoutDashboard,
  BarChart2,
  Calendar as CalendarIcon,
  FolderOpen,
  Folder,
  PenTool,
  BookOpen,
  Archive,
  Plus,
  Settings,
  FileText,
  ChevronDown,
  ChevronRight,
  HardDrive,
  Users,
  Network,
} from "lucide-react";

interface LeftSidebarProps {
  onSettingsClick: () => void;
  onSearchClick: () => void;
  onToggleCollapse: () => void;
}

export function LeftSidebar({
  onSettingsClick,
  onSearchClick,
  onToggleCollapse,
}: LeftSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const handleOpenFolder = async () => {
    // In a real app, this would use File System Access API
    alert("Opening local folder dialog...");
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] text-gray-300 w-full overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 px-1">
          <div className="h-6 w-6 relative flex items-center justify-center">
            {/* Geometric abstract logo */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-full h-full text-white"
            >
              <path
                d="M12 2L2 12L12 22L22 12L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12H22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 2V22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span
            className="text-sm font-semibold tracking-wider text-white"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            CreoNow
          </span>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-white/5 rounded-md transition-colors text-gray-500 hover:text-white"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Main Actions */}
      <div className="px-4 pb-6 flex flex-col gap-2 shrink-0">
        <button
          onClick={() => navigate("/app/editor/new")}
          className="w-full h-9 flex items-center justify-center gap-2 rounded-md bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors shadow-sm"
        >
          <PenTool className="w-4 h-4" />
          New Document
        </button>
        <button
          onClick={handleOpenFolder}
          className="w-full h-9 flex items-center justify-center gap-2 rounded-md border border-white/10 text-gray-400 text-sm font-medium hover:bg-white-[0.02] hover:text-white hover:border-white/20 transition-all shadow-sm"
        >
          <HardDrive className="w-4 h-4" />
          Open Local Folder
        </button>
      </div>

      {/* Navigation */}
      <div className="px-4 mb-4 shrink-0 space-y-1">
        <button
          onClick={onSearchClick}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors group"
        >
          <span className="flex items-center gap-3">
            <Search className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
            <span className="font-medium">Search</span>
          </span>
          <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] border border-white/20 rounded px-1.5">
              ⌘
            </span>
            <span className="text-[10px] border border-white/20 rounded px-1.5">
              K
            </span>
          </div>
        </button>
        <NavItem
          to="/app/inbox"
          icon={<Inbox className="h-4 w-4" />}
          label="Inbox"
          badge="3"
        />
        <NavItem
          to="/app/recent"
          icon={<Clock className="h-4 w-4" />}
          label="Recent"
        />
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-8">
        <SidebarSection title="OVERVIEW" defaultExpanded>
          <NavItem
            to="/app"
            icon={<LayoutDashboard className="h-4 w-4" />}
            label="Dashboard"
            end
          />
          <NavItem
            to="/app/analytics"
            icon={<BarChart2 className="h-4 w-4" />}
            label="Analytics"
          />
          <NavItem
            to="/app/calendar"
            icon={<CalendarIcon className="h-4 w-4" />}
            label="Calendar"
          />
        </SidebarSection>

        <SidebarSection
          title="PROJECTS"
          action={<Plus className="h-3.5 w-3.5" />}
          onActionClick={() => setIsProjectModalOpen(true)}
          defaultExpanded
        >
          <NavItem
            to="/app/projects"
            icon={<FolderOpen className="h-4 w-4" />}
            label="All Projects"
          />
          <NavItem
            to="/app/drafts"
            icon={<FileText className="h-4 w-4" />}
            label="Drafts"
          />
          <NavItem
            to="/app/published"
            icon={<BookOpen className="h-4 w-4" />}
            label="Published"
          />
        </SidebarSection>

        <SidebarSection title="KNOWLEDGE BASE" defaultExpanded>
          <NavItem
            to="/app/characters"
            icon={<Users className="h-4 w-4" />}
            label="Characters"
          />
          <NavItem
            to="/app/graph"
            icon={<Network className="h-4 w-4" />}
            label="Knowledge Graph"
          />
        </SidebarSection>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 shrink-0 bg-[#050505]">
        <div
          className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors group"
          onClick={onSettingsClick}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 rounded-md border border-white/10">
              <AvatarFallback className="bg-transparent text-white text-[11px] font-medium rounded-md">
                AM
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm text-white leading-none font-medium mb-1">
                Alex M.
              </span>
              <span className="text-[11px] text-gray-500">Pro Plan</span>
            </div>
          </div>
          <Settings className="h-4 w-4 text-gray-500 group-hover:text-white transition-colors" />
        </div>
      </div>

      <CreateProjectModal
        open={isProjectModalOpen}
        onOpenChange={setIsProjectModalOpen}
      />
    </div>
  );
}

function SidebarSection({
  title,
  action,
  onActionClick,
  children,
  defaultExpanded = false,
}: {
  title: string;
  action?: React.ReactNode;
  onActionClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div>
      <div
        className="flex items-center justify-between px-3 mb-2 group cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            )}
          </div>
          <span className="text-[11px] font-medium tracking-[0.15em] text-gray-500 group-hover:text-gray-300 transition-colors truncate">
            {title}
          </span>
        </div>
        {action && (
          <button
            className="text-gray-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              onActionClick?.(e);
            }}
          >
            {action}
          </button>
        )}
      </div>
      {expanded && <nav className="flex flex-col gap-1 mt-2">{children}</nav>}
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
  badge,
  disabled,
  end,
  dot,
}: {
  to: string;
  icon?: React.ReactNode;
  label: string;
  badge?: string;
  disabled?: boolean;
  end?: boolean;
  dot?: string;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all group",
          isActive && !disabled
            ? "bg-white/10 text-white font-medium"
            : "text-gray-400 hover:bg-white/[0.03] hover:text-gray-200",
          disabled && "opacity-40 pointer-events-none",
        )
      }
    >
      <span className="flex items-center gap-3 min-w-0">
        {icon && (
          <span className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
            {icon}
          </span>
        )}
        {dot && (
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: dot }}
          />
        )}
        <span className="truncate">{label}</span>
      </span>
      {badge && (
        <span className="text-[10px] font-medium bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded-sm">
          {badge}
        </span>
      )}
    </NavLink>
  );
}
