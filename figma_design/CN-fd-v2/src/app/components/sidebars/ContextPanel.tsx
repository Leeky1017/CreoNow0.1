import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router";
import { cn } from "../ui/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  FolderOpen,
  FileText,
  BookOpen,
  Plus,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  List,
  Folder,
  File,
} from "lucide-react";

interface ContextPanelProps {
  onToggleCollapse: () => void;
}

export function ContextPanel({ onToggleCollapse }: ContextPanelProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [viewMode, setViewMode] = useState<"file-tree" | "outline">(
    "file-tree",
  );
  const isEditor = location.pathname.includes("/editor");

  return (
    <div className="flex flex-col h-full bg-[#1A1A1A] text-[#F0F0F0] w-full overflow-hidden">
      {/* Header */}
      <div className="h-[32px] px-[16px] py-[12px] flex items-center justify-between shrink-0 box-content">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="flex items-center gap-[4px] outline-none group">
            <span className="text-[16px] font-semibold text-[#F0F0F0] leading-none uppercase">
              {viewMode === "file-tree" ? "项目" : "OUTLINE"}
            </span>
            <ChevronsUpDown className="w-[12px] h-[12px] text-[#888888] group-hover:text-[#F0F0F0] transition-colors" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              sideOffset={4}
              className="w-[160px] bg-[#1A1A1A] border border-[#2A2A2A] rounded-[6px] shadow-sm p-1 z-[100] animate-in fade-in zoom-in-95 duration-150"
            >
              <DropdownMenu.Item
                onClick={() => setViewMode("file-tree")}
                className="flex items-center h-[36px] px-2 outline-none cursor-default hover:bg-[#1E1E1E] rounded-[4px]"
              >
                <Folder className="w-[16px] h-[16px] text-[#888888] mr-[12px]" />
                <span className="text-[14px] font-normal text-[#F0F0F0]">
                  文件树
                </span>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                disabled={!isEditor}
                onClick={() => setViewMode("outline")}
                className="flex items-center h-[36px] px-2 outline-none cursor-default hover:bg-[#1E1E1E] rounded-[4px] data-[disabled]:opacity-50 data-[disabled]:hover:bg-transparent"
              >
                <List className="w-[16px] h-[16px] text-[#888888] mr-[12px]" />
                <span className="text-[14px] font-normal text-[#F0F0F0]">
                  OUTLINE
                </span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {viewMode === "file-tree" && (
          <button
            onClick={() => navigate("/app/editor/new")}
            className="p-1 text-[#888888] hover:text-[#F0F0F0] hover:bg-[#1E1E1E] rounded-[4px] transition-colors"
          >
            <Plus className="w-[16px] h-[16px]" />
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-[16px] pb-[12px] pt-[8px] space-y-4">
        {viewMode === "file-tree" ? (
          <div className="flex flex-col gap-1">
            {/* File Tree Nodes */}
            <FileTreeNode
              title="CreoNow"
              icon={<Folder className="w-[16px] h-[16px]" />}
              isProject
              defaultExpanded
            >
              <FileTreeNode title="Drafts" indent={1} defaultExpanded>
                <FileTreeNode
                  title="Chapter 1: The Beginning"
                  indent={2}
                  isDocument
                  isActive={location.pathname.includes("draft-1")}
                />
                <FileTreeNode
                  title="Chapter 2: Silence"
                  indent={2}
                  isDocument
                />
              </FileTreeNode>
              <FileTreeNode title="Characters" indent={1}>
                <FileTreeNode
                  title="Protagonist Profile"
                  indent={2}
                  isDocument
                />
              </FileTreeNode>
            </FileTreeNode>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {/* Outline Empty State for demonstration */}
            <div className="flex flex-col items-center justify-center h-[200px] opacity-100 animate-in fade-in duration-150">
              <File className="w-[32px] h-[32px] text-[#555555] mb-[8px]" />
              <div className="text-[14px] font-normal text-[#888888] mb-[4px]">
                还没有大纲
              </div>
              <div className="text-[12px] font-normal text-[#555555]">
                添加标题后自动生成
              </div>
            </div>
          </div>
        )}
      </div>

      {viewMode === "file-tree" && (
        <div className="shrink-0 px-[16px] py-[12px] border-t border-[#2A2A2A]">
          <div className="text-[12px] text-[#888888]">12,450 words</div>
        </div>
      )}
    </div>
  );
}

function FileTreeNode({
  title,
  icon,
  children,
  defaultExpanded = false,
  isProject = false,
  isDocument = false,
  isActive = false,
  indent = 0,
}: {
  title: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  defaultExpanded?: boolean;
  isProject?: boolean;
  isDocument?: boolean;
  isActive?: boolean;
  indent?: number;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasChildren = React.Children.count(children) > 0;

  return (
    <div className="flex flex-col w-full">
      <div
        className={cn(
          "flex items-center h-[32px] px-[8px] rounded-[4px] cursor-pointer group transition-colors duration-100",
          isActive
            ? "bg-[rgba(240,240,240,0.08)] text-[#F0F0F0]"
            : "hover:bg-[#1E1E1E] text-[#CCCCCC]",
        )}
        style={{ paddingLeft: `${indent * 16 + 8}px` }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-[6px] min-w-0 flex-1">
          {hasChildren && (
            <ChevronRight
              className={cn(
                "w-[12px] h-[12px] text-[#888888] shrink-0 transition-transform duration-150",
                expanded && "rotate-90",
              )}
            />
          )}
          {!hasChildren && <div className="w-[12px] shrink-0" />}

          {icon && <span className="shrink-0 text-[#888888]">{icon}</span>}

          <span
            className={cn(
              "truncate",
              isProject
                ? "text-[14px] font-medium text-[#F0F0F0]"
                : "text-[14px] font-normal",
            )}
          >
            {title}
          </span>
        </div>
      </div>
      {expanded && hasChildren && (
        <div className="flex flex-col mt-[2px]">{children}</div>
      )}
    </div>
  );
}
