import React, { useState } from "react";
import {
  FileText,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  Sparkles,
  Clock,
  Flame,
  Target,
  TrendingUp,
  Pen,
} from "lucide-react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { cn } from "../components/ui/utils";

/* ────── Mock Data ────── */
const recentDocs = [
  {
    id: "1",
    title: "The Future of Neural Interfaces",
    project: "Project Phoenix",
    wordsChange: 1240,
    time: "2h ago",
    progress: 68,
  },
  {
    id: "2",
    title: "Chapter 12: 觉醒",
    project: "CreoNow Novel",
    wordsChange: 860,
    time: "3h ago",
    progress: 45,
  },
  {
    id: "3",
    title: "Design System Architecture",
    project: "Technical Docs",
    wordsChange: -120,
    time: "5h ago",
    progress: 92,
  },
  {
    id: "4",
    title: "Character Arc Analysis",
    project: "Project Phoenix",
    wordsChange: 0,
    time: "Yesterday",
    progress: 30,
  },
  {
    id: "5",
    title: "Notes on Minimalism",
    project: "Journal",
    wordsChange: 420,
    time: "2d ago",
    progress: 15,
  },
];

const agentInsights = [
  {
    text: "第 12 章有一条未解决的伏笔——Elara 提到的钥匙至今未出现",
    type: "plot",
  },
  {
    text: "你的写作速度在周二上午 9-11 点达到峰值（1,200 字/小时）",
    type: "rhythm",
  },
  {
    text: "角色 Marcus 已连续 3 章未出场，考虑在下一章重新引入",
    type: "character",
  },
];

const heatmapData = [
  [0, 500, 1200, 800, 3200, 200, 0],
  [1800, 0, 900, 2400, 0, 1500, 600],
  [0, 3500, 1100, 0, 800, 2000, 1200],
  [2200, 1400, 0, 600, 1900, 0, 0],
  [0, 0, 2800, 1600, 400, 3100, 0],
];

function getHeatColor(val: number) {
  if (val === 0) return "bg-[#141414] border border-[#1E1E1E]";
  if (val <= 500) return "bg-[#1E1E1E]";
  if (val <= 1500) return "bg-[#333333]";
  if (val <= 3000) return "bg-[#666666]";
  return "bg-[#E0E0E0]";
}

const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

/* ────── Stagger animation ────── */
const stagger = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.06 },
});

export function DashboardPage() {
  const navigate = useNavigate();
  const [quickNote, setQuickNote] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleQuickSave = () => {
    if (!quickNote.trim()) return;
    setQuickNote("");
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 1200);
  };

  const weeklyActual = 12400;
  const weeklyGoal = 20000;
  const weeklyPct = Math.round((weeklyActual / weeklyGoal) * 100);

  const todayWords = 2450;
  const streakDays = 14;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0D0D0D]">
      <div className="max-w-[1120px] mx-auto px-[32px] pt-[40px] pb-[64px]">
        {/* Greeting */}
        <motion.div {...stagger(0)} className="mb-[32px]">
          <h1 className="text-[32px] font-bold text-[#F0F0F0] leading-[1.2] tracking-[-0.02em]">
            Good evening
          </h1>
          <p className="mt-[8px] text-[14px] text-[#888888] leading-[1.6]">
            Pick up where you left off, or start something new.
          </p>
        </motion.div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-4 gap-[16px] mb-[24px]">
          <motion.div
            {...stagger(1)}
            className="bg-[#141414] border border-[#1E1E1E] rounded-[8px] p-[16px] group hover:border-[#2A2A2A] transition-colors duration-200"
          >
            <div className="flex items-center gap-[8px] mb-[8px]">
              <Pen className="w-[14px] h-[14px] text-[#555555]" />
              <span className="text-[12px] text-[#555555] tracking-[0.04em] uppercase">
                Today
              </span>
            </div>
            <span className="text-[28px] font-bold text-[#F0F0F0] leading-[1.1] tracking-[-0.02em]">
              {todayWords.toLocaleString()}
            </span>
            <span className="text-[12px] text-[#555555] ml-[4px]">words</span>
          </motion.div>

          <motion.div
            {...stagger(1.5)}
            className="bg-[#141414] border border-[#1E1E1E] rounded-[8px] p-[16px] group hover:border-[#2A2A2A] transition-colors duration-200"
          >
            <div className="flex items-center gap-[8px] mb-[8px]">
              <Target className="w-[14px] h-[14px] text-[#555555]" />
              <span className="text-[12px] text-[#555555] tracking-[0.04em] uppercase">
                Weekly Goal
              </span>
            </div>
            <div className="flex items-baseline gap-[4px]">
              <span className="text-[28px] font-bold text-[#F0F0F0] leading-[1.1] tracking-[-0.02em]">
                {weeklyPct}%
              </span>
            </div>
            <div className="mt-[8px] w-full h-[3px] bg-[#1E1E1E] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${weeklyPct}%` }}
                transition={{
                  duration: 0.8,
                  ease: [0.25, 0.1, 0.25, 1],
                  delay: 0.3,
                }}
                className="h-full bg-[#E0E0E0] rounded-full"
              />
            </div>
          </motion.div>

          <motion.div
            {...stagger(2)}
            className="bg-[#141414] border border-[#1E1E1E] rounded-[8px] p-[16px] group hover:border-[#2A2A2A] transition-colors duration-200"
          >
            <div className="flex items-center gap-[8px] mb-[8px]">
              <Flame className="w-[14px] h-[14px] text-[#555555]" />
              <span className="text-[12px] text-[#555555] tracking-[0.04em] uppercase">
                Streak
              </span>
            </div>
            <span className="text-[28px] font-bold text-[#F0F0F0] leading-[1.1] tracking-[-0.02em]">
              {streakDays}
            </span>
            <span className="text-[12px] text-[#555555] ml-[4px]">days</span>
          </motion.div>

          <motion.div
            {...stagger(2.5)}
            className="bg-[#141414] border border-[#1E1E1E] rounded-[8px] p-[16px] group hover:border-[#2A2A2A] transition-colors duration-200"
          >
            <div className="flex items-center gap-[8px] mb-[8px]">
              <TrendingUp className="w-[14px] h-[14px] text-[#555555]" />
              <span className="text-[12px] text-[#555555] tracking-[0.04em] uppercase">
                Avg Speed
              </span>
            </div>
            <span className="text-[28px] font-bold text-[#F0F0F0] leading-[1.1] tracking-[-0.02em]">
              840
            </span>
            <span className="text-[12px] text-[#555555] ml-[4px]">words/h</span>
          </motion.div>
        </div>

        {/* 12-col grid: 8 left + 4 right, gutter 24px */}
        <div className="flex gap-[24px]">
          {/* ──── Left Main ──── */}
          <div className="flex-1 min-w-0 flex flex-col gap-[20px]">
            {/* Block A: Active Context — Hero Card */}
            <motion.div
              {...stagger(3)}
              className="relative bg-[#141414] border border-[#1E1E1E] rounded-[12px] p-[24px] min-h-[160px] flex flex-col overflow-hidden group hover:border-[#2A2A2A] transition-colors duration-200"
            >
              {/* Subtle top accent line */}
              <div className="absolute top-0 left-[24px] right-[24px] h-[1px] bg-gradient-to-r from-transparent via-[#2A2A2A] to-transparent" />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-[12px]">
                  <div className="w-[40px] h-[40px] rounded-[8px] bg-[#1E1E1E] flex items-center justify-center">
                    <FileText className="w-[18px] h-[18px] text-[#888888]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-[8px]">
                      <span className="text-[16px] font-semibold text-[#F0F0F0] leading-[1.4]">
                        Project Phoenix
                      </span>
                      <ChevronRight className="w-[14px] h-[14px] text-[#555555]" />
                      <span className="text-[14px] text-[#888888] leading-[1.6]">
                        Chapter 12: 觉醒
                      </span>
                    </div>
                    <div className="flex items-center gap-[8px] mt-[4px]">
                      <Clock className="w-[12px] h-[12px] text-[#555555]" />
                      <span className="text-[12px] text-[#555555]">
                        3 小时前编辑
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-[16px]">
                <div className="flex items-center justify-between mb-[6px]">
                  <span className="text-[12px] text-[#555555]">
                    Chapter progress
                  </span>
                  <span className="text-[12px] text-[#888888]">68%</span>
                </div>
                <div className="w-full h-[3px] bg-[#1E1E1E] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "68%" }}
                    transition={{
                      duration: 0.8,
                      ease: [0.25, 0.1, 0.25, 1],
                      delay: 0.4,
                    }}
                    className="h-full bg-[#E0E0E0] rounded-full"
                  />
                </div>
              </div>

              <p className="mt-[12px] text-[14px] text-[#888888] leading-[1.6] line-clamp-2">
                你上次在第 12 章写到 Elara
                进入密室，下一步可以展开她与守卫的对话
              </p>

              <div className="mt-auto pt-[16px] flex justify-end">
                <button
                  onClick={() => navigate("/app/editor/draft-1")}
                  className="h-[36px] px-[20px] bg-[#F0F0F0] text-[#0D0D0D] rounded-[6px] text-[14px] font-medium hover:bg-[#CCCCCC] transition-colors duration-150 flex items-center gap-[8px]"
                >
                  继续写作 <ChevronRight className="w-[14px] h-[14px]" />
                </button>
              </div>
            </motion.div>

            {/* Block B: Recent Work */}
            <motion.div
              {...stagger(4)}
              className="bg-[#141414] border border-[#1E1E1E] rounded-[12px] p-[20px] hover:border-[#2A2A2A] transition-colors duration-200"
            >
              <div className="flex items-center justify-between mb-[16px]">
                <h3 className="text-[14px] font-semibold text-[#F0F0F0] leading-[1.4] tracking-[0.01em] uppercase">
                  最近编辑
                </h3>
                <button className="text-[12px] text-[#555555] hover:text-[#888888] transition-colors duration-150 cursor-pointer">
                  查看全部 →
                </button>
              </div>

              <div className="flex flex-col">
                {recentDocs.map((doc, i) => (
                  <div key={doc.id}>
                    <div
                      onClick={() => navigate(`/app/editor/${doc.id}`)}
                      className="flex items-center h-[56px] hover:bg-[rgba(255,255,255,0.02)] transition-colors duration-100 cursor-pointer rounded-[6px] px-[8px] -mx-[8px] group"
                    >
                      <div className="w-[36px] shrink-0 flex items-center justify-center">
                        <FileText className="w-[15px] h-[15px] text-[#555555] stroke-[1.5px] group-hover:text-[#888888] transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <span className="text-[14px] font-medium text-[#CCCCCC] leading-[1.6] truncate group-hover:text-[#F0F0F0] transition-colors">
                          {doc.title}
                        </span>
                        <span className="text-[12px] text-[#555555] leading-[1.4]">
                          {doc.project}
                        </span>
                      </div>
                      <div className="w-[80px] shrink-0 text-right">
                        {doc.wordsChange > 0 && (
                          <span className="text-[11px] font-medium text-[#4ADE80] leading-[1.2] flex items-center justify-end gap-[2px]">
                            <ArrowUp className="w-[10px] h-[10px]" />+
                            {doc.wordsChange.toLocaleString()}
                          </span>
                        )}
                        {doc.wordsChange < 0 && (
                          <span className="text-[11px] font-medium text-[#F87171] leading-[1.2] flex items-center justify-end gap-[2px]">
                            <ArrowDown className="w-[10px] h-[10px]" />
                            {doc.wordsChange.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="w-[72px] shrink-0 text-right">
                        <span className="text-[12px] text-[#555555] leading-[1.4]">
                          {doc.time}
                        </span>
                      </div>
                    </div>
                    {i < recentDocs.length - 1 && (
                      <div className="h-[1px] bg-[#1E1E1E] mx-[8px]" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Block C: Quick Capture */}
            <motion.div {...stagger(5)} className="relative">
              <div className="flex items-center bg-[#111111] border border-[#1E1E1E] rounded-[8px] h-[44px] px-[16px] focus-within:border-[#2A2A2A] transition-colors duration-200">
                <input
                  type="text"
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleQuickSave();
                    }
                  }}
                  placeholder="记下一个灵感…"
                  className="flex-1 bg-transparent text-[14px] text-[#F0F0F0] placeholder:text-[#3A3A3A] outline-none font-sans"
                />
                <button
                  onClick={handleQuickSave}
                  className={`w-[24px] h-[24px] rounded-full flex items-center justify-center transition-colors duration-100 ${
                    quickNote ? "bg-[#F0F0F0] text-[#0D0D0D]" : "text-[#555555]"
                  }`}
                  aria-label="保存灵感"
                >
                  <ArrowUp className="w-[12px] h-[12px]" />
                </button>
              </div>
              {showConfirm && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4ADE80] rounded-b-[8px] origin-left"
                />
              )}
            </motion.div>
          </div>

          {/* ──── Right Side ──── */}
          <div className="w-[320px] shrink-0 flex flex-col gap-[20px]">
            {/* Block D: Creo Insights */}
            <motion.div
              {...stagger(3.5)}
              className="bg-[#141414] border border-[#1E1E1E] rounded-[12px] p-[20px] hover:border-[#2A2A2A] transition-colors duration-200"
            >
              <div className="flex items-center gap-[8px] mb-[16px]">
                <div className="w-[3px] h-[16px] bg-[#7AA2F7] rounded-full shrink-0" />
                <h3 className="text-[14px] font-semibold text-[#F0F0F0] leading-[1.4] tracking-[0.01em] uppercase">
                  Creo Insights
                </h3>
              </div>
              <div className="flex flex-col gap-[16px]">
                {agentInsights.map((insight, i) => (
                  <div key={i} className="group cursor-pointer">
                    <p className="text-[13px] text-[#888888] leading-[1.65] group-hover:text-[#CCCCCC] transition-colors duration-150 line-clamp-2">
                      {insight.text}
                    </p>
                    {i < agentInsights.length - 1 && (
                      <div className="h-[1px] bg-[#1E1E1E] mt-[16px]" />
                    )}
                  </div>
                ))}
              </div>
              <button className="mt-[16px] text-[12px] text-[#555555] hover:text-[#888888] transition-colors duration-150 cursor-pointer">
                Refresh insights
              </button>
            </motion.div>

            {/* Block E: Writing Heatmap */}
            <motion.div
              {...stagger(4.5)}
              className="bg-[#141414] border border-[#1E1E1E] rounded-[12px] p-[20px] hover:border-[#2A2A2A] transition-colors duration-200"
            >
              <h3 className="text-[14px] font-semibold text-[#F0F0F0] leading-[1.4] tracking-[0.01em] uppercase mb-[16px]">
                Last 30 Days
              </h3>
              <div className="flex flex-col gap-[6px]">
                {/* Day labels */}
                <div className="flex gap-[4px] mb-[2px]">
                  <div className="w-[14px]" />
                  {dayLabels.map((l, i) => (
                    <div
                      key={i}
                      className="w-[14px] text-center text-[9px] text-[#3A3A3A]"
                    >
                      {l}
                    </div>
                  ))}
                </div>
                {heatmapData.map((week, wi) => (
                  <div key={wi} className="flex gap-[4px]">
                    <div className="w-[14px] text-[9px] text-[#3A3A3A] flex items-center justify-end pr-[2px]">
                      {wi + 1}
                    </div>
                    {week.map((val, di) => (
                      <div
                        key={di}
                        className={`w-[14px] h-[14px] rounded-[2px] ${getHeatColor(val)} transition-colors duration-100`}
                        title={`${val.toLocaleString()} 字`}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="mt-[12px] flex items-center justify-between text-[11px] text-[#3A3A3A]">
                <span>Less</span>
                <div className="flex gap-[3px]">
                  {[0, 500, 1500, 3000, 4000].map((v, i) => (
                    <div
                      key={i}
                      className={`w-[10px] h-[10px] rounded-[2px] ${getHeatColor(v)}`}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>
              <p className="mt-[8px] text-[12px] text-[#555555] leading-[1.4]">
                本月共 {weeklyActual.toLocaleString()} 字
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
