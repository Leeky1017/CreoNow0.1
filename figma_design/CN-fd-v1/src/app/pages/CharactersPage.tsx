import React, { useState } from "react";
import { cn } from "../components/ui/utils";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  MessageSquare,
  BookOpen,
  Star,
} from "lucide-react";
import { Avatar, AvatarFallback } from "../components/ui/avatar";

const characters = [
  {
    id: 1,
    name: "Elara Vance",
    role: "Protagonist",
    group: "MAIN CHARACTERS",
    initial: "E",
    color: "bg-blue-600",
    age: "24",
    archetype: "The Reluctant Hero",
    description:
      "A skilled pilot with a mysterious past, determined to find the lost coordinates of Earth. She wears a faded flight jacket with an emblem no one recognizes.",
    traits: ["Brave", "Impulsive", "Loyal"],
    relations: [
      {
        name: "Kaelen Thorne",
        type: "Rival",
        role: "Antagonist",
        init: "K",
        col: "bg-gray-600",
      },
      {
        name: "Jax",
        type: "Mentor",
        role: "Mentor",
        init: "J",
        col: "bg-gray-800",
      },
    ],
    appearances: ["Chapter 1: The Awakening", "Chapter 3: Void Drift"],
  },
  {
    id: 2,
    name: "Kaelen Thorne",
    role: "Antagonist",
    group: "MAIN CHARACTERS",
    initial: "K",
    color: "bg-red-600",
    age: "32",
    archetype: "The Fallen Paragon",
    description:
      "Former commander of the Vanguard fleet. Now operates independently, hunting down the same coordinates as Elara, but for a much darker purpose.",
    traits: ["Calculating", "Ruthless", "Charismatic"],
    relations: [
      {
        name: "Elara Vance",
        type: "Target",
        role: "Protagonist",
        init: "E",
        col: "bg-blue-600",
      },
    ],
    appearances: ["Chapter 2: The Ambush", "Chapter 5: Face to Face"],
  },
  {
    id: 3,
    name: "Darius",
    role: "Deuteragonist",
    group: "MAIN CHARACTERS",
    initial: "D",
    color: "bg-emerald-600",
    age: "28",
    archetype: "The Loyal Companion",
    description:
      "An engineer who can fix any ship engine with duct tape and willpower. He owes his life to Elara.",
    traits: ["Resourceful", "Anxious", "Brilliant"],
    relations: [
      {
        name: "Elara Vance",
        type: "Ally",
        role: "Protagonist",
        init: "E",
        col: "bg-blue-600",
      },
    ],
    appearances: [
      "Chapter 1: The Awakening",
      "Chapter 3: Void Drift",
      "Chapter 4: Repairs",
    ],
  },
  {
    id: 4,
    name: "Jax",
    role: "Mentor",
    group: "SUPPORTING",
    initial: "J",
    color: "bg-gray-800",
    age: "55",
    archetype: "The Wise Sage",
    description:
      "Retired smuggler who runs a hidden outpost on the edge of the system.",
    traits: ["Cynical", "Observant", "Protective"],
    relations: [
      {
        name: "Elara Vance",
        type: "Protégé",
        role: "Protagonist",
        init: "E",
        col: "bg-blue-600",
      },
    ],
    appearances: ["Chapter 3: Void Drift"],
  },
  {
    id: 5,
    name: "Sarah",
    role: "Ally",
    group: "SUPPORTING",
    initial: "S",
    color: "bg-indigo-600",
    age: "22",
    archetype: "The Information Broker",
    description: "A hacker who knows everyone's secrets in the lower sectors.",
    traits: ["Witty", "Greedy", "Well-connected"],
    relations: [],
    appearances: ["Chapter 2: The Ambush"],
  },
];

export function CharactersPage() {
  const [selectedChar, setSelectedChar] = useState<number | null>(1);

  const activeData = characters.find((c) => c.id === selectedChar);

  return (
    <div className="flex h-full bg-[#050505] text-zinc-300 relative">
      {/* Left Sidebar - Characters List */}
      <div className="w-[320px] border-r border-border/40 flex flex-col h-full bg-[#050505] shrink-0">
        <div className="p-6 border-b border-border/40 flex items-center justify-between">
          <h2 className="text-[13px] font-medium tracking-[0.1em] text-white">
            CHARACTERS
          </h2>
          <button
            className="p-1.5 hover:bg-white/[0.02] rounded-md transition-colors"
            onClick={() => alert("Add character modal would open")}
          >
            <Plus className="w-4 h-4 text-zinc-400 hover:text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          <CharacterGroup
            title="MAIN CHARACTERS"
            count={3}
            chars={characters.filter((c) => c.group === "MAIN CHARACTERS")}
            selected={selectedChar}
            onSelect={setSelectedChar}
          />
          <CharacterGroup
            title="SUPPORTING"
            count={2}
            chars={characters.filter((c) => c.group === "SUPPORTING")}
            selected={selectedChar}
            onSelect={setSelectedChar}
          />
          <CharacterGroup
            title="OTHERS"
            count={0}
            chars={characters.filter((c) => c.group === "OTHERS")}
            selected={selectedChar}
            onSelect={setSelectedChar}
          />
        </div>
      </div>

      {/* Main Area - Character Details */}
      <div className="flex-1 flex justify-center p-12 bg-[#0a0a0a] overflow-y-auto">
        {activeData ? (
          <div className="w-full max-w-[720px] bg-[#050505] border border-border/40 rounded-2xl shadow-sm overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-10 border-b border-border/40 flex items-start justify-between relative bg-gradient-to-b from-white/[0.02] to-transparent">
              <div className="flex gap-6 items-center">
                <Avatar className="w-24 h-24 border-2 border-[#0a0a0a] shadow-md">
                  <AvatarFallback
                    className={cn(
                      "text-3xl font-medium text-white",
                      activeData.color,
                    )}
                  >
                    {activeData.initial}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-4xl font-serif text-white mb-3 tracking-tight">
                    {activeData.name}
                  </h1>
                  <div className="flex items-center gap-3 text-[11px] font-medium tracking-wider uppercase">
                    <span
                      className={cn(
                        "px-3 py-1.5 rounded-md border",
                        activeData.group === "MAIN CHARACTERS"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
                      )}
                    >
                      {activeData.role}
                    </span>
                    <span className="px-3 py-1.5 bg-[#0a0a0a] text-zinc-400 rounded-md border border-border/40">
                      {activeData.group}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="p-2.5 bg-[#0a0a0a] rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.02] border border-transparent hover:border-white/10 transition-all tooltip-trigger"
                  title="Ask AI about character"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button className="p-2.5 bg-[#0a0a0a] rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.02] border border-transparent hover:border-white/10 transition-all">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedChar(null)}
                  className="p-2.5 bg-[#0a0a0a] rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.02] border border-transparent hover:border-white/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-10 space-y-10 overflow-y-auto max-h-[60vh] custom-scrollbar">
              <div className="grid grid-cols-2 gap-10">
                <div>
                  <label className="block text-[11px] font-medium tracking-[0.2em] text-zinc-500 mb-3 uppercase">
                    AGE / TIMELINE
                  </label>
                  <input
                    type="text"
                    value={activeData.age}
                    readOnly
                    className="w-full bg-[#0a0a0a] border border-border/40 rounded-lg px-4 py-3 text-[13px] text-white focus:outline-none focus:border-white/20 transition-colors shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium tracking-[0.2em] text-zinc-500 mb-3 uppercase">
                    ARCHETYPE
                  </label>
                  <div className="w-full bg-[#0a0a0a] border border-border/40 rounded-lg px-4 py-3 text-[13px] text-white flex items-center justify-between shadow-sm">
                    {activeData.archetype}
                    <Star className="w-4 h-4 text-zinc-600" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium tracking-[0.2em] text-zinc-500 mb-3 uppercase">
                  APPEARANCE & DESCRIPTION
                </label>
                <textarea
                  rows={4}
                  value={activeData.description}
                  readOnly
                  className="w-full bg-[#0a0a0a] border border-border/40 rounded-xl px-5 py-4 text-[13px] text-zinc-300 focus:outline-none focus:border-white/20 resize-none leading-relaxed shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium tracking-[0.2em] text-zinc-500 mb-4 uppercase">
                  PERSONALITY TRAITS
                </label>
                <div className="flex flex-wrap gap-3">
                  {activeData.traits.map((t) => (
                    <span
                      key={t}
                      className="px-4 py-2 rounded-md border border-border/40 bg-[#0a0a0a] text-[13px] text-zinc-300 font-medium shadow-sm"
                    >
                      {t}
                    </span>
                  ))}
                  <button className="px-4 py-2 rounded-md border border-dashed border-border/50 text-[13px] text-zinc-500 hover:text-white hover:bg-white/[0.02] transition-colors flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5" /> Add trait
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-[11px] font-medium tracking-[0.2em] text-zinc-500 uppercase">
                    RELATIONSHIPS
                  </label>
                  <button className="text-[11px] font-medium tracking-wide text-blue-400 hover:text-blue-300 transition-colors">
                    + Add Relation
                  </button>
                </div>
                {activeData.relations.length > 0 ? (
                  <div className="space-y-3">
                    {activeData.relations.map((rel) => (
                      <div
                        key={rel.name}
                        className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-[#0a0a0a] hover:bg-white/[0.02] transition-colors group cursor-pointer shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="w-10 h-10 border border-border/50">
                            <AvatarFallback
                              className={cn(
                                "text-[13px] font-medium text-white",
                                rel.col,
                              )}
                            >
                              {rel.init}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-[13px] font-medium text-zinc-200 group-hover:text-white transition-colors">
                              {rel.name}
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">
                              {rel.role}
                            </div>
                          </div>
                        </div>
                        <span className="px-3 py-1.5 bg-[#050505] border border-border/40 text-zinc-400 rounded-md text-[10px] uppercase tracking-[0.1em] font-medium shadow-sm">
                          {rel.type}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 border border-dashed border-border/40 rounded-xl text-center text-[13px] text-zinc-500 bg-[#0a0a0a]">
                    No established relationships.
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-[11px] font-medium tracking-[0.2em] text-zinc-500 uppercase">
                    APPEARANCES
                  </label>
                  <span className="text-[11px] font-medium tracking-wide text-zinc-500">
                    {activeData.appearances.length} Chapters
                  </span>
                </div>
                <div className="space-y-2 border-t border-border/30 pt-4">
                  {activeData.appearances.map((chap) => (
                    <div
                      key={chap}
                      className="flex items-center gap-4 text-[13px] font-medium text-zinc-400 hover:text-white cursor-pointer transition-colors p-3 rounded-lg hover:bg-[#0a0a0a]"
                    >
                      <BookOpen className="w-4 h-4 text-zinc-600" />
                      {chap}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border/40 flex items-center justify-between bg-[#0a0a0a]">
              <button className="flex items-center gap-2 text-[13px] text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-md px-4 py-2 transition-colors font-medium">
                <Trash2 className="w-4 h-4" /> Delete Character
              </button>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedChar(null)}
                  className="text-[13px] text-zinc-400 hover:text-white font-medium px-4 py-2 transition-colors"
                >
                  Close
                </button>
                <button className="text-[13px] text-black bg-white hover:bg-zinc-200 font-medium px-6 py-2.5 rounded-md transition-colors shadow-sm">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-zinc-500 flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-full border border-dashed border-zinc-700 flex items-center justify-center mb-2 bg-[#050505]">
              <Plus className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-[15px] leading-relaxed">
              Select a character to view details
              <br />
              or create a new one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CharacterGroup({ title, count, chars, selected, onSelect }: any) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 px-2">
        <span className="text-[11px] font-medium tracking-[0.2em] text-zinc-500 uppercase">
          {title}
        </span>
        <span className="text-[11px] font-medium text-zinc-600">{count}</span>
      </div>
      {chars.length === 0 ? (
        <div className="p-5 border border-dashed border-border/40 rounded-xl text-center text-[13px] text-zinc-600 flex items-center justify-center bg-[#0a0a0a]">
          No characters
        </div>
      ) : (
        <div className="space-y-1.5">
          {chars.map((c: any) => (
            <div
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-all",
                selected === c.id
                  ? "bg-white/[0.06] shadow-sm border border-border/40"
                  : "hover:bg-white/[0.02] border border-transparent",
              )}
            >
              <div className="flex items-center gap-4">
                <Avatar className="w-10 h-10 border border-border/50 shadow-sm">
                  <AvatarFallback
                    className={cn(
                      "text-[13px] font-medium text-white",
                      c.color,
                    )}
                  >
                    {c.initial}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div
                    className={cn(
                      "text-[13px] font-medium",
                      selected === c.id
                        ? "text-white"
                        : "text-zinc-300 group-hover:text-white",
                    )}
                  >
                    {c.name}
                  </div>
                  <div
                    className={cn(
                      "text-[11px] mt-0.5",
                      selected === c.id ? "text-blue-400" : "text-zinc-500",
                    )}
                  >
                    {c.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
