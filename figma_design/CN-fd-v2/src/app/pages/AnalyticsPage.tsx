import React, { useState } from "react";
import { cn } from "../components/ui/utils";
import { motion } from "motion/react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";
import { Sparkles, TrendingUp } from "lucide-react";

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.06 },
});

const dailyData = [
  { label: "6am", count: 0 }, { label: "8am", count: 120 }, { label: "10am", count: 800 },
  { label: "12pm", count: 400 }, { label: "2pm", count: 600 }, { label: "4pm", count: 350 },
  { label: "6pm", count: 180 }, { label: "8pm", count: 0 },
];

const weeklyData = [
  { label: "Mon", count: 800 }, { label: "Tue", count: 1200 },
  { label: "Wed", count: 3200 }, { label: "Thu", count: 900 },
  { label: "Fri", count: 0 }, { label: "Sat", count: 0 }, { label: "Sun", count: 0 },
];

const monthlyData = [
  { label: "W1", count: 4800 }, { label: "W2", count: 6200 },
  { label: "W3", count: 5100 }, { label: "W4", count: 3400 },
];

const chartDataMap: Record<string, typeof weeklyData> = {
  Day: dailyData,
  Week: weeklyData,
  Month: monthlyData,
};

const focusData = Array.from({ length: 14 }, (_, i) => ({
  day: `${i + 1}`,
  depth: Math.floor(Math.random() * 60 + 20),
}));

const projectDist = [
  { name: "Project Phoenix", value: 44, color: "#E0E0E0" },
  { name: "Technical Docs", value: 24, color: "#888888" },
  { name: "Journal", value: 18, color: "#555555" },
  { name: "Research", value: 10, color: "#333333" },
  { name: "Other", value: 4, color: "#1E1E1E" },
];

const kpis = [
  { label: "Total Words", value: "42,850", trend: "+12%", trendDir: "up" as const, agent: "本月产出超过上月同期 23%" },
  { label: "Avg Speed", value: "840", unit: "w/h", trend: "+5%", trendDir: "up" as const, agent: "你周二和周四上午 9-11 点效率最高" },
  { label: "Session Time", value: "3h 12m", trend: "+18%", trendDir: "up" as const, agent: "今日专注时长比你的 7 日均值高 18%" },
  { label: "Streak", value: "14", unit: "days", trend: "—", trendDir: "flat" as const, agent: "再坚持 3 天就能打破最长记录（16 天）" },
];

const agentSuggestions = [
  "尝试在中午之前安排深度写作——你上午的产出比下午高 40%",
  "本周角色对话占比偏低（12%），试试用 Creo 生成对话练习",
  "你的写作会话平均 25 分钟就中断，建议使用番茄钟模式（50 分钟专注）",
];

const timeRanges = ["Day", "Week", "Month"];

const tooltipStyle = {
  backgroundColor: "#1A1A1A",
  border: "1px solid #2A2A2A",
  borderRadius: 6,
  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
  fontSize: 12,
  color: "#F0F0F0",
  padding: "8px 12px",
};

export function AnalyticsPage() {
  const [activeRange, setActiveRange] = useState("Week");

  const activeChartData = chartDataMap[activeRange] || weeklyData;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0D0D0D]">
      <div className="max-w-[1120px] mx-auto px-[32px] pt-[40px] pb-[64px]">
        {/* Header */}
        <div className="flex items-end justify-between mb-[32px]">
          <div>
            <motion.h1 {...stagger(0)} className="text-[32px] font-bold text-[#F0F0F0] leading-[1.2] tracking-[-0.02em]">
              Analytics
            </motion.h1>
            <motion.p {...stagger(0.5)} className="mt-[8px] text-[14px] text-[#555555] leading-[1.6]">
              Understand your creative patterns and optimize your flow.
            </motion.p>
          </div>
          <motion.div {...stagger(1)} className="flex items-center bg-[#141414] border border-[#1E1E1E] rounded-[6px] p-[3px]">
            {timeRanges.map((r) => (
              <button
                key={r}
                onClick={() => setActiveRange(r)}
                className={cn(
                  "px-[16px] h-[32px] text-[12px] font-medium rounded-[4px] transition-all duration-200",
                  activeRange === r
                    ? "bg-[#1E1E1E] text-[#F0F0F0] shadow-sm"
                    : "text-[#555555] hover:text-[#888888]"
                )}
              >
                {r}
              </button>
            ))}
          </motion.div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-[16px] mb-[24px]">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              {...stagger(i + 1)}
              className="bg-[#141414] border border-[#1E1E1E] rounded-[12px] p-[20px] hover:border-[#2A2A2A] transition-colors duration-200"
            >
              <span className="text-[11px] text-[#555555] tracking-[0.06em] uppercase">{kpi.label}</span>
              <div className="flex items-baseline gap-[6px] mt-[8px]">
                <span className="text-[32px] font-bold text-[#F0F0F0] leading-[1.1] tracking-[-0.02em]">{kpi.value}</span>
                {kpi.unit && <span className="text-[12px] text-[#555555]">{kpi.unit}</span>}
                <span className={cn("text-[11px] font-medium leading-[1.2] ml-auto",
                  kpi.trendDir === "up" ? "text-[#4ADE80]" : kpi.trendDir === "down" ? "text-[#F87171]" : "text-[#555555]"
                )}>
                  {kpi.trendDir === "up" ? "↑" : kpi.trendDir === "down" ? "↓" : ""} {kpi.trend}
                </span>
              </div>
              <div className="flex items-start gap-[6px] mt-[12px] pt-[12px] border-t border-[#1E1E1E]">
                <div className="w-[4px] h-[4px] bg-[#7AA2F7] rounded-full mt-[5px] shrink-0" />
                <span className="text-[11px] text-[#555555] leading-[1.5] line-clamp-2">{kpi.agent}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-[16px] mb-[16px]">
          {/* Output Bar Chart */}
          <motion.div {...stagger(5)} className="bg-[#141414] border border-[#1E1E1E] rounded-[12px] p-[20px] h-[300px] hover:border-[#2A2A2A] transition-colors duration-200">
            <h3 className="text-[14px] font-semibold text-[#F0F0F0] leading-[1.4] tracking-[0.01em] uppercase mb-[20px]">
              {activeRange === "Day" ? "Today's Output" : activeRange === "Week" ? "This Week" : "This Month"}
            </h3>
            <div className="h-[210px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeChartData} barGap={4}>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#555555" }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#3A3A3A" }} width={36} />
                  <Tooltip cursor={{ fill: "rgba(255,255,255,0.02)" }} contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#2A2A2A">
                    {activeChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.count > 2000 ? "#E0E0E0" : entry.count > 800 ? "#555555" : "#2A2A2A"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Focus Depth Chart */}
          <motion.div {...stagger(6)} className="bg-[#141414] border border-[#1E1E1E] rounded-[12px] p-[20px] h-[300px] hover:border-[#2A2A2A] transition-colors duration-200">
            <h3 className="text-[14px] font-semibold text-[#F0F0F0] leading-[1.4] tracking-[0.01em] uppercase mb-[20px]">Focus Depth</h3>
            <div className="h-[210px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={focusData}>
                  <defs>
                    <linearGradient id="focusFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(224,224,224,0.08)" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#555555" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#3A3A3A" }} width={28} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="depth" stroke="#888888" strokeWidth={1.5} fill="url(#focusFill)" dot={false} activeDot={{ r: 3, fill: "#E0E0E0", strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-2 gap-[16px]">
          {/* Project Distribution */}
          <motion.div {...stagger(7)} className="bg-[#141414] border border-[#1E1E1E] rounded-[12px] p-[20px] h-[320px] hover:border-[#2A2A2A] transition-colors duration-200">
            <h3 className="text-[14px] font-semibold text-[#F0F0F0] leading-[1.4] tracking-[0.01em] uppercase mb-[20px]">Project Distribution</h3>
            <div className="flex items-center gap-[24px]">
              <div className="w-[160px] h-[160px] shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={projectDist} cx="50%" cy="50%" innerRadius={48} outerRadius={80} dataKey="value" stroke="none">
                      {projectDist.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[24px] font-bold text-[#F0F0F0] leading-[1.2] tracking-[-0.02em]">28.5h</span>
                  <span className="text-[10px] text-[#555555]">this month</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-[8px]">
                {projectDist.map((p) => (
                  <div key={p.name} className="flex items-center gap-[8px]">
                    <div className="w-[6px] h-[6px] rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-[13px] text-[#888888] flex-1 truncate">{p.name}</span>
                    <span className="text-[13px] text-[#555555] tabular-nums">{p.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Agent Suggestions */}
          <motion.div {...stagger(8)} className="bg-[#141414] border border-[#1E1E1E] rounded-[12px] p-[20px] h-[320px] flex flex-col hover:border-[#2A2A2A] transition-colors duration-200">
            <div className="flex items-center gap-[8px] mb-[20px]">
              <div className="w-[3px] h-[16px] bg-[#7AA2F7] rounded-full shrink-0" />
              <h3 className="text-[14px] font-semibold text-[#F0F0F0] leading-[1.4] tracking-[0.01em] uppercase">Creo Suggestions</h3>
            </div>
            <div className="flex-1 flex flex-col gap-[16px] overflow-y-auto">
              {agentSuggestions.map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-[12px] hover:bg-[rgba(255,255,255,0.02)] rounded-[6px] p-[10px] -mx-[10px] transition-colors duration-100 cursor-pointer"
                >
                  <div className="w-[22px] h-[22px] bg-[#1E1E1E] border border-[#2A2A2A] rounded-full flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-medium text-[#888888]">{i + 1}</span>
                  </div>
                  <p className="text-[13px] text-[#888888] leading-[1.65] line-clamp-3">{s}</p>
                </div>
              ))}
            </div>
            <button className="mt-[16px] text-[12px] text-[#555555] hover:text-[#888888] transition-colors duration-150 cursor-pointer self-start">
              Refresh suggestions
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
