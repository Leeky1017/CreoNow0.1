import React, { useState } from "react";
import { cn } from "../ui/utils";
import {
  Clock,
  Copy,
  RefreshCw,
  FileInput,
  ArrowUp,
  Bot,
} from "lucide-react";

interface RightSidebarProps {
  onToggleCollapse: () => void;
}

export function RightSidebar({ onToggleCollapse }: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<"AGENT" | "INFO">("AGENT");

  return (
    <div
      className="flex flex-col h-full bg-[#0D0D0D] w-full border-l border-[#1E1E1E] overflow-hidden"
      role="complementary"
      aria-label="Creo Agent"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-[16px] h-[44px] border-b border-[#1E1E1E] shrink-0">
        <div className="flex items-center gap-[16px]">
          <button
            onClick={() => setActiveTab("AGENT")}
            className={cn(
              "text-[11px] font-medium tracking-[0.06em] uppercase transition-all h-[44px] border-b-[2px]",
              activeTab === "AGENT"
                ? "border-[#7AA2F7] text-[#F0F0F0]"
                : "border-transparent text-[#555555] hover:text-[#888888]"
            )}
          >
            AGENT
          </button>
          <button
            onClick={() => setActiveTab("INFO")}
            className={cn(
              "text-[11px] font-medium tracking-[0.06em] uppercase transition-all h-[44px] border-b-[2px]",
              activeTab === "INFO"
                ? "border-[#7AA2F7] text-[#F0F0F0]"
                : "border-transparent text-[#555555] hover:text-[#888888]"
            )}
          >
            INFO
          </button>
        </div>
        <div className="flex items-center gap-[4px]">
          <button
            className="text-[#555555] hover:text-[#888888] transition-colors duration-150 p-[6px] rounded-[4px] hover:bg-[#1E1E1E]"
            aria-label="历史记录"
          >
            <Clock className="w-[14px] h-[14px]" />
          </button>
          <button
            onClick={onToggleCollapse}
            className="text-[#555555] hover:text-[#888888] transition-colors duration-150 p-[6px] rounded-[4px] hover:bg-[#1E1E1E]"
            aria-label="收起面板"
          >
            <svg
              className="w-[14px] h-[14px]"
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

      {/* Context indicator */}
      <div className="flex items-center justify-between px-[16px] h-[36px] border-b border-[#1E1E1E] shrink-0">
        <span className="text-[11px] text-[#555555]">
          Context：第 12 章 — 觉醒
        </span>
        <label className="flex items-center gap-[4px] text-[10px] text-[#555555]">
          Inline
          <div className="w-[28px] h-[16px] bg-[#1E1E1E] rounded-full relative cursor-pointer">
            <div className="w-[12px] h-[12px] bg-[#555555] rounded-full absolute top-[2px] left-[2px]" />
          </div>
        </label>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === "AGENT" ? <AgentTab /> : <InfoTab />}
      </div>
    </div>
  );
}

function AgentTab() {
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D]">
      {/* Conversation Thread */}
      <div className="flex-1 overflow-y-auto px-[16px] py-[24px] space-y-[24px]">
        {/* User Instruction */}
        <div className="flex flex-col gap-[8px]">
          <div className="text-[12px] font-medium text-[#555555]">
            Generate a character profile
          </div>

          {/* Agent Response */}
          <div className="pl-[12px] border-l-[2px] border-[#7AA2F7] rounded-l-[1px] flex flex-col gap-[12px] group relative">
            <div className="text-[13px] text-[#888888] leading-[1.65]">
              Here is a character profile outline you can start with. It covers
              background, motivations, and conflicts.
            </div>

            {/* Code/content block */}
            <div className="rounded-[6px] border border-[#1E1E1E] bg-[#111111] overflow-hidden">
              <div className="flex items-center justify-between px-[12px] py-[8px] border-b border-[#1E1E1E]">
                <span className="text-[11px] font-mono tracking-wider text-[#555555]">
                  MARKDOWN
                </span>
                <button className="text-[11px] font-medium text-[#7AA2F7] hover:text-[#8BB3F8] flex items-center gap-[4px] transition-colors duration-100">
                  <FileInput className="w-[11px] h-[11px]" /> Apply to Editor
                </button>
              </div>
              <pre className="p-[12px] text-[12px] font-mono text-[#888888] overflow-x-auto leading-[1.6]">
                <span className="text-[#CCCCCC]">#</span> Character Name: Elias
                Thorne
                <br />
                <span className="text-[#CCCCCC]">##</span> Background
                <br />
                Born in the silent sectors of the outer rim...
              </pre>
            </div>

            {/* Hover action bar */}
            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-100 flex items-center gap-[4px]">
              <button
                className="w-[24px] h-[24px] flex items-center justify-center text-[#555555] hover:text-[#888888] transition-colors duration-100"
                aria-label="复制"
              >
                <Copy className="w-[13px] h-[13px]" />
              </button>
              <button
                className="w-[24px] h-[24px] flex items-center justify-center text-[#7AA2F7] hover:text-[#8BB3F8] transition-colors duration-100"
                aria-label="应用到文档"
              >
                <FileInput className="w-[13px] h-[13px]" />
              </button>
              <button
                className="w-[24px] h-[24px] flex items-center justify-center text-[#555555] hover:text-[#888888] transition-colors duration-100"
                aria-label="重新生成"
              >
                <RefreshCw className="w-[13px] h-[13px]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick action chips */}
      <div className="px-[16px] h-[36px] flex items-center gap-[6px] overflow-x-auto shrink-0 scrollbar-hide">
        {["续写", "总结本章", "查找情节漏洞", "生成对话", "分析人物弧光"].map(
          (chip) => (
            <button
              key={chip}
              className="h-[26px] px-[12px] bg-[#141414] border border-[#1E1E1E] rounded-full text-[11px] font-medium text-[#888888] hover:bg-[#1E1E1E] hover:text-[#CCCCCC] transition-colors duration-100 whitespace-nowrap shrink-0"
            >
              {chip}
            </button>
          )
        )}
      </div>

      {/* Input Area */}
      <div className="p-[12px_16px] border-t border-[#1E1E1E] shrink-0">
        <div className="flex items-center bg-[#111111] border border-[#1E1E1E] rounded-[6px] px-[12px] py-[8px] focus-within:border-[#2A2A2A] transition-colors duration-200">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="让 Creo 帮你写、改、分析…"
            className="flex-1 bg-transparent text-[#F0F0F0] text-[13px] placeholder:text-[#3A3A3A] outline-none font-sans"
          />
          <button
            className={cn(
              "w-[24px] h-[24px] rounded-full flex items-center justify-center transition-colors duration-100 ml-[8px]",
              inputValue
                ? "text-[#7AA2F7] hover:text-[#8BB3F8]"
                : "text-[#555555]"
            )}
            aria-label="发送"
          >
            <ArrowUp className="w-[12px] h-[12px]" />
          </button>
        </div>
        <div className="mt-[8px] text-[11px] text-[#3A3A3A] flex items-center justify-between">
          <span>Enter 发送，Shift+Enter 换行</span>
          <span>
            Context: <span className="text-[#555555]">Current File</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function InfoTab() {
  return (
    <div className="p-[16px] text-[13px] text-[#555555] leading-[1.6]">
      Select an entity in the editor to see its knowledge graph and
      relationships here.
    </div>
  );
}
