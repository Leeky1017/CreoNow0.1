import * as React from "react";
import { cn } from "../utils/cn";
import { Link, useLocation } from "react-router";
import {
  Search,
  Inbox,
  Clock,
  Settings,
  Plus,
  LayoutDashboard,
  Calendar,
  PieChart,
  BookOpen,
  Layers,
  PenTool,
  Hash,
  Type,
} from "lucide-react";

const sidebarSections = [
  {
    title: "WORKSPACE",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Analytics", href: "/analytics", icon: PieChart },
      { name: "Calendar", href: "/calendar", icon: Calendar },
    ],
  },
  {
    title: "PROJECTS",
    items: [
      { name: "All Projects", href: "/projects", icon: Layers },
      { name: "Drafts", href: "/drafts", icon: PenTool },
      { name: "Published", href: "/published", icon: BookOpen },
    ],
  },
  {
    title: "COLLECTIONS",
    items: [
      { name: "Design Theory", href: "/collections/theory", icon: Hash },
      { name: "Typography", href: "/collections/typography", icon: Type },
      { name: "Minimalism", href: "/collections/minimalism", icon: Hash },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-screen w-64 flex-col border-r border-neutral-800/50 bg-[#000000] text-neutral-400 font-sans text-sm">
      <div className="p-6">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded bg-white text-black font-bold text-xs">
            C
          </div>
          <span className="font-semibold tracking-wide text-sm">
            CREO<span className="text-neutral-500">NOW</span>
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6 scrollbar-hide">
        {sidebarSections.map((section, idx) => (
          <div key={idx}>
            <div className="mb-2 px-2 text-[10px] font-semibold tracking-widest text-neutral-600">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center justify-between rounded-md px-2 py-1.5 transition-colors",
                      isActive
                        ? "bg-neutral-900/60 text-white font-medium"
                        : "hover:bg-neutral-900/40 hover:text-neutral-200",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {/* <item.icon className="h-4 w-4 opacity-50" /> */}
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-neutral-800/50 p-4">
        <div className="flex items-center justify-between px-2 cursor-pointer hover:bg-neutral-900/40 p-2 rounded-md">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-neutral-800 overflow-hidden">
              {/* User Avatar */}
            </div>
            <div>
              <div className="text-sm font-medium text-white">Alex M.</div>
              <div className="text-[10px] text-neutral-500">Pro Plan</div>
            </div>
          </div>
          <Settings className="h-4 w-4 opacity-50 hover:opacity-100" />
        </div>
      </div>
    </div>
  );
}
