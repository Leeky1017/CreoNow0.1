import React, { useState, useRef, useEffect } from "react";
import { cn } from "../components/ui/utils";
import {
  Plus,
  Search,
  User,
  Bot,
  AlertTriangle,
  BarChart2,
  Lightbulb,
  X,
  Check,
  Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Character {
  id: number;
  name: string;
  role: string;
  group: string;
  age: string;
  archetype: string;
  description: string;
  traits: string[];
  relations: { name: string; type: string; id: number }[];
  appearances: { chapter: string; count: number; time: string }[];
  agentInsights: { type: string; text: string }[];
}

const initialCharacters: Character[] = [
  {
    id: 1,
    name: "Elara Vance",
    role: "主角",
    group: "主要角色",
    age: "24",
    archetype: "The Reluctant Hero",
    description:
      "A skilled pilot with a mysterious past, determined to find the lost coordinates of Earth. She wears a faded flight jacket with an emblem no one recognizes.",
    traits: ["Brave", "Impulsive", "Loyal"],
    relations: [
      { name: "Kaelen Thorne", type: "Rival", id: 2 },
      { name: "Jax", type: "Mentor", id: 4 },
    ],
    appearances: [
      { chapter: "Chapter 1: The Awakening", count: 12, time: "2d ago" },
      { chapter: "Chapter 3: Void Drift", count: 8, time: "5d ago" },
      { chapter: "Chapter 5: Face to Face", count: 3, time: "1w ago" },
    ],
    agentInsights: [
      {
        type: "warn",
        text: "潜在不一致：Elara 的眼睛颜色在第 3 章（碧绿）和第 7 章（深蓝）的描述不同",
      },
      {
        type: "stat",
        text: "Elara 在 23 个场景中出现，主要与 Marcus 互动（15 次）",
      },
      {
        type: "suggest",
        text: "人物弧光评估：目前缺少明确的内在冲突转折点，建议在第 15-18 章加入",
      },
    ],
  },
  {
    id: 2,
    name: "Kaelen Thorne",
    role: "反派",
    group: "主要角色",
    age: "32",
    archetype: "The Fallen Paragon",
    description:
      "Former commander of the Vanguard fleet. Now operates independently, hunting down the same coordinates as Elara.",
    traits: ["Calculating", "Ruthless", "Charismatic"],
    relations: [{ name: "Elara Vance", type: "Target", id: 1 }],
    appearances: [
      { chapter: "Chapter 2: The Ambush", count: 6, time: "3d ago" },
    ],
    agentInsights: [
      { type: "suggest", text: "角色动机需要更多层次，建议加入同情面" },
    ],
  },
  {
    id: 3,
    name: "Darius",
    role: "伙伴",
    group: "主要角色",
    age: "28",
    archetype: "The Loyal Companion",
    description:
      "An engineer who can fix any ship engine with duct tape and willpower.",
    traits: ["Resourceful", "Anxious", "Brilliant"],
    relations: [{ name: "Elara Vance", type: "Ally", id: 1 }],
    appearances: [
      { chapter: "Chapter 1: The Awakening", count: 9, time: "2d ago" },
    ],
    agentInsights: [],
  },
  {
    id: 4,
    name: "Jax",
    role: "导师",
    group: "次要角色",
    age: "55",
    archetype: "The Wise Sage",
    description:
      "Retired smuggler who runs a hidden outpost on the edge of the system.",
    traits: ["Cynical", "Observant"],
    relations: [{ name: "Elara Vance", type: "Protégé", id: 1 }],
    appearances: [
      { chapter: "Chapter 3: Void Drift", count: 4, time: "5d ago" },
    ],
    agentInsights: [],
  },
  {
    id: 5,
    name: "Sarah",
    role: "信息贩子",
    group: "次要角色",
    age: "22",
    archetype: "The Information Broker",
    description: "A hacker who knows everyone's secrets in the lower sectors.",
    traits: ["Witty", "Greedy"],
    relations: [],
    appearances: [],
    agentInsights: [],
  },
];

const groups = ["主要角色", "次要角色"];

export function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>(initialCharacters);
  const [selectedId, setSelectedId] = useState<number | null>(1);
  const [searchTerm, setSearchTerm] = useState("");
  const active = characters.find((c) => c.id === selectedId) ?? null;

  const filtered = characters.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const updateCharacter = (id: number, updates: Partial<Character>) => {
    setCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
  };

  return (
    <div className="flex h-full bg-[#0D0D0D] text-[#F0F0F0] relative">
      {/* Left Panel - Character List */}
      <div className="w-[300px] bg-[#141414] border-r border-[#1E1E1E] flex flex-col h-full shrink-0">
        {/* Search */}
        <div className="p-[12px_16px]">
          <div className="flex items-center h-[36px] bg-[#111111] border border-[#1E1E1E] rounded-[6px] px-[8px] gap-[8px] focus-within:border-[#2A2A2A] transition-colors duration-200">
            <Search className="w-[14px] h-[14px] text-[#555555] shrink-0" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索角色…"
              className="flex-1 bg-transparent text-[13px] text-[#F0F0F0] placeholder:text-[#3A3A3A] outline-none"
            />
          </div>
        </div>

        {/* Groups */}
        <div className="flex-1 overflow-y-auto">
          {groups.map((group) => {
            const groupChars = filtered.filter((c) => c.group === group);
            return (
              <div key={group} className="mb-[4px]">
                <div className="sticky top-0 z-[10] bg-[#141414] flex items-center justify-between h-[32px] px-[16px]">
                  <span className="text-[11px] font-medium text-[#555555] uppercase tracking-[0.06em]">
                    {group}
                  </span>
                  <span className="min-w-[18px] h-[16px] bg-[#1E1E1E] rounded-full flex items-center justify-center text-[10px] font-medium text-[#555555] px-[4px]">
                    {groupChars.length}
                  </span>
                </div>
                {groupChars.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "flex items-center h-[56px] px-[16px] gap-[12px] cursor-pointer transition-all duration-150",
                      selectedId === c.id
                        ? "bg-[rgba(255,255,255,0.04)] border-l-[2px] border-l-[#E0E0E0]"
                        : "hover:bg-[rgba(255,255,255,0.02)] border-l-[2px] border-l-transparent",
                    )}
                  >
                    <div className="w-[36px] h-[36px] rounded-full bg-[#1E1E1E] flex items-center justify-center shrink-0">
                      <User className="w-[16px] h-[16px] text-[#555555]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-[#CCCCCC] truncate">
                        {c.name}
                      </div>
                      <div className="text-[11px] text-[#555555] mt-[2px]">
                        {c.role}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="p-[12px_16px] border-t border-[#1E1E1E] space-y-[8px]">
          <button className="w-full h-[36px] bg-[#1E1E1E] border border-[#2A2A2A] rounded-[6px] text-[13px] font-medium text-[#CCCCCC] hover:bg-[#2A2A2A] transition-colors duration-150 flex items-center justify-center gap-[8px]">
            <Plus className="w-[14px] h-[14px]" /> 新建角色
          </button>
          <button className="w-full h-[36px] bg-[#1E1E1E] border border-[#2A2A2A] rounded-[6px] text-[13px] font-medium text-[#7AA2F7] hover:bg-[#2A2A2A] transition-colors duration-150 flex items-center justify-center gap-[8px]">
            <Bot className="w-[14px] h-[14px] text-[#7AA2F7]" /> Creo 建议角色
          </button>
        </div>
      </div>

      {/* Right Panel - Character Detail */}
      <div className="flex-1 overflow-y-auto">
        {active ? (
          <CharacterDetail
            character={active}
            onUpdate={(updates) => updateCharacter(active.id, updates)}
            onSelectCharacter={setSelectedId}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center h-full text-center">
            <User className="w-[40px] h-[40px] text-[#333333] mb-[8px]" />
            <p className="text-[14px] text-[#555555]">选择一个角色查看详情</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────── Editable Inline Field ────── */
function EditableField({
  value,
  onChange,
  label,
  multiline = false,
}: {
  value: string;
  onChange: (val: string) => void;
  label: string;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [editing]);

  const save = () => {
    onChange(draft);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-start gap-[8px]">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                save();
              }
              if (e.key === "Escape") cancel();
            }}
            rows={3}
            className="flex-1 bg-[#111111] border border-[#2A2A2A] rounded-[4px] px-[8px] py-[6px] text-[14px] text-[#F0F0F0] outline-none focus:border-[#3A3A3A] resize-none leading-[1.6] transition-colors duration-150"
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") cancel();
            }}
            className="flex-1 bg-[#111111] border border-[#2A2A2A] rounded-[4px] px-[8px] py-[4px] text-[14px] text-[#F0F0F0] outline-none focus:border-[#3A3A3A] transition-colors duration-150"
          />
        )}
        <button
          onClick={save}
          className="p-[4px] text-[#4ADE80] hover:text-[#6EE7A0] transition-colors"
        >
          <Check className="w-[14px] h-[14px]" />
        </button>
        <button
          onClick={cancel}
          className="p-[4px] text-[#888888] hover:text-[#F0F0F0] transition-colors"
        >
          <X className="w-[14px] h-[14px]" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="group flex items-start gap-[6px] cursor-pointer"
      onClick={() => setEditing(true)}
    >
      {multiline ? (
        <p className="text-[14px] text-[#CCCCCC] leading-[1.6] flex-1">
          {value || (
            <span className="text-[#555555] italic">Click to edit…</span>
          )}
        </p>
      ) : (
        <span className="text-[14px] text-[#F0F0F0]">
          {value || <span className="text-[#555555] italic">—</span>}
        </span>
      )}
      <Pencil className="w-[12px] h-[12px] text-[#333333] group-hover:text-[#888888] transition-colors mt-[3px] shrink-0" />
    </div>
  );
}

/* ────── Editable Traits ────── */
function EditableTraits({
  traits,
  onChange,
}: {
  traits: string[];
  onChange: (traits: string[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newTrait, setNewTrait] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) setTimeout(() => inputRef.current?.focus(), 50);
  }, [adding]);

  const addTrait = () => {
    if (newTrait.trim()) {
      onChange([...traits, newTrait.trim()]);
      setNewTrait("");
      setAdding(false);
    }
  };

  const removeTrait = (index: number) => {
    onChange(traits.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-wrap gap-[8px] items-center">
      {traits.map((t, i) => (
        <span
          key={`${t}-${i}`}
          className="h-[26px] px-[10px] bg-[#1E1E1E] border border-[#2A2A2A] rounded-full text-[12px] font-medium text-[#CCCCCC] flex items-center gap-[6px] group"
        >
          {t}
          <button
            onClick={() => removeTrait(i)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-[#888888] hover:text-[#F87171]"
          >
            <X className="w-[10px] h-[10px]" />
          </button>
        </span>
      ))}
      {adding ? (
        <div className="flex items-center gap-[4px]">
          <input
            ref={inputRef}
            value={newTrait}
            onChange={(e) => setNewTrait(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTrait();
              if (e.key === "Escape") {
                setAdding(false);
                setNewTrait("");
              }
            }}
            placeholder="New trait"
            className="h-[26px] w-[100px] bg-[#111111] border border-[#2A2A2A] rounded-full px-[10px] text-[12px] text-[#F0F0F0] outline-none focus:border-[#3A3A3A] placeholder:text-[#555555]"
          />
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="h-[26px] w-[26px] rounded-full border border-dashed border-[#2A2A2A] flex items-center justify-center text-[#555555] hover:text-[#888888] hover:border-[#3A3A3A] transition-colors"
        >
          <Plus className="w-[12px] h-[12px]" />
        </button>
      )}
    </div>
  );
}

/* ────── Character Detail ────── */
function CharacterDetail({
  character,
  onUpdate,
  onSelectCharacter,
}: {
  character: Character;
  onUpdate: (updates: Partial<Character>) => void;
  onSelectCharacter: (id: number) => void;
}) {
  return (
    <motion.div
      key={character.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="max-w-[720px] mx-auto pt-[40px] pb-[64px] px-[24px]"
    >
      {/* Name + Archetype */}
      <div className="flex items-center gap-[16px] mb-[8px]">
        <div className="w-[56px] h-[56px] rounded-full bg-[#1E1E1E] border border-[#2A2A2A] flex items-center justify-center shrink-0">
          <User className="w-[24px] h-[24px] text-[#555555]" />
        </div>
        <div className="flex-1">
          <EditableField
            label="Name"
            value={character.name}
            onChange={(name) => onUpdate({ name })}
          />
          <div className="mt-[8px]">
            <span className="text-[11px] font-medium text-[#555555] bg-[#1E1E1E] border border-[#2A2A2A] rounded-full px-[10px] py-[3px]">
              {character.archetype}
            </span>
          </div>
        </div>
      </div>

      {/* Structured Fields */}
      <div className="mt-[28px] grid grid-cols-2 gap-x-[24px] gap-y-[20px]">
        <FieldBlock label="年龄">
          <EditableField
            label="Age"
            value={character.age}
            onChange={(age) => onUpdate({ age })}
          />
        </FieldBlock>
        <FieldBlock label="原型">
          <EditableField
            label="Archetype"
            value={character.archetype}
            onChange={(archetype) => onUpdate({ archetype })}
          />
        </FieldBlock>
        <FieldBlock label="阵营">
          <EditableField
            label="Role"
            value={character.role}
            onChange={(role) => onUpdate({ role })}
          />
        </FieldBlock>
        <FieldBlock label="首次出场">
          <span className="text-[14px] text-[#F0F0F0]">
            {character.appearances[0]?.chapter || "—"}
          </span>
        </FieldBlock>
      </div>

      {/* Description */}
      <div className="mt-[24px]">
        <span className="text-[11px] text-[#555555] leading-[1.4] uppercase tracking-[0.06em]">
          外貌与描述
        </span>
        <div className="mt-[8px]">
          <EditableField
            label="Description"
            value={character.description}
            onChange={(description) => onUpdate({ description })}
            multiline
          />
        </div>
      </div>

      {/* Traits */}
      <div className="mt-[24px]">
        <span className="text-[11px] text-[#555555] leading-[1.4] uppercase tracking-[0.06em]">
          性格特征
        </span>
        <div className="mt-[10px]">
          <EditableTraits
            traits={character.traits}
            onChange={(traits) => onUpdate({ traits })}
          />
        </div>
      </div>

      {/* Relations */}
      <div className="mt-[36px]">
        <div className="flex items-center justify-between mb-[12px]">
          <h3 className="text-[14px] font-semibold text-[#F0F0F0] leading-[1.4] uppercase tracking-[0.01em]">
            关系网络
          </h3>
          <button className="text-[#555555] hover:text-[#888888] transition-colors duration-150">
            <Plus className="w-[16px] h-[16px]" />
          </button>
        </div>
        {character.relations.length > 0 ? (
          <div className="flex flex-wrap gap-[12px]">
            {character.relations.map((r) => (
              <div
                key={r.name}
                onClick={() => onSelectCharacter(r.id)}
                className="w-[200px] h-[72px] bg-[#141414] border border-[#1E1E1E] rounded-[8px] p-[12px] hover:border-[#2A2A2A] transition-colors duration-150 cursor-pointer flex items-center gap-[12px]"
              >
                <div className="w-[32px] h-[32px] rounded-full bg-[#1E1E1E] flex items-center justify-center shrink-0">
                  <User className="w-[14px] h-[14px] text-[#555555]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-[#555555]">{r.type}</div>
                  <div className="text-[13px] font-medium text-[#CCCCCC] mt-[2px] truncate">
                    {r.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[13px] text-[#3A3A3A]">暂无关系数据</div>
        )}
      </div>

      {/* Appearances */}
      <div className="mt-[36px]">
        <div className="flex items-center justify-between mb-[12px]">
          <h3 className="text-[14px] font-semibold text-[#F0F0F0] leading-[1.4] uppercase tracking-[0.01em]">
            出场统计
          </h3>
          <span className="min-w-[18px] h-[16px] bg-[#1E1E1E] rounded-full flex items-center justify-center text-[10px] font-medium text-[#555555] px-[4px]">
            {character.appearances.length}
          </span>
        </div>
        {character.appearances.length > 0 ? (
          <div className="flex flex-col">
            {character.appearances.map((a, i) => (
              <div key={a.chapter}>
                <div className="flex items-center h-[40px] hover:bg-[rgba(255,255,255,0.02)] rounded-[4px] px-[8px] -mx-[8px] transition-colors duration-100 cursor-pointer">
                  <span className="flex-1 text-[13px] text-[#CCCCCC]">
                    {a.chapter}
                  </span>
                  <span className="text-[12px] text-[#555555] mr-[16px] tabular-nums">
                    {a.count} 次
                  </span>
                  <span className="text-[12px] text-[#555555]">{a.time}</span>
                </div>
                {i < character.appearances.length - 1 && (
                  <div className="h-[1px] bg-[#1E1E1E]" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[13px] text-[#3A3A3A]">暂无出场数据</div>
        )}
      </div>

      {/* Agent Analysis */}
      {character.agentInsights.length > 0 && (
        <div className="mt-[36px]">
          <div className="flex items-center gap-[8px] mb-[12px]">
            <div className="w-[3px] h-[16px] bg-[#7AA2F7] rounded-full shrink-0" />
            <h3 className="text-[14px] font-semibold text-[#F0F0F0] leading-[1.4] uppercase tracking-[0.01em]">
              Creo 分析
            </h3>
          </div>
          <div className="flex flex-col gap-[12px]">
            {character.agentInsights.map((insight, i) => (
              <div
                key={i}
                className="flex items-start gap-[12px] hover:bg-[rgba(255,255,255,0.02)] rounded-[6px] p-[10px] -mx-[10px] transition-colors duration-100 cursor-pointer"
              >
                {insight.type === "warn" && (
                  <AlertTriangle className="w-[14px] h-[14px] text-[#F87171] shrink-0 mt-[2px]" />
                )}
                {insight.type === "stat" && (
                  <BarChart2 className="w-[14px] h-[14px] text-[#555555] shrink-0 mt-[2px]" />
                )}
                {insight.type === "suggest" && (
                  <Lightbulb className="w-[14px] h-[14px] text-[#7AA2F7] shrink-0 mt-[2px]" />
                )}
                <span className="text-[13px] text-[#888888] leading-[1.65] line-clamp-2">
                  {insight.text}
                </span>
              </div>
            ))}
          </div>
          <button className="mt-[16px] text-[12px] text-[#555555] hover:text-[#888888] transition-colors duration-150 cursor-pointer">
            重新分析
          </button>
        </div>
      )}
    </motion.div>
  );
}

function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="text-[11px] text-[#555555] leading-[1.4] uppercase tracking-[0.06em]">
        {label}
      </span>
      <div className="mt-[6px]">{children}</div>
    </div>
  );
}
