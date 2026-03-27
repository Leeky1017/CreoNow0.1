import React, { useState } from "react";
import { cn } from "../ui/utils";
import {
  MoreHorizontal,
  Clock,
  ChevronRight,
  Send,
  Code2,
  Cpu,
  Bot,
  TerminalSquare,
  FileText,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface RightSidebarProps {
  onToggleCollapse: () => void;
}

export function RightSidebar({ onToggleCollapse }: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<"ASSISTANT" | "INFO">("ASSISTANT");

  return (
    <div className="flex flex-col h-full bg-[#050505] w-full border-l border-border/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 h-16 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab("ASSISTANT")}
            className={cn(
              "text-[11px] font-medium tracking-[0.2em] transition-all h-16 border-b-[2px]",
              activeTab === "ASSISTANT"
                ? "border-white text-white"
                : "border-transparent text-muted-foreground hover:text-zinc-300",
            )}
          >
            ASSISTANT
          </button>
          <button
            onClick={() => setActiveTab("INFO")}
            className={cn(
              "text-[11px] font-medium tracking-[0.2em] transition-all h-16 border-b-[2px]",
              activeTab === "INFO"
                ? "border-white text-white"
                : "border-transparent text-muted-foreground hover:text-zinc-300",
            )}
          >
            INFO
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-muted-foreground hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/[0.02]">
            <Clock className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleCollapse}
            className="text-muted-foreground hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/[0.02]"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === "ASSISTANT" ? <AssistantTab /> : <InfoTab />}
      </div>
    </div>
  );
}

function AssistantTab() {
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="flex flex-col h-full">
      {/* Conversation Thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* User Message */}
        <div className="flex justify-end">
          <div className="bg-[#111111] border border-border/40 text-[13px] text-zinc-200 p-4 rounded-xl max-w-[85%] leading-relaxed shadow-sm">
            Create a Python script to sort a list of dictionaries by a specific
            key.
          </div>
        </div>

        {/* AI Message */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500 tracking-[0.1em]">
            <Bot className="w-3.5 h-3.5" /> GPT-4o
          </div>
          <div className="text-[13px] text-zinc-300 leading-relaxed pl-1">
            You can use the sorted() function with a lambda function as the key.
          </div>
          <div className="rounded-xl border border-border/40 bg-[#0a0a0a] overflow-hidden mt-2 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-[#050505]">
              <span className="text-[11px] font-mono tracking-wider text-zinc-500">
                PYTHON
              </span>
              <div className="flex items-center gap-3">
                <button className="text-[11px] font-medium tracking-wide text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors">
                  <TerminalSquare className="w-3.5 h-3.5" /> Apply
                </button>
              </div>
            </div>
            <pre className="p-4 text-[12px] font-mono text-zinc-300 overflow-x-auto leading-[1.6]">
              <span className="text-zinc-500">data</span> = [ &#123;
              <span className="text-[#22c55e]">'name'</span>:{" "}
              <span className="text-[#22c55e]">'Alice'</span>,{" "}
              <span className="text-[#22c55e]">'age'</span>:{" "}
              <span className="text-[#f59e0b]">25</span>&#125;, &#123;
              <span className="text-[#22c55e]">'name'</span>:{" "}
              <span className="text-[#22c55e]">'Bob'</span>,{" "}
              <span className="text-[#22c55e]">'age'</span>:{" "}
              <span className="text-[#f59e0b]">20</span>&#125; ]
              <span className="text-zinc-500">sorted_data</span> ={" "}
              <span className="text-[#3b82f6]">sorted</span>(data, key=
              <span className="text-zinc-400">lambda</span> x: x[
              <span className="text-[#22c55e]">'age'</span>])
              <span className="text-[#3b82f6]">print</span>(sorted_data)
            </pre>
          </div>
        </div>

        {/* User Message 2 */}
        <div className="flex justify-end">
          <div className="bg-[#111111] border border-border/40 text-[13px] text-zinc-200 p-4 rounded-xl max-w-[85%] leading-relaxed shadow-sm">
            Now make it reverse order.
          </div>
        </div>

        {/* AI Message 2 */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500 tracking-[0.1em]">
            <Bot className="w-3.5 h-3.5" /> GPT-4o
          </div>
          <div className="text-[13px] text-zinc-300 leading-relaxed pl-1">
            Simply add the reverse=True parameter.
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-border/40 bg-[#050505] shrink-0">
        {/* Context chips */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#0a0a0a] border border-border/50 text-[11px] font-medium text-zinc-400 shadow-sm">
            <FileText className="w-3.5 h-3.5" /> main.py
            <button className="hover:text-white ml-1 transition-colors">
              ×
            </button>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-border/50 rounded-xl overflow-hidden flex flex-col focus-within:border-white/20 transition-all shadow-sm">
          <textarea
            className="w-full bg-transparent text-[13px] text-white p-4 min-h-[80px] max-h-[240px] resize-none focus:outline-none placeholder:text-zinc-600 leading-relaxed"
            placeholder="Ask anything (Cmd+K)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-[#050505]">
            <div className="flex items-center gap-4">
              <button className="text-[11px] font-medium tracking-wide text-zinc-300 flex items-center gap-1.5 hover:text-white transition-colors">
                <Code2 className="w-4 h-4 text-zinc-400" /> Code
              </button>
              <span className="text-zinc-700">/</span>
              <button className="text-[11px] font-medium tracking-wide text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors">
                GPT-4o <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            <button className="bg-white text-black p-2 rounded-lg hover:bg-zinc-200 transition-all shadow-sm transform hover:scale-105">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronDown(props: any) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function InfoTab() {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-8 space-y-12">
      {/* Overview */}
      <section>
        <h3 className="text-[11px] font-medium tracking-[0.2em] text-zinc-500 mb-6 uppercase">
          Overview
        </h3>
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-[#0a0a0a] p-4 rounded-xl border border-border/40 shadow-sm">
            <div className="text-3xl font-light tracking-tight text-white">
              12k
            </div>
            <div className="text-[11px] font-medium tracking-wide text-zinc-500 mt-2 uppercase">
              Words
            </div>
          </div>
          <div className="bg-[#0a0a0a] p-4 rounded-xl border border-border/40 shadow-sm">
            <div className="text-3xl font-light tracking-tight text-white">
              45m
            </div>
            <div className="text-[11px] font-medium tracking-wide text-zinc-500 mt-2 uppercase">
              Read Time
            </div>
          </div>
        </div>
        <div className="space-y-4 text-[13px]">
          <div className="flex justify-between items-center pb-3 border-b border-border/30">
            <span className="text-zinc-500">Created</span>
            <span className="text-zinc-300 font-medium">Oct 12, 2023</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-border/30">
            <span className="text-zinc-500">Modified</span>
            <span className="text-zinc-300 font-medium">Just now</span>
          </div>
        </div>
      </section>

      {/* Tags */}
      <section>
        <h3 className="text-[11px] font-medium tracking-[0.2em] text-zinc-500 mb-4 uppercase">
          Tags
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {["FICTION", "SCI-FI", "NOVEL", "DRAFT"].map((tag) => (
            <span
              key={tag}
              className="px-3 py-1.5 rounded-[4px] border border-border/50 text-[10px] font-medium tracking-wider text-zinc-400 bg-[#0a0a0a] hover:bg-white/[0.02] hover:text-white transition-colors cursor-pointer shadow-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* Version History */}
      <section>
        <h3 className="text-[11px] font-medium tracking-[0.2em] text-zinc-500 mb-6 uppercase">
          Version History
        </h3>
        <div className="space-y-6 relative pl-4 before:absolute before:left-[3px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border/30">
          {[
            {
              name: "Chapter 3 Revisions",
              date: "10:42 AM",
              desc: "Adjusted dialogue pacing in scene 4.",
            },
            {
              name: "Character Update",
              date: "Jan 29",
              desc: 'Renamed "Kael" to "Kaelen".',
            },
            {
              name: "First Draft Complete",
              date: "Jan 25",
              desc: "Initial completion of core arc.",
            },
          ].map((v, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full bg-zinc-300 border-[2px] border-[#050505]" />
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-zinc-200">
                    {v.name}
                  </span>
                  <span className="text-[11px] text-zinc-500 tracking-wide">
                    {v.date}
                  </span>
                </div>
                <p className="text-[12px] text-zinc-500 leading-relaxed mt-0.5">
                  {v.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
        <button className="text-[12px] font-medium text-zinc-400 hover:text-white mt-6 flex items-center gap-1.5 transition-colors group">
          View full history{" "}
          <span className="transform group-hover:translate-x-1 transition-transform">
            &rarr;
          </span>
        </button>
      </section>

      {/* Related Characters */}
      <section>
        <h3 className="text-[11px] font-medium tracking-[0.2em] text-zinc-500 mb-6 uppercase">
          Related Characters
        </h3>
        <div className="space-y-4">
          {[
            {
              name: "Elara Vance",
              role: "Protagonist",
              initial: "E",
              color: "bg-[#3b82f6]",
            },
            {
              name: "Jax Kaelen",
              role: "Antagonist",
              initial: "J",
              color: "bg-[#ef4444]",
            },
            {
              name: "Sarah Chen",
              role: "Support",
              initial: "S",
              color: "bg-[#22c55e]",
            },
          ].map((c) => (
            <div
              key={c.name}
              className="flex items-center justify-between group cursor-pointer p-2 -mx-2 rounded-lg hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-4">
                <Avatar className="w-8 h-8 border border-border/50 shadow-sm">
                  <AvatarFallback
                    className={cn(
                      "text-[11px] font-medium text-white",
                      c.color,
                    )}
                  >
                    {c.initial}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[13px] font-medium text-zinc-300 group-hover:text-white transition-colors">
                  {c.name}
                </span>
              </div>
              <span className="text-[11px] font-medium tracking-wide text-zinc-500">
                {c.role}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
