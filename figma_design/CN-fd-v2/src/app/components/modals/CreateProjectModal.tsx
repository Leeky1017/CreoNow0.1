import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from "../ui/dialog";
import { X, Image as ImageIcon, Check, BookOpen, Scroll, Clapperboard, Layout } from "lucide-react";
import { cn } from "../ui/utils";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PROJECT_TYPES = [
  { id: "Novel", icon: <BookOpen className="w-[16px] h-[16px]" />, label: "Novel" },
  { id: "Short Story", icon: <Scroll className="w-[16px] h-[16px]" />, label: "Short Story" },
  { id: "Screenplay", icon: <Clapperboard className="w-[16px] h-[16px]" />, label: "Screenplay" },
  { id: "Other", icon: <Layout className="w-[16px] h-[16px]" />, label: "Other" },
];

export function CreateProjectModal({ open, onOpenChange }: CreateProjectModalProps) {
  const [projectType, setProjectType] = useState("Novel");
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleCreate = () => {
    if (!name.trim()) return;
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
      <DialogOverlay className="bg-[rgba(0,0,0,0.6)] z-[200]" />
      <DialogContent
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[640px] p-0 border border-[#2A2A2A] bg-[#1A1A1A] shadow-[0_4px_16px_rgba(0,0,0,0.4)] rounded-[12px] overflow-hidden z-[300] flex flex-col [&>button:last-child]:hidden"
        aria-describedby={undefined}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[24px] h-[48px] border-b border-[#2A2A2A] shrink-0 bg-[#111111]">
          <DialogTitle className="text-[14px] font-medium text-[#F0F0F0]">Create New Project</DialogTitle>
          <button onClick={() => onOpenChange(false)} className="text-[#888888] hover:text-[#F0F0F0] transition-colors duration-150">
            <X className="w-[16px] h-[16px]" />
          </button>
        </div>

        {/* Body */}
        <div className="p-[24px] space-y-[24px] overflow-y-auto max-h-[calc(85vh-100px)]">
          {/* Project Name */}
          <div className="space-y-[8px]">
            <label className="text-[12px] text-[#888888] tracking-[0.05em] uppercase">
              Project Name <span className="text-[#555555]">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., The Silent Echo"
              className="w-full h-[44px] bg-[#111111] border border-[#2A2A2A] rounded-[6px] px-[16px] text-[14px] text-[#F0F0F0] focus:outline-none focus:border-[#3A3A3A] placeholder:text-[#555555] transition-colors duration-150"
            />
          </div>

          {/* Project Type */}
          <div className="space-y-[8px]">
            <label className="text-[12px] text-[#888888] tracking-[0.05em] uppercase">Project Type</label>
            <div className="grid grid-cols-4 gap-[12px]">
              {PROJECT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setProjectType(type.id)}
                  className={cn(
                    "relative flex flex-col items-center justify-center h-[80px] rounded-[8px] border transition-all duration-150",
                    projectType === type.id
                      ? "border-[#F0F0F0] bg-[#1E1E1E] text-[#F0F0F0]"
                      : "border-[#2A2A2A] bg-[#111111] text-[#888888] hover:bg-[#1E1E1E] hover:border-[#3A3A3A] hover:text-[#CCCCCC]"
                  )}
                >
                  <div className="mb-[8px]">{type.icon}</div>
                  <span className="text-[12px] font-medium">{type.label}</span>
                  {projectType === type.id && (
                    <div className="absolute top-[8px] right-[8px]">
                      <div className="h-[16px] w-[16px] rounded-full bg-[#F0F0F0] flex items-center justify-center">
                        <Check className="w-[10px] h-[10px] text-[#0D0D0D]" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-[8px]">
            <div className="flex items-center justify-between">
              <label className="text-[12px] text-[#888888] tracking-[0.05em] uppercase">Description</label>
              <span className="text-[12px] text-[#555555]">Optional</span>
            </div>
            <textarea
              rows={3}
              placeholder="Brief synopsis or project notes..."
              className="w-full bg-[#111111] border border-[#2A2A2A] rounded-[6px] px-[16px] py-[12px] text-[14px] text-[#F0F0F0] focus:outline-none focus:border-[#3A3A3A] placeholder:text-[#555555] transition-colors duration-150 resize-none leading-[1.6]"
            />
          </div>

          {/* Cover Image */}
          <div className="space-y-[8px]">
            <div className="flex items-center justify-between">
              <label className="text-[12px] text-[#888888] tracking-[0.05em] uppercase">Cover Image</label>
              <span className="text-[12px] text-[#555555]">Optional</span>
            </div>
            <div className="border border-dashed border-[#2A2A2A] rounded-[8px] p-[24px] flex flex-col items-center justify-center text-center hover:bg-[#1E1E1E] hover:border-[#3A3A3A] transition-all duration-150 cursor-pointer min-h-[120px]">
              <ImageIcon className="w-[20px] h-[20px] text-[#555555] mb-[8px]" />
              <span className="text-[12px] text-[#888888] mb-[4px]">Drag or click to upload</span>
              <span className="text-[11px] text-[#555555]">Max 5MB · 16:9 recommended</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-[24px] h-[64px] border-t border-[#2A2A2A] flex items-center justify-end gap-[12px] shrink-0 bg-[#111111]">
          <button
            onClick={() => onOpenChange(false)}
            className="px-[16px] py-[8px] text-[14px] text-[#888888] hover:text-[#F0F0F0] transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            disabled={!name.trim()}
            onClick={handleCreate}
            className={cn(
              "px-[24px] py-[8px] text-[14px] font-medium rounded-[6px] transition-all duration-150",
              name.trim()
                ? "bg-[#F0F0F0] text-[#0D0D0D] hover:bg-[#CCCCCC]"
                : "bg-[#1E1E1E] text-[#555555] cursor-not-allowed"
            )}
          >
            Create Project
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
