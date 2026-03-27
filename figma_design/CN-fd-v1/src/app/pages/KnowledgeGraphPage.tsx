import React, { useState } from "react";
import { cn } from "../components/ui/utils";
import {
  Plus,
  Minus,
  Key,
  MapPin,
  User,
  Clock,
  MoreVertical,
  Search,
  Edit2,
} from "lucide-react";
import { Avatar, AvatarFallback } from "../components/ui/avatar";

import { toast } from "sonner";

const GRAPH_NODES = {
  elara: {
    id: "elara",
    title: "Elara Vance",
    type: "Character",
    subtitle: "PROTAGONIST",
    tags: ["Age: 24", "Human", "Mage"],
    desc: "A skilled weaver of arcana who seeks to unravel the mystery of the Silent Void. Born in the outskirts of the capital.",
    icon: (
      <Avatar className="w-10 h-10 border border-white/10">
        <AvatarFallback className="bg-blue-600 text-white">E</AvatarFallback>
      </Avatar>
    ),
  },
  key: {
    id: "key",
    title: "Crystal Key",
    type: "Item",
    subtitle: "ARTIFACT",
    tags: ["Legendary", "Magical"],
    desc: "An ancient artifact glowing with an inner cyan light. It is said to unlock the gates to the Shadow Keep.",
    icon: (
      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
        <Key className="w-5 h-5 text-cyan-400" />
      </div>
    ),
  },
  war: {
    id: "war",
    title: "The Great War",
    type: "Event",
    subtitle: "HISTORICAL",
    tags: ["100 years ago", "Cataclysm"],
    desc: "A devastating conflict that shattered the old empire and released the Silent Void upon the world.",
    icon: (
      <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/50 flex items-center justify-center">
        <Clock className="w-5 h-5 text-orange-400" />
      </div>
    ),
  },
  keep: {
    id: "keep",
    title: "Shadow Keep",
    type: "Location",
    subtitle: "DUNGEON",
    tags: ["Dangerous", "Ruins"],
    desc: "A forbidden fortress located in the center of the Void. Time behaves strangely within its walls.",
    icon: (
      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
        <MapPin className="w-5 h-5 text-emerald-400" />
      </div>
    ),
  },
};

export function KnowledgeGraphPage() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const activeData = selectedNode
    ? GRAPH_NODES[selectedNode as keyof typeof GRAPH_NODES]
    : null;

  return (
    <div
      className="flex flex-col h-full bg-[#050505] text-zinc-200 relative overflow-hidden"
      onClick={() => setSelectedNode(null)}
    >
      {/* Background Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Header */}
      <header
        className="flex items-center justify-between p-6 lg:px-8 border-b border-border/40 relative z-10 shrink-0 bg-[#050505]/80 backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-[#0a0a0a] px-4 py-2 rounded-md border border-border/50 shadow-sm transition-colors focus-within:border-white/20">
            <Search className="w-4 h-4 text-zinc-500" />
            <input
              placeholder="Search knowledge base..."
              className="bg-transparent border-none text-[13px] outline-none w-56 text-white placeholder-zinc-600 font-medium"
            />
          </div>
        </div>

        {/* Legend / Filter */}
        <div className="flex items-center gap-6 bg-[#0a0a0a] px-6 py-2.5 rounded-full border border-border/50 shadow-sm">
          <LegendItem color="bg-blue-500" label="Characters" />
          <LegendItem color="bg-emerald-500" label="Locations" />
          <LegendItem color="bg-orange-500" label="Events" />
          <LegendItem color="bg-cyan-500" label="Items" />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#0a0a0a] px-2 py-1.5 rounded-md border border-border/50 text-[13px] text-zinc-400 shadow-sm">
            <button className="p-1 hover:text-white hover:bg-white/[0.02] rounded transition-colors">
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-12 text-center font-medium tracking-wide">
              100%
            </span>
            <button className="p-1 hover:text-white hover:bg-white/[0.02] rounded transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => toast.success("Node creation flow started")}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-md text-[13px] font-medium hover:bg-zinc-200 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Node
          </button>
        </div>
      </header>

      {/* Graph Area */}
      <div className="flex-1 relative cursor-grab active:cursor-grabbing">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px]">
          {/* Edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <marker
                id="arrow-blue"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" opacity="0.8" />
              </marker>
              <marker
                id="arrow-gray"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#525252" opacity="0.8" />
              </marker>
            </defs>

            {/* Elara to Crystal Key */}
            <path
              d="M 400 300 L 250 300"
              stroke={
                selectedNode === "elara" || selectedNode === "key"
                  ? "#3b82f6"
                  : "#3b82f650"
              }
              strokeWidth="2"
              fill="none"
              opacity="0.8"
              markerEnd="url(#arrow-blue)"
              className="transition-all duration-300"
            />
            <text
              x="325"
              y="292"
              fill={
                selectedNode === "elara" || selectedNode === "key"
                  ? "#3b82f6"
                  : "#3b82f650"
              }
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
              className="transition-all duration-300 tracking-wider"
            >
              OWNS
            </text>

            {/* Elara to Great War */}
            <path
              d="M 400 300 L 400 450"
              stroke={
                selectedNode === "elara" || selectedNode === "war"
                  ? "#737373"
                  : "#52525250"
              }
              strokeWidth="1.5"
              strokeDasharray="4 4"
              fill="none"
              className="transition-all duration-300"
            />
            <text
              x="408"
              y="380"
              fill={
                selectedNode === "elara" || selectedNode === "war"
                  ? "#a3a3a3"
                  : "#52525250"
              }
              fontSize="10"
              transform="rotate(90, 408, 380)"
              fontWeight="500"
              className="transition-all duration-300 tracking-wider"
            >
              PARTICIPATED
            </text>

            {/* Elara to Shadow Keep */}
            <path
              d="M 400 300 L 550 200"
              stroke={
                selectedNode === "elara" || selectedNode === "keep"
                  ? "#737373"
                  : "#52525250"
              }
              strokeWidth="1.5"
              strokeDasharray="4 4"
              fill="none"
              className="transition-all duration-300"
            />
            <text
              x="480"
              y="240"
              fill={
                selectedNode === "elara" || selectedNode === "keep"
                  ? "#a3a3a3"
                  : "#52525250"
              }
              fontSize="10"
              transform="rotate(-33, 480, 240)"
              fontWeight="500"
              className="transition-all duration-300 tracking-wider"
            >
              DESTINATION
            </text>
          </svg>

          {/* Node: Elara */}
          <div className="absolute top-[300px] left-[400px] -translate-x-1/2 -translate-y-1/2">
            <div
              className={cn(
                "w-14 h-14 rounded-full border-[3px] flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110",
                selectedNode === "elara"
                  ? "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-110"
                  : "border-blue-500/30 hover:border-blue-400",
              )}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNode("elara");
              }}
            >
              <Avatar className="w-12 h-12 border-2 border-[#050505]">
                <AvatarFallback className="bg-blue-900 text-white font-medium text-lg">
                  E
                </AvatarFallback>
              </Avatar>
            </div>
            <div
              className={cn(
                "text-center mt-3 text-sm font-semibold transition-colors duration-300",
                selectedNode === "elara" ? "text-white" : "text-gray-400",
              )}
            >
              Elara Vance
            </div>
          </div>

          {/* Node: Crystal Key */}
          <div className="absolute top-[300px] left-[250px] -translate-x-1/2 -translate-y-1/2">
            <div
              className={cn(
                "w-12 h-12 rounded-xl border-[2px] bg-[#0a0a0a] flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 shadow-xl",
                selectedNode === "key"
                  ? "border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] scale-110"
                  : "border-cyan-500/30 hover:border-cyan-400/70",
              )}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNode("key");
              }}
            >
              <Key
                className={cn(
                  "w-5 h-5 transition-colors",
                  selectedNode === "key" ? "text-cyan-400" : "text-cyan-500/70",
                )}
              />
            </div>
            <div
              className={cn(
                "text-center mt-3 text-sm font-semibold transition-colors duration-300",
                selectedNode === "key" ? "text-white" : "text-gray-400",
              )}
            >
              Crystal Key
            </div>
          </div>

          {/* Node: Shadow Keep */}
          <div className="absolute top-[200px] left-[550px] -translate-x-1/2 -translate-y-1/2">
            <div
              className={cn(
                "w-12 h-12 rounded-xl border-[2px] bg-[#0a0a0a] flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 shadow-xl",
                selectedNode === "keep"
                  ? "border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)] scale-110"
                  : "border-emerald-500/30 hover:border-emerald-400/70",
              )}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNode("keep");
              }}
            >
              <MapPin
                className={cn(
                  "w-5 h-5 transition-colors",
                  selectedNode === "keep"
                    ? "text-emerald-400"
                    : "text-emerald-500/70",
                )}
              />
            </div>
            <div
              className={cn(
                "text-center mt-3 text-sm font-semibold transition-colors duration-300",
                selectedNode === "keep" ? "text-white" : "text-gray-400",
              )}
            >
              Shadow Keep
            </div>
          </div>

          {/* Node: Great War */}
          <div className="absolute top-[450px] left-[400px] -translate-x-1/2 -translate-y-1/2">
            <div
              className={cn(
                "w-12 h-12 rounded-xl border-[2px] bg-[#0a0a0a] flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 shadow-xl rotate-45",
                selectedNode === "war"
                  ? "border-orange-400 shadow-[0_0_20px_rgba(251,146,60,0.3)] scale-110"
                  : "border-orange-500/30 hover:border-orange-400/70",
              )}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNode("war");
              }}
            >
              <div className="-rotate-45">
                <Clock
                  className={cn(
                    "w-5 h-5 transition-colors",
                    selectedNode === "war"
                      ? "text-orange-400"
                      : "text-orange-500/70",
                  )}
                />
              </div>
            </div>
            <div
              className={cn(
                "text-center mt-5 text-sm font-semibold transition-colors duration-300",
                selectedNode === "war" ? "text-white" : "text-gray-400",
              )}
            >
              The Great War
            </div>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      <div
        className={cn(
          "absolute top-0 right-0 w-[420px] h-full bg-[#0a0a0a] border-l border-border/40 shadow-2xl transition-transform duration-300 z-30 flex flex-col",
          activeData ? "translate-x-0" : "translate-x-full",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {activeData && (
          <>
            <div className="p-8 border-b border-border/40 flex items-start justify-between bg-gradient-to-b from-white/[0.02] to-transparent shrink-0">
              <div className="flex gap-5 items-center">
                {activeData.icon}
                <div>
                  <h3 className="text-xl font-serif text-white">
                    {activeData.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[11px] font-medium tracking-[0.2em] text-zinc-500">
                      {activeData.subtitle}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                      {activeData.type}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-2 text-zinc-500 hover:text-white rounded-md hover:bg-white/[0.02] transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              <div className="flex flex-wrap gap-2.5">
                {activeData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 bg-[#050505] border border-border/40 rounded-md text-[11px] font-medium tracking-wide text-zinc-300 shadow-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div>
                <h4 className="text-[11px] font-medium tracking-[0.2em] text-zinc-500 mb-4 uppercase">
                  Description
                </h4>
                <p className="text-[13px] text-zinc-300 leading-relaxed bg-[#050505] p-5 rounded-xl border border-border/40 shadow-sm">
                  {activeData.desc}
                </p>
              </div>

              <div>
                <h4 className="text-[11px] font-medium tracking-[0.2em] text-zinc-500 mb-4 uppercase">
                  Connected Nodes
                </h4>
                <div className="space-y-3">
                  {selectedNode === "elara" && (
                    <>
                      <ConnectedNode
                        title="Crystal Key"
                        relation="Owns"
                        type="Item"
                        icon={<Key className="w-4 h-4 text-cyan-400" />}
                      />
                      <ConnectedNode
                        title="Shadow Keep"
                        relation="Destination"
                        type="Location"
                        icon={<MapPin className="w-4 h-4 text-emerald-400" />}
                      />
                      <ConnectedNode
                        title="The Great War"
                        relation="Participated"
                        type="Event"
                        icon={<Clock className="w-4 h-4 text-orange-400" />}
                      />
                    </>
                  )}
                  {selectedNode === "key" && (
                    <ConnectedNode
                      title="Elara Vance"
                      relation="Owned By"
                      type="Character"
                      icon={<User className="w-4 h-4 text-blue-400" />}
                    />
                  )}
                  {selectedNode === "keep" && (
                    <ConnectedNode
                      title="Elara Vance"
                      relation="Target Of"
                      type="Character"
                      icon={<User className="w-4 h-4 text-blue-400" />}
                    />
                  )}
                  {selectedNode === "war" && (
                    <ConnectedNode
                      title="Elara Vance"
                      relation="Participant"
                      type="Character"
                      icon={<User className="w-4 h-4 text-blue-400" />}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border/40 bg-[#050505] shrink-0 grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 py-3 bg-[#0a0a0a] hover:bg-white/[0.02] text-white text-[13px] font-medium rounded-md transition-colors border border-border/50 shadow-sm">
                <Edit2 className="w-4 h-4" /> Edit Data
              </button>
              <button className="flex items-center justify-center gap-2 py-3 bg-white hover:bg-zinc-200 text-black text-[13px] font-medium rounded-md transition-colors shadow-sm">
                View Full
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ConnectedNode({ title, relation, type, icon }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-[#050505] hover:bg-[#0a0a0a] hover:border-white/10 transition-all cursor-pointer group shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-[#0a0a0a] border border-border/50 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
          {icon}
        </div>
        <div>
          <div className="text-[13px] font-medium text-zinc-200 group-hover:text-white transition-colors">
            {title}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">{type}</div>
        </div>
      </div>
      <span className="px-2.5 py-1 bg-[#0a0a0a] border border-border/40 text-zinc-400 rounded-sm text-[10px] uppercase tracking-[0.1em] font-medium">
        {relation}
      </span>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-2 h-2 rounded-full", color)} />
      <span className="text-xs font-medium text-gray-300">{label}</span>
    </div>
  );
}
