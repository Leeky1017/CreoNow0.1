import React from "react";
import { cn } from "../components/ui/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

const weeklyData = [
  { day: "MON", count: 800 },
  { day: "TUE", count: 1200 },
  { day: "WED", count: 3200 },
  { day: "THU", count: 900 },
  { day: "FRI", count: 1800 },
  { day: "SAT", count: 2100 },
  { day: "SUN", count: 600 },
];

const focusData = [
  { time: "0h", depth: 30 },
  { time: "1h", depth: 40 },
  { time: "2h", depth: 25 },
  { time: "3h", depth: 60 },
  { time: "4h", depth: 10 },
  { time: "5h", depth: 50 },
];

export function AnalyticsPage() {
  return (
    <div className="flex-1 overflow-y-auto p-8 relative min-h-0 bg-[#050505]">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-[1000px] mx-auto relative z-10 flex flex-col gap-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-2 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-medium text-white">Analytics</h1>
            <span className="text-sm text-gray-500 font-mono">/</span>
            <span className="text-sm font-semibold tracking-wider text-gray-400">
              OCTOBER 2024
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-[#111111] rounded-full p-1 border border-white/10">
              {["WEEK", "MONTH", "YEAR"].map((t) => (
                <button
                  key={t}
                  className={cn(
                    "px-4 py-1.5 text-xs font-semibold rounded-full transition-colors",
                    t === "WEEK"
                      ? "bg-white/10 text-white"
                      : "text-gray-500 hover:text-gray-300",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <button className="px-4 py-2 border border-white/10 rounded-full text-xs font-semibold text-gray-300 hover:bg-white/5 transition-colors">
              Export Data
            </button>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          {/* Main Content Area */}
          <div className="col-span-9 flex flex-col gap-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
              <KpiCard
                title="TOTAL WORDS"
                value="42,850"
                subtitle="+12% from last month"
                subtitleColor="text-emerald-500"
              />
              <KpiCard
                title="AVG. VELOCITY"
                value="840"
                unit="wph"
                subtitle="Words per hour"
              />
              <KpiCard
                title="READ TIME"
                value="3h 12m"
                subtitle="Across all active drafts"
              />
              <KpiCard
                title="STREAK"
                value="14"
                unit="days"
                subtitle="Personal Best"
              />
            </div>

            {/* Main Chart */}
            <div className="border border-white/5 rounded-xl bg-[#0a0a0a] p-6 relative overflow-hidden">
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                  backgroundSize: "16px 16px",
                }}
              />
              <div className="relative z-10 flex items-start justify-between mb-8">
                <div>
                  <h3 className="text-sm font-medium text-white mb-1">
                    Weekly Output
                  </h3>
                  <p className="text-xs text-gray-500">
                    Distribution of word count across the last 7 days
                  </p>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-semibold tracking-widest text-gray-500 mb-1">
                    DAILY AVERAGE
                  </span>
                  <span className="text-2xl font-medium text-white">1,420</span>
                </div>
              </div>
              <div className="h-[200px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} barGap={4}>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#737373" }}
                      dy={10}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                      contentStyle={{
                        backgroundColor: "#000",
                        borderColor: "rgba(255,255,255,0.1)",
                      }}
                    />
                    <Bar dataKey="count" fill="#262626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-2 gap-6">
              <div className="border border-white/5 rounded-xl bg-[#0a0a0a] p-6 relative overflow-hidden flex flex-col">
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.03]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                    backgroundSize: "16px 16px",
                  }}
                />
                <h3 className="text-[10px] font-semibold tracking-widest text-gray-500 mb-6 relative z-10">
                  FOCUS SESSION DEPTH
                </h3>
                <div className="flex-1 w-full min-h-[120px] relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={focusData}>
                      <Line
                        type="monotone"
                        dataKey="depth"
                        stroke="#ffffff"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: "#fff" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="border border-white/5 rounded-xl bg-[#0a0a0a] p-6 relative overflow-hidden">
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.03]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                    backgroundSize: "16px 16px",
                  }}
                />
                <h3 className="text-[10px] font-semibold tracking-widest text-gray-500 mb-6 relative z-10">
                  CATEGORY DISTRIBUTION
                </h3>
                <div className="space-y-4 relative z-10">
                  <ProgressBar label="Essays & Theory" percentage={62} />
                  <ProgressBar
                    label="Technical Documentation"
                    percentage={24}
                  />
                  <ProgressBar label="Drafts & Sandbox" percentage={14} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Insights */}
          <div className="col-span-3 flex flex-col gap-6">
            <div>
              <h3 className="text-[10px] font-semibold tracking-widest text-gray-500 mb-4">
                INSIGHTS
              </h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">
                    Morning Person
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    You are 40% more productive between 7:00 AM and 9:00 AM.
                    Consider scheduling complex deep-dives then.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">
                    Reading Time Forecast
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Current drafts total 45 minutes of content. To reach your
                    "Manifesto" goal, you need approximately 4,000 more words.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-auto border border-white/10 rounded-xl bg-[#0a0a0a] p-5">
              <h3 className="text-[10px] font-semibold tracking-widest text-gray-500 mb-4">
                OPTIMIZATION GOAL
              </h3>
              <div className="text-sm font-medium text-white mb-6">
                Reach 50k words
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white w-[84%]" />
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500">
                <span>84%</span>
                <span>7,150 left</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  unit,
  subtitle,
  subtitleColor = "text-gray-500",
}: any) {
  return (
    <div className="border border-white/5 rounded-xl bg-[#0a0a0a] p-5 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      />
      <div className="relative z-10 flex flex-col h-full justify-between">
        <h3 className="text-[10px] font-semibold tracking-widest text-gray-500 mb-4">
          {title}
        </h3>
        <div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-3xl font-medium text-white tracking-tight">
              {value}
            </span>
            {unit && <span className="text-xs text-gray-500">{unit}</span>}
          </div>
          <p className={cn("text-[10px]", subtitleColor)}>{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  percentage,
}: {
  label: string;
  percentage: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-gray-300 font-medium">{label}</span>
        <span className="text-gray-500">{percentage}%</span>
      </div>
      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-white" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
