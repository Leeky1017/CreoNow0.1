import React, { useState } from "react";
import { Plus, ArrowUpRight, Search, Bell, LayoutGrid, List } from "lucide-react";
import { useNavigate } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const recentWork = [
  { id: "1", title: "The Future of Typography", type: "Essay", typeColor: "#a3a3a3", time: "Edited 2h ago", words: "2,403", progress: 60 },
  { id: "2", title: "Design System Architecture", type: "Technical", typeColor: "#22c55e", time: "Edited 5h ago", words: "856", progress: 30 },
  { id: "3", title: "Q3 Retrospective", type: "Internal", typeColor: "#f59e0b", time: "Edited Yesterday", words: "1,102", progress: 80 },
  { id: "4", title: "Notes on Minimalism", type: "Journal", typeColor: "#737373", time: "Edited Oct 24", words: "420", progress: 15 },
];

const bottomCards = [
  { id: "5", label: "RESEARCH", title: "Cognitive\nLoad Theory", meta: "12 SOURCES", color: "#a3a3a3" },
  { id: "6", label: "FOCUS METRICS", title: "", meta: "4.2 HOURS TODAY", color: "#22c55e" },
  { id: "7", label: "DRAFT", title: "Untitled\nManifesto", meta: "JUST NOW", color: "#f59e0b" },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  return (
    <div className="flex-1 overflow-y-auto flex">
      <div className="flex-1 flex flex-col p-12 lg:p-16 max-w-6xl w-full mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <div className="text-[13px] text-muted-foreground flex items-center gap-3 font-medium tracking-wide">
            <span className="hover:text-white transition-colors cursor-pointer">Workspace</span>
            <span className="text-zinc-700 font-light">/</span>
            <span className="text-foreground">Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="h-9 w-9 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white-[0.02] hover:border-border transition-all shadow-sm">
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Hero */}
        <div className="flex items-start justify-between mb-16">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-serif text-white leading-[1.05] mb-6 tracking-tight">
              CONTINUE
              <br />
              CREATING
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-lg">
              Your daily productivity metrics are stable. You have 3 active drafts pending review.
            </p>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <button className="h-10 px-6 rounded-md border border-border/50 text-sm font-medium text-muted-foreground hover:text-white hover:bg-white-[0.02] hover:border-border transition-all shadow-sm">
              Import
            </button>
            <button className="h-10 px-6 rounded-md bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors shadow-sm">
              New Project
            </button>
          </div>
        </div>

        {/* Top cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-16">
          {/* Featured card */}
          <div
            onClick={() => navigate("/app/editor/1")}
            className="col-span-1 md:col-span-2 rounded-2xl border border-border/40 bg-[#0a0a0a] hover:bg-[#0f0f0f] hover:border-white/10 transition-all p-8 flex flex-col justify-between cursor-pointer group min-h-[240px] shadow-sm hover:shadow-md"
          >
            <div className="flex justify-between items-start mb-auto">
              <span className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground border border-border/40 px-2.5 py-1 rounded-sm bg-black/20">
                IN PROGRESS
              </span>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-white transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <div className="mt-12">
              <h3 className="text-3xl font-serif text-white mb-3">
                The Future of Neural Interfaces
              </h3>
              <p className="text-[15px] text-muted-foreground leading-relaxed line-clamp-2 mb-6 max-w-md">
                Chapter 4 explores the latency issues in direct cortical stimulation. Currently at 4,200 words.
              </p>
              <div className="text-[11px] font-medium text-zinc-500 tracking-[0.2em]">EDITED 2H AGO</div>
            </div>
          </div>

          {/* Stats card */}
          <div className="rounded-2xl border border-border/40 bg-[#0a0a0a] p-8 flex flex-col justify-between shadow-sm">
            <span className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground">WEEKLY GOAL</span>
            <div className="mt-auto">
              <div className="text-5xl text-white mb-2 font-light tracking-tight">12k</div>
              <div className="text-[15px] text-muted-foreground mb-6">Words Written</div>
              <div className="text-xs font-medium text-brand-success tracking-wider bg-brand-success/10 w-fit px-2 py-1 rounded-sm">
                +12% VS LAST WEEK
              </div>
            </div>
          </div>

          {/* Quick Note */}
          <div
            onClick={() => navigate("/app/editor/new")}
            className="rounded-2xl border border-dashed border-border/40 bg-transparent p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.02] hover:border-white/20 transition-all group min-h-[240px]"
          >
            <div className="h-14 w-14 rounded-full border border-border/40 flex items-center justify-center mb-5 group-hover:border-white/30 group-hover:scale-105 transition-all bg-[#0a0a0a] shadow-sm">
              <Plus className="h-6 w-6 text-muted-foreground group-hover:text-white transition-colors" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground tracking-[0.2em] group-hover:text-white transition-colors">
              QUICK NOTE
            </span>
          </div>
        </div>

        {/* Recent Work */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[13px] font-medium tracking-[0.1em] text-muted-foreground uppercase">Recent Work</h2>
            <div className="flex items-center gap-6">
              <div className="flex gap-5 text-xs font-medium tracking-[0.15em]">
                {["ALL", "DRAFTS", "PUBLISHED"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-1.5 transition-all border-b-2 ${
                      activeTab === tab
                        ? "text-white border-white"
                        : "text-muted-foreground border-transparent hover:text-zinc-300"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 ml-4 border-l border-border/50 pl-6">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "text-white bg-white/10" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "text-white bg-white/10" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            {recentWork.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/app/editor/${item.id}`)}
                className="flex items-center justify-between p-5 rounded-xl hover:bg-white/[0.02] border border-transparent hover:border-border/40 cursor-pointer transition-all group"
              >
                <div className="flex-1 min-w-0 flex items-center gap-6">
                  <div className="text-[15px] font-medium text-zinc-200 group-hover:text-white transition-colors">
                    {item.title}
                  </div>
                  <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
                    <span
                      className="px-2 py-0.5 rounded-sm text-[11px] font-medium tracking-wide border"
                      style={{
                        borderColor: `${item.typeColor}20`,
                        color: item.typeColor,
                        backgroundColor: `${item.typeColor}05`,
                      }}
                    >
                      {item.type}
                    </span>
                    <span className="text-zinc-500">{item.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <span className="text-[13px] text-muted-foreground">{item.words} words</span>
                  <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white/40 rounded-full transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-white transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom cards row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {bottomCards.map((card) => (
            <div
              key={card.id}
              className="rounded-2xl border border-border/40 bg-[#0a0a0a] p-8 flex flex-col justify-between min-h-[200px] cursor-pointer hover:bg-[#0f0f0f] hover:border-white/10 transition-all group shadow-sm"
            >
              <span
                className="text-[11px] font-medium tracking-[0.2em] px-2.5 py-1 rounded-sm border w-fit"
                style={{
                  borderColor: `${card.color}20`,
                  color: card.color,
                  backgroundColor: `${card.color}05`,
                }}
              >
                {card.label}
              </span>
              {card.title && (
                <h3 className="text-2xl font-serif text-white mt-auto whitespace-pre-line leading-snug">
                  {card.title}
                </h3>
              )}
              <div className="flex items-center justify-between mt-auto pt-6">
                <span className="text-[11px] font-medium tracking-[0.2em] text-zinc-500">{card.meta}</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-white transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right context panel */}
      <aside className="hidden xl:block w-[320px] border-l border-border/40 bg-black/20 p-8 shrink-0 overflow-y-auto">
        <div className="mb-12">
          <div className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground mb-4">ACTIVE CONTEXT</div>
          <h3 className="text-lg font-medium text-white mb-6 leading-tight">The Future of Typography</h3>
          <div className="space-y-4 text-[13px]">
            {[
              ["Status", "In Progress"],
              ["Created", "Oct 12, 2023"],
              ["Target", "3,000 words"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center pb-3 border-b border-border/30 last:border-0 last:pb-0">
                <span className="text-muted-foreground">{k}</span>
                <span className="text-zinc-200 font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <div className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground mb-4">COLLABORATORS</div>
          <div className="flex -space-x-3">
            {["#a3a3a3", "#22c55e", "#f59e0b"].map((c, i) => (
              <div
                key={i}
                className="h-10 w-10 rounded-full border-[3px] border-[#0a0a0a] shadow-sm"
                style={{ backgroundColor: `${c}40` }}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground mb-6">HISTORY</div>
          <div className="space-y-6 relative pl-5 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border/30">
            {[
              { action: 'Mark updated section "Origins"', time: "2 hours ago" },
              { action: "Added citation from Tschichold", time: "5 hours ago" },
              { action: "Created document", time: "Oct 12, 10:00 AM" },
            ].map((e, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-5 top-1.5 h-3 w-3 rounded-full bg-zinc-300 border-[3px] border-[#0a0a0a]" />
                <p className="text-[13px] text-zinc-200 leading-relaxed mb-1">{e.action}</p>
                <p className="text-[11px] font-medium text-zinc-500 tracking-wide">{e.time}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
