import React, { useState, useEffect } from "react";
import { cn } from "../components/ui/utils";
import { motion } from "motion/react";

export function EditorPage() {
  const [zenMode, setZenMode] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "f" && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setZenMode((p) => !p);
      }
      if (e.key === "Escape" && zenMode) {
        setZenMode(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [zenMode]);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0D0D0D] relative">
      {/* Editor Content */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="max-w-[720px] mx-auto w-full px-[32px] pt-[48px] pb-[40vh]">
          {/* Title */}
          <h1
            className="text-[32px] font-bold text-[#F0F0F0] leading-[1.25] tracking-[-0.01em]"
            style={{ fontFamily: "'Source Serif 4', 'Noto Serif SC', Georgia, serif" }}
          >
            The Aesthetics of Silence
          </h1>

          {/* Metadata */}
          <div className="mt-[8px] flex items-center gap-[8px] text-[12px] text-[#888888] leading-[1.4]">
            <span>Project Phoenix › Chapter 12</span>
            <span>｜</span>
            <span>12,400 字</span>
            <span>｜</span>
            <span>约 28 分钟阅读</span>
            <span>｜</span>
            <span>3 分钟前保存</span>
          </div>

          {/* Body text */}
          <div
            className="mt-[32px] space-y-[16px]"
            style={{ fontFamily: "'Source Serif 4', 'Noto Serif SC', Georgia, serif" }}
          >
            <p className="text-[16px] font-normal text-[#CCCCCC] leading-[1.8]">
              In a world of noise, silence is a luxury. Our interfaces recede,
              allowing the content to breathe. The use of negative space is
              deliberate, creating a rhythm that guides the user through the
              narrative without friction.
            </p>

            {/* H1 */}
            <h2
              className="text-[28px] font-bold text-[#F0F0F0] leading-[1.2] tracking-[-0.01em] mt-[40px] mb-[16px]"
              style={{ fontFamily: "'Source Serif 4', 'Noto Serif SC', Georgia, serif" }}
            >
              1. Introduction
            </h2>

            <p className="text-[16px] font-normal text-[#CCCCCC] leading-[1.8]">
              Silence in design is not merely the absence of sound or content; it
              is a structural element that shapes perception. Just as a pause in
              music defines the melody, empty space defines the interface.
            </p>

            <p className="text-[16px] font-normal text-[#CCCCCC] leading-[1.8]">
              We observe that modern tools often clutter the workspace. Here, we
              strip away the non-essential. The focus returns to the word, the
              thought, the raw input.
            </p>

            {/* H2 */}
            <h3
              className="text-[22px] font-semibold text-[#F0F0F0] leading-[1.3] mt-[32px] mb-[12px]"
              style={{ fontFamily: "'Source Serif 4', 'Noto Serif SC', Georgia, serif" }}
            >
              2. Historical Context
            </h3>

            {/* H3 */}
            <h4
              className="text-[18px] font-semibold text-[#F0F0F0] leading-[1.35] mt-[24px] mb-[8px]"
              style={{ fontFamily: "'Source Serif 4', 'Noto Serif SC', Georgia, serif" }}
            >
              2.1 Early 20th Century
            </h4>

            <p className="text-[16px] font-normal text-[#CCCCCC] leading-[1.8]">
              The roots of digital minimalism can be traced back to the Bauhaus
              movement and Swiss Style typography, where form followed function
              with ruthless efficiency.
            </p>

            {/* Blockquote */}
            <blockquote className="border-l-[3px] border-[#3A3A3A] pl-[16px] my-[16px]">
              <p className="text-[16px] italic text-[#888888] leading-[1.8]" style={{ fontFamily: "'Source Serif 4', 'Noto Serif SC', Georgia, serif" }}>
                "Less is more" — the reduction of visual elements to their
                essence was not a limitation, but a liberation.
              </p>
            </blockquote>

            <h4
              className="text-[18px] font-semibold text-[#F0F0F0] leading-[1.35] mt-[24px] mb-[8px]"
              style={{ fontFamily: "'Source Serif 4', 'Noto Serif SC', Georgia, serif" }}
            >
              2.2 Post-War Minimalism
            </h4>

            <p className="text-[16px] font-normal text-[#CCCCCC] leading-[1.8]">
              Artists like Donald Judd and Agnes Martin demonstrated that
              reduction could lead to profound emotional resonance. This principle
              applies directly to interface design: by removing distractions, we
              amplify the signal.
            </p>

            {/* Agent generated inline block */}
            <div className="relative bg-[rgba(122,162,247,0.06)] border-l-[2px] border-[#7AA2F7] rounded-l-[1px] pl-[16px] py-[12px]">
              <div className="flex items-center gap-[16px] mb-[8px]">
                <button className="text-[13px] font-medium text-[#4ADE80]">✓ Accept</button>
                <button className="text-[13px] font-medium text-[#F87171]">✕ Reject</button>
                <button className="text-[13px] font-medium text-[#555555]">↻ Regenerate</button>
              </div>
              <p className="text-[16px] font-normal text-[#CCCCCC] leading-[1.8]" style={{ fontFamily: "'Source Serif 4', 'Noto Serif SC', Georgia, serif" }}>
                The convergence of technology and artistic expression found its
                most powerful voice in the digital age, where the canvas became
                infinite yet the need for restraint grew ever more urgent.
              </p>
            </div>

            {/* Code block */}
            <div className="bg-[#111111] rounded-[6px] p-[16px] overflow-x-auto">
              <pre className="text-[14px] text-[#CCCCCC] leading-[1.6]" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
{`const silence = {
  visual: "negative space",
  temporal: "deliberate pause",
  cognitive: "reduced load"
};`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div
        className={cn(
          "h-[32px] bg-[#1A1A1A] border-t border-[#2A2A2A] flex items-center justify-between px-[16px] shrink-0 z-[10] transition-opacity duration-300",
          zenMode ? "opacity-30 hover:opacity-100" : "opacity-100"
        )}
      >
        <div className="flex items-center gap-[8px] text-[12px] text-[#888888] leading-[1.4]">
          <span>12,400 字</span>
          <span className="text-[#2A2A2A]">｜</span>
          <span>24,800 字符</span>
          <span className="text-[#2A2A2A]">｜</span>
          <span>第 12 章 — 觉醒</span>
        </div>
        <div className="flex items-center gap-[8px]">
          <span className="text-[12px] text-[#888888] leading-[1.4]">专注模式</span>
          <button
            onClick={() => setZenMode(!zenMode)}
            className={cn(
              "w-[24px] h-[14px] rounded-full relative transition-colors duration-150",
              zenMode ? "bg-[#F0F0F0]" : "bg-[#2A2A2A]"
            )}
          >
            <div
              className={cn(
                "w-[10px] h-[10px] rounded-full absolute top-[2px] transition-all duration-150",
                zenMode ? "left-[12px] bg-[#0D0D0D]" : "left-[2px] bg-[#888888]"
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}