import React, { useState } from "react";
import {
  List,
  ChevronDown,
  ChevronRight,
  Plus,
  Share,
  FileText
} from "lucide-react";
import { cn } from "../components/ui/utils";

export function EditorPage() {
  const [editorMode, setEditorMode] = useState<"write" | "split" | "preview">("write");

  return (
    <div className="flex-1 flex overflow-hidden bg-[#050505] text-zinc-300">
      
      {/* Secondary Left Sidebar - Outline */}
      <div className="w-[280px] border-r border-border/40 flex flex-col shrink-0 bg-[#050505]">
        <div className="flex items-center justify-between p-6 border-b border-border/40">
          <span className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground">OUTLINE</span>
          <div className="flex gap-2 text-muted-foreground">
            <button className="hover:text-white transition-colors"><ChevronDown className="w-4 h-4" /></button>
            <button className="hover:text-white transition-colors"><ChevronDown className="w-4 h-4" /></button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 text-[13px]">
          <OutlineItem title="The Aesthetics of Silence" defaultExpanded isRoot>
            <OutlineItem title="1. Introduction" />
            <OutlineItem title="2. Historical Context" defaultExpanded>
              <OutlineItem title="2.1 Early 20th Century" active />
              <OutlineItem title="2.2 Post-War Minimalism" />
            </OutlineItem>
            <OutlineItem title="3. The Digital Age" />
            <OutlineItem title="Conclusion" />
          </OutlineItem>
        </div>

        <div className="p-6 border-t border-border/40">
          <span className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground mb-4 block">EMPTY STATE PREVIEW</span>
          <div className="border border-dashed border-border/40 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-[#0a0a0a]">
            <FileText className="w-5 h-5 text-zinc-600 mb-4" />
            <span className="text-[13px] text-zinc-500 leading-relaxed">No outline yet.<br/>Headings appear here automatically.</span>
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative bg-[#0a0a0a]">
        
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-10 py-5 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-border/40">
          <div className="flex items-center gap-3 text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
            <span className="hover:text-zinc-300 transition-colors cursor-pointer">Draft</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-200">The Aesthetics of Silence</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-[11px] font-medium tracking-[0.1em] text-muted-foreground">SAVED</span>
            <button className="text-muted-foreground hover:text-white transition-colors">
              <span className="text-lg leading-none tracking-widest">...</span>
            </button>
          </div>
        </header>

        {/* Editor Content */}
        <div className="flex-1 max-w-3xl mx-auto w-full px-12 py-24 pb-40">
          
          <h1 className="text-5xl font-serif text-white mb-8 tracking-tight leading-[1.1]">
            The Aesthetics of Silence
          </h1>

          <div className="flex items-center gap-4 text-[13px] font-medium tracking-[0.1em] text-muted-foreground mb-16 uppercase">
            <span>Oct 24, 2023</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>12 min read</span>
          </div>

          <div className="space-y-8 text-[17px] text-zinc-300 leading-[1.8] font-serif">
            <p>
              In a world of noise, silence is a luxury. Our interfaces recede, allowing the
              content to breathe. The use of negative space is deliberate, creating a rhythm
              that guides the user through the narrative without friction.
            </p>

            <h2 className="text-2xl font-serif text-white mt-16 mb-6">
              1. Introduction
            </h2>

            <p>
              Silence in design is not merely the absence of sound or content; it is a
              structural element that shapes perception. Just as a pause in music defines the
              melody, empty space defines the interface.
            </p>

            <p>
              We observe that modern tools often clutter the workspace. Here, we strip away
              the non-essential. The focus returns to the word, the thought, the raw input.
            </p>

            <h2 className="text-2xl font-serif text-white mt-16 mb-6">
              2. Historical Context
            </h2>

            <h3 className="text-lg font-medium text-zinc-200 mt-10 mb-4 font-sans tracking-wide">
              2.1 Early 20th Century
            </h3>

            <p>
              The roots of digital minimalism can be traced back to the Bauhaus movement
              and Swiss Style typography, where form followed function with ruthless
              efficiency.
            </p>

            <h3 className="text-lg font-medium text-zinc-200 mt-10 mb-4 font-sans tracking-wide">
              2.2 Post-War Minimalism
            </h3>

            <p>
              Artists like Donald Judd and Agnes Martin demonstrated that reduction could
              lead to profound emotional resonance. This principle applies directly to
              interface design: by removing distractions, we amplify the signal.
            </p>
          </div>
        </div>

        {/* Floating Add Button */}
        <button className="fixed bottom-12 right-[360px] w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 hover:bg-zinc-100 transition-all z-20">
          <Plus className="w-6 h-6" />
        </button>

      </div>

    </div>
  );
}

function OutlineItem({ title, active, isRoot, defaultExpanded = false, children }: any) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasChildren = React.Children.count(children) > 0;

  return (
    <div className="flex flex-col mb-1">
      <div 
        className={cn(
          "flex items-center gap-3 py-2 px-3 rounded-md cursor-pointer group transition-all",
          active ? "bg-white/10 text-white font-medium" : "hover:bg-white/[0.03] text-muted-foreground hover:text-zinc-200",
          isRoot && "text-white font-medium mb-2 text-[14px]"
        )}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className="w-4 h-4 flex items-center justify-center shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
          {hasChildren ? (
            expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
          )}
        </div>
        <span className="truncate flex-1">{title}</span>
        {active && (
           <span className="w-1 h-5 bg-white absolute left-0 rounded-r-full" />
        )}
      </div>
      {expanded && children && (
        <div className="ml-5 border-l border-border/30 pl-3 flex flex-col mt-1">
          {children}
        </div>
      )}
    </div>
  );
}
