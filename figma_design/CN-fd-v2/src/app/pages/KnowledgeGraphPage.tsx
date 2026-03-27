import React, { useState } from "react";
import { cn } from "../components/ui/utils";
import { Plus, Minus, Search, Bot, User, MapPin, Clock, Key, X, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const NODES = [
  { id: "elara", title: "Elara Vance", type: "角色", subtitle: "PROTAGONIST", x: 400, y: 300, size: "lg" as const, shape: "circle" as const, tags: ["Age: 24", "Human"], desc: "A skilled weaver of arcana who seeks to unravel the mystery of the Silent Void." },
  { id: "key", title: "Crystal Key", type: "物品", subtitle: "ARTIFACT", x: 220, y: 260, size: "md" as const, shape: "square" as const, tags: ["Legendary", "Magical"], desc: "An ancient artifact glowing with an inner cyan light." },
  { id: "keep", title: "Shadow Keep", type: "地点", subtitle: "DUNGEON", x: 600, y: 180, size: "md" as const, shape: "diamond" as const, tags: ["Dangerous", "Ruins"], desc: "A forbidden fortress located in the center of the Void." },
  { id: "war", title: "The Great War", type: "事件", subtitle: "HISTORICAL", x: 400, y: 480, size: "md" as const, shape: "hex" as const, tags: ["100 years ago"], desc: "A devastating conflict that shattered the old empire." },
];

const EDGES = [
  { from: "elara", to: "key", label: "OWNS", strength: "strong" as const },
  { from: "elara", to: "war", label: "PARTICIPATED", strength: "weak" as const },
  { from: "elara", to: "keep", label: "DESTINATION", strength: "weak" as const },
];

const typeColors: Record<string, string> = {
  "角色": "#E0E0E0",
  "地点": "#888888",
  "事件": "#555555",
  "物品": "#7AA2F7",
};

const nodeIcon = (type: string, size: number) => {
  const color = typeColors[type] || "#555555";
  switch (type) {
    case "角色": return <User style={{ width: size, height: size, color }} />;
    case "地点": return <MapPin style={{ width: size, height: size, color }} />;
    case "事件": return <Clock style={{ width: size, height: size, color }} />;
    case "物品": return <Key style={{ width: size, height: size, color }} />;
    default: return null;
  }
};

const nodeSize = (s: string) => (s === "lg" ? 52 : s === "md" ? 36 : 24);

export function KnowledgeGraphPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [filters, setFilters] = useState<Set<string>>(new Set(["角色", "地点", "事件", "物品"]));

  const activeNode = NODES.find((n) => n.id === selected);
  const toggleFilter = (t: string) => {
    setFilters((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  };

  const visibleNodes = NODES.filter((n) => filters.has(n.type));
  const visibleEdges = EDGES.filter((e) => visibleNodes.some((n) => n.id === e.from) && visibleNodes.some((n) => n.id === e.to));

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D] text-[#CCCCCC] relative overflow-hidden" onClick={() => setSelected(null)}>
      {/* Toolbar */}
      <header className="flex items-center justify-between px-[16px] h-[48px] bg-[#0D0D0D] border-b border-[#1E1E1E] shrink-0 z-[20]" onClick={(e) => e.stopPropagation()}>
        {/* Filters */}
        <div className="flex items-center gap-[6px]">
          {["角色", "地点", "事件", "物品"].map((t) => (
            <button
              key={t}
              onClick={() => toggleFilter(t)}
              className={cn(
                "h-[28px] px-[12px] rounded-full text-[11px] font-medium transition-all duration-200 border",
                filters.has(t)
                  ? "bg-[#1E1E1E] border-[#2A2A2A] text-[#E0E0E0]"
                  : "border-transparent text-[#3A3A3A] hover:text-[#555555]"
              )}
            >
              <span className="inline-block w-[6px] h-[6px] rounded-full mr-[6px]" style={{ backgroundColor: filters.has(t) ? typeColors[t] : "#2A2A2A" }} />
              {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center w-[220px] h-[32px] bg-[#111111] border border-[#1E1E1E] rounded-[6px] px-[8px] gap-[6px] focus-within:border-[#2A2A2A] transition-colors duration-200">
          <Search className="w-[12px] h-[12px] text-[#3A3A3A]" />
          <input placeholder="搜索实体…" className="flex-1 bg-transparent text-[12px] text-[#F0F0F0] placeholder:text-[#3A3A3A] outline-none" />
        </div>

        {/* View controls */}
        <div className="flex items-center gap-[8px]">
          <button className="p-[6px] text-[#555555] hover:text-[#888888] transition-colors">
            <Maximize2 className="w-[14px] h-[14px]" />
          </button>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 relative cursor-grab active:cursor-grabbing">
        {/* Grid background */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "radial-gradient(circle, #1E1E1E 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />

        <svg className="absolute inset-0 w-full h-full pointer-events-none z-[5]">
          {visibleEdges.map((edge) => {
            const from = NODES.find((n) => n.id === edge.from)!;
            const to = NODES.find((n) => n.id === edge.to)!;
            const isHighlighted = selected === edge.from || selected === edge.to;
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            return (
              <g key={`${edge.from}-${edge.to}`}>
                <line
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={isHighlighted ? "#555555" : "#1E1E1E"}
                  strokeWidth={edge.strength === "strong" ? 2 : 1}
                  strokeDasharray={edge.strength === "weak" ? "6 4" : undefined}
                  className="transition-all duration-300"
                />
                {/* Edge label */}
                <rect
                  x={midX - 30} y={midY - 10} width="60" height="16" rx="4"
                  fill={isHighlighted ? "#1E1E1E" : "#111111"}
                  className="transition-all duration-300"
                />
                <text
                  x={midX} y={midY + 2}
                  fill={isHighlighted ? "#888888" : "#3A3A3A"}
                  fontSize="9" fontWeight="500" textAnchor="middle" letterSpacing="0.06em"
                  className="transition-all duration-300"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Nodes */}
        {visibleNodes.map((node) => {
          const size = nodeSize(node.size);
          const isSelected = selected === node.id;
          const isRelated = EDGES.some((e) => (e.from === selected && e.to === node.id) || (e.to === selected && e.from === node.id));
          const dimmed = selected && !isSelected && !isRelated;

          return (
            <motion.div
              key={node.id}
              className="absolute flex flex-col items-center z-[10]"
              style={{ left: node.x, top: node.y, transform: "translate(-50%, -50%)" }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: dimmed ? 0.85 : 1, opacity: dimmed ? 0.25 : 1 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div
                onClick={(e) => { e.stopPropagation(); setSelected(node.id); }}
                className={cn(
                  "flex items-center justify-center bg-[#141414] cursor-pointer transition-all duration-200",
                  node.shape === "circle" && "rounded-full",
                  node.shape === "square" && "rounded-[6px]",
                  node.shape === "diamond" && "rounded-[6px] rotate-45",
                  node.shape === "hex" && "rounded-[6px]",
                  isSelected
                    ? "border-[2px] shadow-[0_0_20px_rgba(224,224,224,0.08)]"
                    : "border-[1.5px] border-[#2A2A2A] hover:border-[#3A3A3A] hover:scale-110",
                )}
                style={{
                  width: size,
                  height: size,
                  borderColor: isSelected ? (typeColors[node.type] || "#E0E0E0") : undefined,
                }}
              >
                <div className={cn(node.shape === "diamond" && "-rotate-45")}>
                  {nodeIcon(node.type, size * 0.4)}
                </div>
              </div>
              {/* Label */}
              <div className={cn(
                "flex flex-col items-center mt-[6px] transition-all duration-200",
                node.shape === "diamond" && "mt-[14px]",
                dimmed && "opacity-25"
              )}>
                <span className={cn(
                  "text-[12px] font-medium text-center leading-[1.3]",
                  isSelected ? "text-[#F0F0F0]" : "text-[#888888]"
                )}>
                  {node.title}
                </span>
                <span className="text-[9px] text-[#3A3A3A] tracking-[0.08em] uppercase mt-[2px]">
                  {node.subtitle}
                </span>
              </div>
            </motion.div>
          );
        })}

        {/* Controls */}
        <div className="absolute bottom-[16px] right-[16px] flex flex-col gap-[8px] z-[15]" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col items-center bg-[#141414] border border-[#1E1E1E] rounded-[8px] overflow-hidden">
            <button className="w-[32px] h-[32px] flex items-center justify-center text-[#555555] hover:text-[#888888] hover:bg-[#1E1E1E] transition-colors duration-150">
              <Plus className="w-[14px] h-[14px]" />
            </button>
            <div className="w-[16px] h-[1px] bg-[#1E1E1E]" />
            <button className="w-[32px] h-[32px] flex items-center justify-center text-[#555555] hover:text-[#888888] hover:bg-[#1E1E1E] transition-colors duration-150">
              <Minus className="w-[14px] h-[14px]" />
            </button>
          </div>
          <button className="h-[36px] bg-[#141414] border border-[#1E1E1E] rounded-[8px] text-[12px] font-medium text-[#CCCCCC] hover:bg-[#1E1E1E] transition-colors duration-150 flex items-center justify-center gap-[6px] px-[12px]">
            <Plus className="w-[12px] h-[12px]" /> 新建节点
          </button>
          <button className="h-[36px] bg-[#141414] border border-[#1E1E1E] rounded-[8px] text-[12px] font-medium text-[#7AA2F7] hover:bg-[#1E1E1E] transition-colors duration-150 flex items-center justify-center gap-[6px] px-[12px]">
            <Bot className="w-[12px] h-[12px] text-[#7AA2F7]" /> Creo 发现关联
          </button>
        </div>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {activeNode && (
          <motion.div
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute top-0 right-0 w-[340px] h-full bg-[#0D0D0D] border-l border-[#1E1E1E] z-[30] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-[20px] border-b border-[#1E1E1E] flex items-start justify-between shrink-0">
              <div>
                <h3 className="text-[24px] font-bold text-[#F0F0F0] leading-[1.2] tracking-[-0.02em]">{activeNode.title}</h3>
                <div className="flex items-center gap-[8px] mt-[8px]">
                  <span className="inline-block w-[6px] h-[6px] rounded-full" style={{ backgroundColor: typeColors[activeNode.type] }} />
                  <span className="text-[11px] text-[#555555] tracking-[0.06em] uppercase">{activeNode.subtitle}</span>
                  <span className="text-[11px] text-[#3A3A3A]">·</span>
                  <span className="text-[11px] text-[#555555]">{activeNode.type}</span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-[#555555] hover:text-[#888888] transition-colors duration-150 p-[4px] rounded-[4px] hover:bg-[#1E1E1E]">
                <X className="w-[14px] h-[14px]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-[20px] space-y-[24px]">
              <div className="flex flex-wrap gap-[6px]">
                {activeNode.tags.map((tag) => (
                  <span key={tag} className="px-[8px] py-[3px] bg-[#141414] border border-[#1E1E1E] rounded-[4px] text-[11px] text-[#888888]">{tag}</span>
                ))}
              </div>

              <div>
                <h4 className="text-[11px] text-[#555555] mb-[8px] tracking-[0.06em] uppercase">Description</h4>
                <p className="text-[13px] text-[#888888] leading-[1.65]">{activeNode.desc}</p>
              </div>

              <div>
                <h4 className="text-[11px] text-[#555555] mb-[10px] tracking-[0.06em] uppercase">Connected Nodes</h4>
                <div className="space-y-[8px]">
                  {EDGES.filter((e) => e.from === activeNode.id || e.to === activeNode.id).map((edge) => {
                    const otherId = edge.from === activeNode.id ? edge.to : edge.from;
                    const other = NODES.find((n) => n.id === otherId)!;
                    return (
                      <div
                        key={otherId}
                        onClick={() => setSelected(otherId)}
                        className="flex items-center justify-between p-[12px] bg-[#141414] border border-[#1E1E1E] rounded-[8px] hover:border-[#2A2A2A] transition-colors duration-150 cursor-pointer"
                      >
                        <div className="flex items-center gap-[10px]">
                          <div className="w-[28px] h-[28px] bg-[#1E1E1E] border border-[#2A2A2A] rounded-[6px] flex items-center justify-center">
                            {nodeIcon(other.type, 14)}
                          </div>
                          <div>
                            <div className="text-[13px] font-medium text-[#CCCCCC]">{other.title}</div>
                            <div className="text-[10px] text-[#555555] mt-[2px]">{other.type}</div>
                          </div>
                        </div>
                        <span className="text-[10px] text-[#555555] bg-[#1E1E1E] px-[8px] py-[3px] rounded-[4px] uppercase tracking-[0.06em]">
                          {edge.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
