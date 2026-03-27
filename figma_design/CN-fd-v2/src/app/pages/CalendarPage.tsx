import React, { useState } from "react";
import {
  format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek,
  isSameMonth, isSameDay, addMonths, subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "../components/ui/utils";
import { motion } from "motion/react";

interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  type: "system" | "user";
  category: "deadline" | "publish" | "review" | "task" | "creation";
}

const mockEvents: CalendarEvent[] = [
  { id: "1", date: new Date(2026, 2, 12), title: "Project Phoenix Deadline", type: "system", category: "deadline" },
  { id: "2", date: new Date(2026, 2, 15), title: "Published: The Aesthetics of Silence", type: "system", category: "publish" },
  { id: "3", date: new Date(2026, 2, 5), title: "Document Created: Character Arcs", type: "system", category: "creation" },
  { id: "4", date: new Date(2026, 2, 20), title: "Auto-save Milestone (10k words)", type: "system", category: "creation" },
  { id: "5", date: new Date(2026, 2, 24), title: "Review Draft with Editor", type: "user", category: "review" },
  { id: "6", date: new Date(2026, 2, 10), title: "Brainstorming Session", type: "user", category: "task" },
  { id: "7", date: new Date(2026, 2, 18), title: "Write Chapter 5", type: "user", category: "task" },
  { id: "8", date: new Date(2026, 2, 26), title: "Final Polish", type: "user", category: "task" },
];

const getEventStyle = (category: string) => {
  switch (category) {
    case "deadline": return "text-[#F87171]";
    case "publish": return "text-[#4ADE80]";
    case "review": return "text-[#FBBF24]";
    case "creation": return "text-[#888888]";
    default: return "text-[#F0F0F0]";
  }
};

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 26));
  const [showSystemEvents, setShowSystemEvents] = useState(true);

  const filteredEvents = mockEvents.filter((e) => showSystemEvents || e.type === "user");
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const rows: Date[][] = [];
  let days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      days.push(day);
      day = addDays(day, 1);
    }
    rows.push(days);
    days = [];
  }

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D]">
      {/* Header */}
      <header className="flex items-center justify-between px-[32px] h-[56px] border-b border-[#2A2A2A] shrink-0">
        <h1 className="text-[28px] font-bold text-[#F0F0F0] leading-[1.2] tracking-[-0.01em]">Calendar</h1>

        <div className="flex items-center gap-[16px]">
          <label className="flex items-center gap-[8px] text-[12px] text-[#888888] cursor-pointer hover:text-[#F0F0F0] transition-colors duration-150">
            <input
              type="checkbox"
              checked={showSystemEvents}
              onChange={(e) => setShowSystemEvents(e.target.checked)}
              className="w-[16px] h-[16px] rounded-[4px] border border-[#2A2A2A] bg-[#111111] accent-[#F0F0F0]"
            />
            Show System Events
          </label>

          <div className="flex items-center gap-[8px] bg-[#1A1A1A] border border-[#2A2A2A] rounded-[4px] px-[4px] py-[4px]">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-[4px] text-[#888888] hover:text-[#F0F0F0] hover:bg-[#1E1E1E] rounded-[4px] transition-colors duration-150">
              <ChevronLeft className="w-[16px] h-[16px]" />
            </button>
            <span className="text-[14px] font-medium text-[#F0F0F0] min-w-[140px] text-center">
              {format(currentDate, "MMMM yyyy")}
            </span>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-[4px] text-[#888888] hover:text-[#F0F0F0] hover:bg-[#1E1E1E] rounded-[4px] transition-colors duration-150">
              <ChevronRight className="w-[16px] h-[16px]" />
            </button>
          </div>

          <button className="h-[36px] px-[16px] bg-[#F0F0F0] text-[#0D0D0D] rounded-[6px] text-[14px] font-medium hover:bg-[#CCCCCC] transition-colors duration-150 flex items-center gap-[8px]">
            <Plus className="w-[16px] h-[16px]" /> New Event
          </button>
        </div>
      </header>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-hidden p-[32px]">
        <div className="border border-[#2A2A2A] rounded-[8px] overflow-hidden h-full flex flex-col">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-[#2A2A2A] bg-[#1A1A1A] shrink-0">
            {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
              <div key={d} className="py-[8px] text-center text-[12px] font-medium text-[#888888] tracking-[0.05em] border-r border-[#2A2A2A] last:border-r-0">
                {d}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            {rows.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 flex-1 min-h-[100px]">
                {week.map((d) => {
                  const isCurrentMonth = isSameMonth(d, monthStart);
                  const isToday = isSameDay(d, new Date(2026, 2, 26));
                  const dayEvents = filteredEvents.filter((e) => isSameDay(e.date, d));

                  return (
                    <div
                      key={d.toString()}
                      className={cn(
                        "border-r border-b border-[#2A2A2A] last:border-r-0 p-[8px] group hover:bg-[#1E1E1E] transition-colors duration-100",
                        !isCurrentMonth ? "bg-[#0D0D0D] opacity-40" : "bg-[#0D0D0D]"
                      )}
                    >
                      <div className="flex items-center justify-between mb-[4px]">
                        <span
                          className={cn(
                            "text-[12px] font-medium w-[24px] h-[24px] flex items-center justify-center rounded-full",
                            isToday ? "bg-[#F0F0F0] text-[#0D0D0D]" : "text-[#888888]"
                          )}
                        >
                          {format(d, "d")}
                        </span>
                        <button className="opacity-0 group-hover:opacity-100 text-[#888888] hover:text-[#F0F0F0] transition-all duration-100">
                          <Plus className="w-[12px] h-[12px]" />
                        </button>
                      </div>
                      <div className="space-y-[4px]">
                        {dayEvents.slice(0, 2).map((e) => (
                          <div
                            key={e.id}
                            className={cn(
                              "text-[11px] font-medium truncate px-[4px] py-[2px] rounded-[4px] cursor-pointer hover:bg-[rgba(240,240,240,0.08)] transition-colors duration-100",
                              getEventStyle(e.category)
                            )}
                            title={e.title}
                          >
                            {e.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="text-[11px] text-[#888888]">+{dayEvents.length - 2} more</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
