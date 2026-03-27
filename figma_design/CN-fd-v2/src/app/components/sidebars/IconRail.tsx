import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { cn } from "../ui/utils";
import {
  Search,
  LayoutDashboard,
  Folder,
  BarChart2,
  Calendar,
  User,
  Network,
  Settings
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface IconRailProps {
  onSettingsClick: () => void;
  onSearchClick: () => void;
  onProjectsClick: () => void;
  isProjectsActive: boolean;
}

export function IconRail({ onSettingsClick, onSearchClick, onProjectsClick, isProjectsActive }: IconRailProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isDashboard = location.pathname === "/app" || location.pathname === "/app/";
  const isAnalytics = location.pathname.includes("/analytics");
  const isCalendar = location.pathname.includes("/calendar");
  const isCharacters = location.pathname.includes("/characters");
  const isGraph = location.pathname.includes("/graph");

  return (
    <div className="flex flex-col h-full w-[52px] bg-[#1A1A1A] border-r border-[#2A2A2A] py-[12px] items-center justify-between shrink-0 z-[30]">
      <TooltipProvider delayDuration={500} skipDelayDuration={0}>
        <div className="flex flex-col gap-1 items-center w-full">
          {/* Top Actions */}
          <RailButton icon={<Search />} label="Search (⌘K)" onClick={onSearchClick} />
          
          <RailLink icon={<LayoutDashboard />} label="Dashboard" to="/app" isActive={isDashboard} />
          
          <RailButton 
            icon={<Folder />} 
            label="Projects" 
            isActive={isProjectsActive}
            onClick={() => {
              if (!location.pathname.includes("/editor")) {
                navigate("/app/editor/draft-1");
              }
              onProjectsClick();
            }} 
          />
          
          <RailLink icon={<BarChart2 />} label="Analytics" to="/app/analytics" isActive={isAnalytics} />
          <RailLink icon={<Calendar />} label="Calendar" to="/app/calendar" isActive={isCalendar} />

          <div className="w-[36px] h-[1px] bg-[#2A2A2A] my-2" />

          {/* Knowledge Base */}
          <RailLink icon={<User />} label="Characters" to="/app/characters" isActive={isCharacters} />
          <RailLink icon={<Network />} label="Knowledge Graph" to="/app/graph" isActive={isGraph} />
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-1 items-center w-full">
          <RailButton icon={<Settings />} label="Settings" onClick={onSettingsClick} />
        </div>
      </TooltipProvider>
    </div>
  );
}

function RailButton({ icon, label, onClick, isActive }: { icon: React.ReactNode, label: string, onClick?: () => void, isActive?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "w-[36px] h-[36px] flex items-center justify-center rounded-[6px] transition-colors duration-150 relative group outline-none",
            isActive ? "text-[#F0F0F0] bg-[#1E1E1E]" : "text-[#888888] hover:text-[#CCCCCC] hover:bg-[#1E1E1E] focus-visible:text-[#CCCCCC] focus-visible:bg-[#1E1E1E] focus-visible:outline-2 focus-visible:outline-[#F0F0F0] focus-visible:outline-offset-2"
          )}
        >
          {React.cloneElement(icon as React.ReactElement, { 
            className: "w-[20px] h-[20px] stroke-[1.5px]" 
          })}
        </button>
      </TooltipTrigger>
      <TooltipContent 
        side="right" 
        sideOffset={8} 
        className="bg-[#1E1E1E] border border-[#2A2A2A] text-[#F0F0F0] rounded-[4px] px-[10px] py-[6px] text-[12px] font-normal shadow-sm animate-in fade-in duration-100 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:duration-100"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function RailLink({ icon, label, to, isActive }: { icon: React.ReactNode, label: string, to: string, isActive: boolean }) {
  const navigate = useNavigate();
  return (
    <RailButton 
      icon={icon} 
      label={label} 
      isActive={isActive} 
      onClick={() => navigate(to)} 
    />
  );
}
