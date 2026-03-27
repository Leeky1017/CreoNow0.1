import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from "../ui/dialog";
import { X, Image as ImageIcon, Check, BookOpen, Scroll, Clapperboard, Layout } from "lucide-react";
import { cn } from "../ui/utils";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PROJECT_TYPES = [
  { id: "Novel", icon: <BookOpen className="w-4 h-4" />, label: "Novel" },
  { id: "Short Story", icon: <Scroll className="w-4 h-4" />, label: "Short Story" },
  { id: "Screenplay", icon: <Clapperboard className="w-4 h-4" />, label: "Screenplay" },
  { id: "Other", icon: <Layout className="w-4 h-4" />, label: "Other" },
];

export function CreateProjectModal({ open, onOpenChange }: CreateProjectModalProps) {
  const [projectType, setProjectType] = useState("Novel");
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the project name when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleCreate = () => {
    if (!name.trim()) return;
    // Logic for creating project
    onOpenChange(false);
    setName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleCreate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/90 backdrop-blur-xl z-[200]" />
      <DialogContent 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[640px] p-0 border border-white/[0.08] bg-[#080808] shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden z-[201] flex flex-col"
        aria-describedby={undefined}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-14 border-b border-white/[0.05] shrink-0 bg-[#0a0a0a]">
          <div className="flex items-center gap-2.5">
            <DialogTitle className="text-[13px] font-semibold text-white tracking-tight">Create New Project</DialogTitle>
          </div>
          {/* DialogContent's built-in close button will be positioned at top-4 right-4 */}
        </div>

        {/* Body */}
        <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(85vh-100px)] custom-scrollbar">
          
          {/* Project Name */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-gray-500 tracking-[0.1em] uppercase">
                Project Name <span className="text-white/20 ml-1">*</span>
              </label>
            </div>
            <div className="relative group">
              <input 
                ref={inputRef}
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., The Silent Echo" 
                className="w-full h-12 bg-[#0c0c0c] border border-white/[0.08] rounded-xl px-4 text-sm text-white focus:outline-none focus:border-white/20 focus:bg-[#111111] placeholder-gray-700 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] group-hover:border-white/10"
              />
            </div>
          </div>

          {/* Project Type Grid */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-gray-500 tracking-[0.1em] uppercase">
              Project Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PROJECT_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setProjectType(type.id)}
                  className={cn(
                    "relative flex flex-col items-center justify-center h-24 rounded-xl border transition-all duration-300 group",
                    projectType === type.id 
                      ? "border-white/20 bg-white/[0.04] text-white shadow-[0_8px_20px_-10px_rgba(255,255,255,0.05)]" 
                      : "border-white/[0.05] bg-[#0c0c0c] text-gray-500 hover:bg-white/[0.02] hover:border-white/10 hover:text-gray-300"
                  )}
                >
                  <div className={cn(
                    "mb-3 p-2 rounded-lg transition-all duration-300",
                    projectType === type.id ? "bg-white/5 text-white" : "text-gray-600 group-hover:text-gray-400"
                  )}>
                    {type.icon}
                  </div>
                  <span className="text-[11px] font-semibold tracking-wide">{type.label}</span>
                  {projectType === type.id && (
                    <div className="absolute top-2 right-2">
                      <div className="h-4 w-4 rounded-full bg-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-black" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-gray-500 tracking-[0.1em] uppercase">
                Description
              </label>
              <span className="text-[10px] text-gray-600 font-medium lowercase italic">Optional</span>
            </div>
            <textarea 
              rows={3}
              placeholder="Brief synopsis or project notes..." 
              className="w-full bg-[#0c0c0c] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 focus:bg-[#111111] placeholder-gray-700 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] resize-none leading-relaxed"
            />
          </div>

          {/* Cover Image Upload Area */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-gray-500 tracking-[0.1em] uppercase">
                Cover Image
              </label>
              <span className="text-[10px] text-gray-600 font-medium lowercase italic">Optional</span>
            </div>
            <div className="group relative border border-dashed border-white/[0.08] rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/[0.02] hover:border-white/20 transition-all cursor-pointer overflow-hidden shadow-inner min-h-[140px]">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-white/[0.05] transition-all duration-500">
                <ImageIcon className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors" />
              </div>
              <span className="text-[12px] font-medium text-gray-400 mb-1 group-hover:text-white transition-colors">Drag or click to upload</span>
              <span className="text-[9px] text-gray-600 tracking-widest uppercase font-bold">Max 5MB • 16:9 recommended</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 h-20 border-t border-white/[0.05] flex items-center justify-end gap-3 shrink-0 bg-[#0a0a0a]">
          <button 
            onClick={() => onOpenChange(false)} 
            className="px-5 py-2 text-[12px] font-semibold text-gray-500 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            disabled={!name.trim()}
            onClick={handleCreate}
            className={cn(
              "px-8 py-2.5 text-[12px] font-bold rounded-lg transition-all active:scale-[0.98] shadow-2xl",
              name.trim() 
                ? "bg-white text-black hover:bg-zinc-200 shadow-white/5" 
                : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
            )}
          >
            Create Project
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}