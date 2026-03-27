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
} from "lucide-react";
import { useNavigate } from "react-router";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TABS = [
  { id: "all", label: "All" },
  {
    id: "docs",
    label: "Documents",
    icon: <FileText className="w-3.5 h-3.5" />,
  },
  {
    id: "projects",
    label: "Projects",
    icon: <Folder className="w-3.5 h-3.5" />,
  },
  {
    id: "characters",
    label: "Characters",
    icon: <Users className="w-3.5 h-3.5" />,
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: <CheckSquare className="w-3.5 h-3.5" />,
  },
];

const MOCK_RESULTS = [
  {
    id: "1",
    title: "The Future of Neural Interfaces",
    type: "Document",
    icon: <FileText className="w-4 h-4 text-blue-400" />,
    path: "/app/editor/1",
    excerpt:
      "Chapter 4 explores the latency issues in direct cortical stimulation. Currently at 4,200 words.",
    meta: { author: "Alex M.", date: "2h ago", tags: ["Research", "Draft"] },
  },
  {
    id: "2",
    title: "Project: Project Phoenix",
    type: "Project",
    icon: <Folder className="w-4 h-4 text-emerald-400" />,
    path: "/app/projects/phoenix",
    excerpt:
      "Main hub for the sci-fi novel including world-building, character arcs, and timeline.",
    meta: { status: "Active", deadline: "Dec 2026", progress: "45%" },
  },
  {
    id: "3",
    title: "Elara Vance",
    type: "Character",
    icon: <User className="w-4 h-4 text-pink-400" />,
    path: "/app/characters/elara",
    excerpt:
      "Lead protagonist. Former neural engineer turned rogue operative after the Nexus incident.",
    meta: { role: "Protagonist", faction: "The Silenced", age: "28" },
  },
  {
    id: "4",
    title: "Review Chapter 3 Dialogue",
    type: "Task",
    icon: <CheckSquare className="w-4 h-4 text-orange-400" />,
    path: "/app/tasks/123",
    excerpt:
      "Ensure Elara's motivation is clear during the confrontation with Dr. Aris.",
    meta: { priority: "High", due: "Tomorrow", assignedTo: "Self" },
  },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setSearch("");
      setActiveTab("all");
      setSelectedResultId(null);
    }
  }, [open]);

  // Handle auto-select first item
  useEffect(() => {
    if (MOCK_RESULTS.length > 0 && !selectedResultId) {
      setSelectedResultId(MOCK_RESULTS[0].id);
    }
  }, [search, activeTab]);

  const handleSelect = (path: string) => {
    onOpenChange(false);
    if (path) navigate(path);
  };

  const selectedResult = MOCK_RESULTS.find((r) => r.id === selectedResultId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-black/80 backdrop-blur-sm z-[100]"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] sm:max-w-[1080px] h-[560px] p-0 border border-white/10 bg-[#0a0a0a] shadow-2xl rounded-xl overflow-hidden z-[101] flex flex-col [&>button:last-child]:hidden"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Global Search</DialogTitle>

        <Command
          className="flex flex-col w-full h-full text-gray-300 overflow-hidden"
          shouldFilter={false} // Custom filtering in real app
        >
          {/* Search Input Area */}
          <div className="flex flex-col border-b border-white/10 shrink-0">
            <div className="flex items-center px-6 h-16 gap-3 relative">
              <Search className="w-5 h-5 text-gray-500" />
              <Command.Input
                value={search}
                onValueChange={setSearch}
                className="flex-1 bg-transparent outline-none border-none placeholder-gray-600 text-xl text-white font-medium"
                placeholder="Search across workspace..."
              />
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-1.5 rounded-md hover:bg-white/10 text-gray-500 transition-all hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs & Filters */}
            <div className="flex items-center px-6 h-12 gap-6 bg-[#050505]/50 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-6">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 text-xs font-medium h-full border-b-2 transition-colors whitespace-nowrap py-3.5",
                      activeTab === tab.id
                        ? "border-white text-white"
                        : "border-transparent text-gray-500 hover:text-gray-300",
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}

                <div className="w-px h-3 bg-white/10 mx-2" />

                <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded hover:bg-white/5 whitespace-nowrap">
                  <Hash className="w-3.5 h-3.5" /> Tags
                </button>
                <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded hover:bg-white/5 whitespace-nowrap">
                  <Clock className="w-3.5 h-3.5" /> Time
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Results List */}
            <div className="flex-1 border-r border-white/5 overflow-y-auto p-4 scrollbar-hide">
              <Command.List>
                <Command.Empty className="p-12 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                  <Search className="w-10 h-10 opacity-20 mb-2" />
                  No results found for "{search}"
                </Command.Empty>

                <div className="space-y-1">
                  {MOCK_RESULTS.map((item) => (
                    <Command.Item
                      key={item.id}
                      value={item.title}
                      onSelect={() => handleSelect(item.path)}
                      onMouseEnter={() => setSelectedResultId(item.id)}
                      className={cn(
                        "flex items-start gap-4 px-4 py-4 rounded-xl cursor-pointer transition-colors group",
                        selectedResultId === item.id
                          ? "bg-white/[0.08]"
                          : "hover:bg-white/[0.04]",
                      )}
                    >
                      <div className="mt-0.5 shrink-0 bg-[#0a0a0a] p-2.5 rounded-lg border border-white/5 shadow-sm group-hover:border-white/10 transition-colors">
                        {item.icon}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4 mb-1.5">
                          <span
                            className={cn(
                              "text-base font-medium truncate",
                              selectedResultId === item.id
                                ? "text-white"
                                : "text-gray-200",
                            )}
                          >
                            {item.title}
                          </span>
                          <span className="text-[11px] text-gray-500 shrink-0 px-2 py-0.5 rounded-md border border-white/5 bg-white/5">
                            {item.type}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400 line-clamp-1 group-hover:text-gray-300 transition-colors">
                          {item.excerpt}
                        </span>
                      </div>
                    </Command.Item>
                  ))}
                </div>
              </Command.List>
            </div>

            {/* Preview Panel */}
            <div className="w-[400px] bg-[#050505] p-8 hidden lg:flex flex-col overflow-y-auto shrink-0">
              {selectedResult ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl border border-white/10 bg-[#0a0a0a] shadow-lg">
                      {selectedResult.icon}
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 font-semibold mb-0.5 tracking-[0.15em] uppercase">
                        {selectedResult.type}
                      </div>
                      <div className="text-lg text-white font-medium leading-tight">
                        {selectedResult.title}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <section>
                      <h4 className="text-[10px] font-semibold tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                        <AlignLeft className="w-3 h-3" /> PREVIEW
                      </h4>
                      <div className="text-sm text-gray-300 leading-relaxed bg-[#0a0a0a] p-5 rounded-xl border border-white/5 shadow-sm italic">
                        "{selectedResult.excerpt}"
                      </div>
                    </section>

                    <section>
                      <h4 className="text-[10px] font-semibold tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                        <Calendar className="w-3 h-3" /> METADATA
                      </h4>
                      <div className="bg-[#0a0a0a] rounded-xl border border-white/5 overflow-hidden shadow-sm">
                        {Object.entries(selectedResult.meta).map(
                          ([key, value], idx, arr) => (
                            <div
                              key={key}
                              className={cn(
                                "flex items-center justify-between px-4 py-3 text-[13px]",
                                idx !== arr.length - 1 &&
                                  "border-b border-white/5",
                              )}
                            >
                              <span className="text-gray-500 capitalize">
                                {key}
                              </span>
                              {Array.isArray(value) ? (
                                <div className="flex gap-2">
                                  {value.map((v) => (
                                    <span
                                      key={v}
                                      className="px-2 py-0.5 rounded-lg bg-white/10 text-gray-300 text-[11px]"
                                    >
                                      {v}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-300 font-medium">
                                  {value}
                                </span>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    </section>

                    <button
                      onClick={() => handleSelect(selectedResult.path)}
                      className="w-full py-3 rounded-xl bg-white text-black text-[13px] font-semibold hover:bg-zinc-200 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 mt-4"
                    >
                      Open {selectedResult.type}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4 opacity-50">
                  <Search className="w-10 h-10" />
                  <p className="text-xs text-center">
                    Select an item to view
                    <br />
                    details and metadata
                  </p>
                </div>
              )}
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
