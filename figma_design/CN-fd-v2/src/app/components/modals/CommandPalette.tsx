import React, { useState, useEffect } from "react";
import { Command } from "cmdk";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { cn } from "../ui/utils";
import {
  Search,
  FileText,
  Folder,
  Users,
  CheckSquare,
  Hash,
  AlignLeft,
  Calendar,
  User,
  Clock,
  ChevronRight,
  X,
  Command as CommandIcon,
} from "lucide-react";
import { useNavigate } from "react-router";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MOCK_RESULTS = [
  {
    id: "1",
    title: "The Future of Neural Interfaces",
    type: "Document",
    icon: <FileText className="w-[16px] h-[16px] text-[#888888]" />,
    path: "/app/editor/draft-1",
    shortcut: "↵",
  },
  {
    id: "2",
    title: "Project: Project Phoenix",
    type: "Project",
    icon: <Folder className="w-[16px] h-[16px] text-[#888888]" />,
    path: "/app/editor/draft-1",
    shortcut: "↵",
  },
  {
    id: "3",
    title: "Elara Vance",
    type: "Character",
    icon: <User className="w-[16px] h-[16px] text-[#888888]" />,
    path: "/app/characters",
    shortcut: "↵",
  },
  {
    id: "4",
    title: "Review Chapter 3 Dialogue",
    type: "Task",
    icon: <CheckSquare className="w-[16px] h-[16px] text-[#888888]" />,
    path: "/app/editor/draft-1",
    shortcut: "↵",
  },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedResultId(null);
    }
  }, [open]);

  // Handle auto-select first item
  useEffect(() => {
    if (MOCK_RESULTS.length > 0 && !selectedResultId) {
      setSelectedResultId(MOCK_RESULTS[0].id);
    }
  }, [search]);

  const handleSelect = (path: string) => {
    onOpenChange(false);
    if (path) navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-[rgba(0,0,0,0.6)] z-[200]"
        className="fixed top-[20vh] left-1/2 -translate-x-1/2 w-[560px] max-h-[480px] p-0 border border-[#2A2A2A] bg-[#1A1A1A] shadow-[0_4px_16px_rgba(0,0,0,0.4)] rounded-[12px] overflow-hidden z-[300] flex flex-col [&>button:last-child]:hidden animate-in fade-in zoom-in-[0.98] duration-300 data-[state=closed]:animate-out data-[state=closed]:fade-out duration-150"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">全局搜索</DialogTitle>

        <Command
          className="flex flex-col w-full h-full text-[#F0F0F0] overflow-hidden"
          shouldFilter={false} // Custom filtering in real app
        >
          {/* Search Input Area */}
          <div className="flex items-center px-[16px] h-[48px] bg-[#111111] shrink-0">
            <Command.Input
              value={search}
              onValueChange={setSearch}
              className="flex-1 bg-transparent outline-none border-none placeholder-[#555555] text-[14px] font-normal text-[#F0F0F0]"
              placeholder="搜索文档、命令、Agent 指令..."
            />
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            <Command.List>
              <Command.Empty className="py-6 text-center text-[14px] text-[#555555]">
                无结果
              </Command.Empty>

              {MOCK_RESULTS.map((item) => (
                <Command.Item
                  key={item.id}
                  value={item.title}
                  onSelect={() => handleSelect(item.path)}
                  onMouseEnter={() => setSelectedResultId(item.id)}
                  className={cn(
                    "flex items-center h-[40px] px-[16px] cursor-pointer transition-colors duration-100 outline-none",
                    selectedResultId === item.id ? "bg-[#1E1E1E]" : "",
                  )}
                >
                  <div className="shrink-0 mr-[12px] flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[14px] font-medium text-[#F0F0F0] truncate block">
                      {item.title}
                    </span>
                  </div>
                  <div className="shrink-0 ml-[12px] flex items-center gap-[4px] text-[12px] text-[#888888]">
                    <span>{item.shortcut}</span>
                  </div>
                </Command.Item>
              ))}
            </Command.List>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
