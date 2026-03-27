import React, { useState } from "react";
import {
  format,
  startOfWeek,
  addDays,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays as addDaysToDate,
  subDays,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  LayoutGrid,
  List,
  AlignJustify,
} from "lucide-react";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";

type ViewMode = "month" | "week" | "day";

interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  type: "system" | "user";
  category: "deadline" | "publish" | "review" | "task" | "creation";
  time?: string;
  duration?: number; // in hours
}

const mockEvents: CalendarEvent[] = [
  // System Events
  {
    id: "1",
    date: new Date(2024, 9, 12),
    title: "Project Phoenix Deadline",
    type: "system",
    category: "deadline",
  },
  {
    id: "2",
    date: new Date(2024, 9, 15),
    title: "Published: The Aesthetics of Silence",
    type: "system",
    category: "publish",
  },
  {
    id: "3",
    date: new Date(2024, 9, 5),
    title: "Document Created: Character Arcs",
    type: "system",
    category: "creation",
  },
  {
    id: "4",
    date: new Date(2024, 9, 20),
    title: "Auto-save Milestone Reached (10k words)",
    type: "system",
    category: "creation",
  },

  // User Events
  {
    id: "5",
    date: new Date(2024, 9, 24),
    title: "Review Draft with Editor",
    type: "user",
    category: "review",
    time: "14:00",
    duration: 2,
  },
  {
    id: "6",
    date: new Date(2024, 9, 10),
    title: "Brainstorming Session",
    type: "user",
    category: "task",
    time: "09:00",
    duration: 1.5,
  },
  {
    id: "7",
    date: new Date(2024, 9, 18),
    title: "Write Chapter 5",
    type: "user",
    category: "task",
    time: "10:00",
    duration: 3,
  },
  {
    id: "8",
    date: new Date(2024, 9, 12),
    title: "Final Polish",
    type: "user",
    category: "task",
    time: "16:00",
    duration: 2,
  },
];

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 9, 12)); // Oct 12, 2024
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [showSystemEvents, setShowSystemEvents] = useState(true);

  const next = () => {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDaysToDate(currentDate, 1));
  };

  const prev = () => {
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const filteredEvents = mockEvents.filter(
    (e) => showSystemEvents || e.type === "user",
  );

  const getEventStyle = (category: string) => {
    switch (category) {
      case "deadline":
        return "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20 hover:bg-[#ef4444]/15";
      case "publish":
        return "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 hover:bg-[#22c55e]/15";
      case "review":
        return "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20 hover:bg-[#3b82f6]/15";
      case "creation":
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/15";
      default:
        return "bg-white/5 text-white border-white/10 hover:bg-white/10";
    }
  };

  // --- MONTH VIEW ---
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, new Date(2024, 9, 12)); // Mock today as Oct 12

        const dayEvents = filteredEvents.filter((e) =>
          isSameDay(e.date, cloneDay),
        );

        days.push(
          <div
            key={day.toString()}
            className={cn(
              "min-h-[140px] p-3 border-r border-b border-border/40 relative group transition-colors",
              !isCurrentMonth
                ? "bg-[#050505] text-zinc-700"
                : "bg-[#0a0a0a] text-zinc-300",
              "hover:bg-[#0f0f0f]",
            )}
          >
            <div className="flex justify-between items-start mb-3">
              <span
                className={cn(
                  "text-[13px] font-medium w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                  isToday ? "bg-white text-black shadow-sm" : "",
                )}
              >
                {format(day, "d")}
              </span>
              <button className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded transition-colors">
                <Plus className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </div>
            <div className="space-y-1.5 mt-2 max-h-[90px] overflow-y-auto scrollbar-hide">
              {dayEvents.map((e) => (
                <div
                  key={e.id}
                  className={cn(
                    "px-2.5 py-1.5 text-[11px] rounded-[4px] truncate font-medium border transition-colors cursor-pointer",
                    getEventStyle(e.category),
                  )}
                  title={e.title}
                >
                  {e.time && (
                    <span className="opacity-70 mr-1.5 font-mono text-[10px]">
                      {e.time}
                    </span>
                  )}
                  {e.title}
                </div>
              ))}
            </div>
          </div>,
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>,
      );
      days = [];
    }

    return (
      <div className="border border-border/50 rounded-xl overflow-hidden bg-[#0a0a0a] flex flex-col flex-1 min-h-0 shadow-sm">
        <div className="grid grid-cols-7 border-b border-border/50 bg-[#050505] shrink-0">
          {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
            <div
              key={day}
              className="py-4 text-center text-[11px] font-medium tracking-[0.2em] text-muted-foreground border-r border-border/50 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto">{rows}</div>
      </div>
    );
  };

  // --- WEEK VIEW ---
  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
    const hours = Array.from({ length: 24 }, (_, i) => i);

    let days = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return (
      <div className="border border-white/5 rounded-xl overflow-hidden bg-[#0a0a0a] flex flex-col flex-1 min-h-0 relative">
        {/* Week Header */}
        <div className="grid grid-cols-8 border-b border-white/5 bg-[#111111] shrink-0">
          <div className="border-r border-white/5"></div>{" "}
          {/* Time column spacer */}
          {days.map((d) => (
            <div
              key={d.toString()}
              className="py-3 text-center border-r border-white/5 last:border-r-0 flex flex-col items-center justify-center"
            >
              <span className="text-[10px] font-semibold tracking-widest text-gray-500 mb-1">
                {format(d, "EEE").toUpperCase()}
              </span>
              <span
                className={cn(
                  "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                  isSameDay(d, new Date(2024, 9, 12))
                    ? "bg-white text-black"
                    : "text-gray-300",
                )}
              >
                {format(d, "d")}
              </span>
            </div>
          ))}
        </div>

        {/* Week Body */}
        <div className="flex-1 overflow-y-auto relative grid grid-cols-8">
          {/* Time column */}
          <div className="border-r border-white/5 bg-[#050505] flex flex-col">
            {hours.map((h) => (
              <div
                key={h}
                className="h-16 border-b border-white/5 flex items-start justify-center text-[10px] text-gray-500 pt-2 font-mono"
              >
                {h === 0
                  ? "12 AM"
                  : h < 12
                    ? `${h} AM`
                    : h === 12
                      ? "12 PM"
                      : `${h - 12} PM`}
              </div>
            ))}
          </div>

          {/* Days Columns */}
          {days.map((d) => {
            const dayEvents = filteredEvents.filter((e) =>
              isSameDay(e.date, d),
            );
            return (
              <div
                key={d.toString()}
                className="border-r border-white/5 last:border-r-0 relative"
              >
                {hours.map((h) => (
                  <div
                    key={h}
                    className="h-16 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  />
                ))}

                {/* Events absolutely positioned */}
                {dayEvents.map((e) => {
                  if (!e.time) return null; // Only show events with time in week view for now
                  const [hour, min] = e.time.split(":").map(Number);
                  const top = (hour + min / 60) * 64; // 64px = h-16
                  const height = (e.duration || 1) * 64;
                  return (
                    <div
                      key={e.id}
                      className={cn(
                        "absolute left-1 right-1 rounded-md p-2 border text-[10px] overflow-hidden flex flex-col shadow-lg z-10",
                        getEventStyle(e.category),
                      )}
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <span className="font-semibold truncate mb-0.5">
                        {e.title}
                      </span>
                      <span className="opacity-70 truncate font-mono">
                        {e.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- DAY VIEW ---
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = filteredEvents.filter((e) =>
      isSameDay(e.date, currentDate),
    );

    return (
      <div className="border border-white/5 rounded-xl overflow-hidden bg-[#0a0a0a] flex flex-col flex-1 min-h-0 relative">
        {/* Day Header */}
        <div className="p-4 border-b border-white/5 bg-[#111111] shrink-0 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold tracking-widest text-gray-500 mb-1">
              {format(currentDate, "EEEE").toUpperCase()}
            </span>
            <span className="text-xl font-medium text-white">
              {format(currentDate, "MMMM d, yyyy")}
            </span>
          </div>
        </div>

        {/* Day Body */}
        <div className="flex-1 overflow-y-auto relative grid grid-cols-[80px_1fr]">
          {/* Time column */}
          <div className="border-r border-white/5 bg-[#050505] flex flex-col">
            {hours.map((h) => (
              <div
                key={h}
                className="h-20 border-b border-white/5 flex items-start justify-center text-xs text-gray-500 pt-2 font-mono"
              >
                {h === 0
                  ? "12 AM"
                  : h < 12
                    ? `${h} AM`
                    : h === 12
                      ? "12 PM"
                      : `${h - 12} PM`}
              </div>
            ))}
          </div>

          {/* Events Column */}
          <div className="relative">
            {hours.map((h) => (
              <div
                key={h}
                className="h-20 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
              />
            ))}

            {/* All-day events at top */}
            <div className="absolute top-0 left-0 right-0 p-2 flex flex-wrap gap-2">
              {dayEvents
                .filter((e) => !e.time)
                .map((e) => (
                  <div
                    key={e.id}
                    className={cn(
                      "px-3 py-1.5 text-xs rounded border inline-flex",
                      getEventStyle(e.category),
                    )}
                  >
                    {e.title}
                  </div>
                ))}
            </div>

            {/* Timed events absolutely positioned */}
            {dayEvents
              .filter((e) => e.time)
              .map((e) => {
                if (!e.time) return null;
                const [hour, min] = e.time.split(":").map(Number);
                const top = (hour + min / 60) * 80; // 80px = h-20
                const height = (e.duration || 1) * 80;
                return (
                  <div
                    key={e.id}
                    className={cn(
                      "absolute left-4 right-4 rounded-lg p-3 border text-sm overflow-hidden flex flex-col shadow-lg z-10",
                      getEventStyle(e.category),
                    )}
                    style={{ top: `${top}px`, height: `${height}px` }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold truncate">{e.title}</span>
                      <span className="opacity-70 text-xs font-mono">
                        {e.time}
                      </span>
                    </div>
                    {e.type === "user" && (
                      <span className="opacity-70 text-xs mt-1">
                        User scheduled task
                      </span>
                    )}
                    {e.type === "system" && (
                      <span className="opacity-70 text-xs mt-1">
                        System generated
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  };

  const getHeaderTitle = () => {
    if (viewMode === "month")
      return format(currentDate, "MMMM yyyy").toUpperCase();
    if (viewMode === "week") {
      const s = startOfWeek(currentDate, { weekStartsOn: 1 });
      const e = endOfWeek(currentDate, { weekStartsOn: 1 });
      if (isSameMonth(s, e))
        return `${format(s, "MMM d")} - ${format(e, "d, yyyy")}`.toUpperCase();
      return `${format(s, "MMM d")} - ${format(e, "MMM d, yyyy")}`.toUpperCase();
    }
    return format(currentDate, "MMM d, yyyy").toUpperCase();
  };

  return (
    <div className="flex flex-col h-full bg-[#050505]">
      {/* Header */}
      <header className="flex items-center justify-between p-8 lg:px-12 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-serif text-white tracking-tight">
            Timeline
          </h1>

          {/* View switcher */}
          <div className="flex bg-[#0a0a0a] rounded-md p-1 border border-border/50 shadow-sm">
            {[
              {
                id: "month",
                icon: <LayoutGrid className="w-4 h-4" />,
                label: "Month",
              },
              {
                id: "week",
                icon: <AlignJustify className="w-4 h-4" />,
                label: "Week",
              },
              { id: "day", icon: <List className="w-4 h-4" />, label: "Day" },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id as ViewMode)}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded text-[13px] font-medium transition-all",
                  viewMode === v.id
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-muted-foreground hover:text-zinc-300 hover:bg-white-[0.02]",
                )}
              >
                {v.icon} {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Filters */}
          <div className="flex items-center mr-2">
            <label className="flex items-center gap-2.5 text-[13px] font-medium text-muted-foreground cursor-pointer hover:text-zinc-300 transition-colors">
              <input
                type="checkbox"
                checked={showSystemEvents}
                onChange={(e) => setShowSystemEvents(e.target.checked)}
                className="rounded-sm border-border/50 bg-[#0a0a0a] text-white focus:ring-0 focus:ring-offset-0 w-4 h-4 transition-all"
              />
              Show System Events
            </label>
          </div>

          <div className="flex items-center gap-3 bg-[#0a0a0a] rounded-md p-1 border border-border/50 shadow-sm">
            <button
              onClick={prev}
              className="p-1.5 hover:bg-white/10 rounded transition-colors text-muted-foreground hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[13px] font-medium text-white min-w-[140px] text-center tracking-[0.1em]">
              {getHeaderTitle()}
            </span>
            <button
              onClick={next}
              className="p-1.5 hover:bg-white/10 rounded transition-colors text-muted-foreground hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => toast.success("Opening New Event modal")}
            className="h-9 px-5 bg-white text-black rounded-md text-[13px] font-medium hover:bg-neutral-200 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Event
          </button>
        </div>
      </header>

      {/* Calendar Content */}
      <div className="flex-1 overflow-hidden p-8 lg:p-12 flex flex-col max-w-7xl mx-auto w-full">
        {viewMode === "month" && renderMonthView()}
        {viewMode === "week" && renderWeekView()}
        {viewMode === "day" && renderDayView()}
      </div>
    </div>
  );
}
