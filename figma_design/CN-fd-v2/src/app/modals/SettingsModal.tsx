import React, { useState } from "react";
import {
  X,
  Layers,
  Database,
  BrainCircuit,
  Sparkles,
  Cpu,
  ChevronDown,
} from "lucide-react";
import { Switch } from "../components/ui/switch";
import { cn } from "../components/ui/utils";

type LayerType = "user" | "project" | "document";
type SettingsTab =
  | "knowledge"
  | "memory"
  | "personalization"
  | "skills"
  | "general";

const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  {
    id: "general",
    label: "General Settings",
    icon: <Layers className="w-[16px] h-[16px]" />,
  },
  {
    id: "knowledge",
    label: "Knowledge Base",
    icon: <Database className="w-[16px] h-[16px]" />,
  },
  {
    id: "memory",
    label: "Memory Management",
    icon: <BrainCircuit className="w-[16px] h-[16px]" />,
  },
  {
    id: "personalization",
    label: "Personalization",
    icon: <Sparkles className="w-[16px] h-[16px]" />,
  },
  {
    id: "skills",
    label: "Skill System",
    icon: <Cpu className="w-[16px] h-[16px]" />,
  },
];

export function SettingsModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("knowledge");
  const [activeLayer, setActiveLayer] = useState<LayerType>("user");
  const [layerDropdownOpen, setLayerDropdownOpen] = useState(false);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(0,0,0,0.6)]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onOpenChange(false);
          setLayerDropdownOpen(false);
        }
      }}
    >
      <div className="flex w-full max-w-4xl h-[75vh] bg-[#1A1A1A] border border-[#2A2A2A] rounded-[12px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
        {/* Sidebar */}
        <div className="w-[240px] border-r border-[#2A2A2A] bg-[#0D0D0D] flex flex-col p-[16px] shrink-0">
          <h2 className="text-[12px] font-medium tracking-[0.05em] text-[#888888] mb-[16px] px-[8px] uppercase">
            AGENT WORKSPACE SETTINGS
          </h2>
          <nav className="flex flex-col gap-[4px] flex-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setLayerDropdownOpen(false);
                }}
                className={cn(
                  "flex items-center gap-[12px] text-left px-[12px] py-[8px] text-[14px] rounded-[6px] transition-colors duration-150",
                  activeTab === tab.id
                    ? "bg-[rgba(240,240,240,0.08)] text-[#F0F0F0] font-medium"
                    : "text-[#888888] hover:text-[#F0F0F0] hover:bg-[#1E1E1E]",
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="pt-[16px] border-t border-[#2A2A2A] mt-auto">
            <button className="w-full text-left px-[12px] py-[8px] text-[14px] text-[#888888] hover:text-[#F0F0F0] transition-colors duration-150">
              Log Out
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col relative bg-[#0D0D0D]">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-[16px] right-[16px] text-[#888888] hover:text-[#F0F0F0] transition-colors duration-150 z-20 p-[4px] rounded-[4px] hover:bg-[#1E1E1E]"
          >
            <X className="h-[16px] w-[16px]" />
          </button>

          {/* Header & Layer Switcher */}
          {activeTab !== "general" && (
            <div className="px-[24px] pt-[24px] pb-[16px] border-b border-[#2A2A2A] flex items-end justify-between shrink-0">
              <div>
                <h1 className="text-[28px] font-bold text-[#F0F0F0] leading-[1.2] tracking-[-0.01em] mb-[8px]">
                  {tabs.find((t) => t.id === activeTab)?.label}
                </h1>
                <p className="text-[14px] text-[#888888] leading-[1.6]">
                  Manage settings across different hierarchical layers.
                </p>
              </div>
              <div className="relative">
                <span className="text-[12px] text-[#888888] font-medium tracking-[0.05em] mb-[4px] block uppercase">
                  CURRENT LAYER
                </span>
                <button
                  onClick={() => setLayerDropdownOpen(!layerDropdownOpen)}
                  className="flex items-center justify-between w-[180px] px-[12px] py-[8px] bg-[#111111] border border-[#2A2A2A] rounded-[6px] text-[14px] text-[#F0F0F0] hover:border-[#3A3A3A] transition-colors duration-150"
                >
                  <span className="capitalize font-medium">
                    {activeLayer} Level
                  </span>
                  <ChevronDown className="w-[16px] h-[16px] text-[#888888]" />
                </button>
                {layerDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-[4px] bg-[#1A1A1A] border border-[#2A2A2A] rounded-[6px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.3)] z-[50]">
                    {(["user", "project", "document"] as LayerType[]).map(
                      (layer) => (
                        <button
                          key={layer}
                          onClick={() => {
                            setActiveLayer(layer);
                            setLayerDropdownOpen(false);
                          }}
                          className="w-full text-left px-[12px] py-[8px] text-[14px] text-[#CCCCCC] hover:bg-[#1E1E1E] hover:text-[#F0F0F0] transition-colors duration-150 capitalize flex flex-col"
                        >
                          <span className="font-medium">{layer} Level</span>
                          <span className="text-[11px] text-[#888888]">
                            {layer === "user" && "Global defaults"}
                            {layer === "project" && "Overrides user defaults"}
                            {layer === "document" && "Temporary overrides"}
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dynamic Content */}
          <div
            className="flex-1 overflow-y-auto p-[24px]"
            onClick={() => setLayerDropdownOpen(false)}
          >
            <div className="max-w-2xl mx-auto pb-[48px]">
              {activeTab === "general" && <GeneralSettings />}
              {activeTab === "knowledge" && (
                <div className="space-y-[24px]">
                  <LayerNotice
                    layer={activeLayer}
                    desc="Lower layers override higher layers. Knowledge base dictates facts and context for Agent."
                  />
                  <SettingsSection title="Context Data">
                    <SettingRow
                      title="Global Lore & References"
                      description="Cross-project references automatically applied."
                      defaultChecked
                    />
                  </SettingsSection>
                </div>
              )}
              {activeTab === "memory" && (
                <div className="space-y-[24px]">
                  <LayerNotice
                    layer={activeLayer}
                    desc="Memory tracks context. Document memory is temporary unless promoted."
                  />
                  <SettingsSection title="Memory Rules">
                    <SettingRow
                      title="Writing Habits"
                      description="Long-term tracking of your style preferences."
                      defaultChecked
                    />
                    <SettingRow
                      title="Auto-summarize old sessions"
                      description="Compress old project memory to save context."
                      defaultChecked
                    />
                  </SettingsSection>
                </div>
              )}
              {activeTab === "personalization" && (
                <div className="space-y-[24px]">
                  <LayerNotice
                    layer={activeLayer}
                    desc="Define how the Agent interacts with you and its writing style."
                  />
                  <SettingsSection title="Tone & Style">
                    <SettingRow
                      title="Language"
                      description="Default language for Agent responses."
                      value="English"
                    />
                    <SettingRow
                      title="Tone"
                      description="How the Agent formats its suggestions."
                      value="Professional"
                    />
                  </SettingsSection>
                </div>
              )}
              {activeTab === "skills" && (
                <div className="space-y-[24px]">
                  <LayerNotice
                    layer={activeLayer}
                    desc="Skills are enabled by default. Disable them at lower layers to restrict Agent capabilities."
                  />
                  <SettingsSection title="Available Skills">
                    <SettingRow
                      title="Web Browsing"
                      description="Allow Agent to search the internet for facts."
                      defaultChecked
                    />
                    <SettingRow
                      title="Code Interpreter"
                      description="Allow Agent to run Python for data analysis."
                      defaultChecked
                    />
                    <SettingRow
                      title="Deep Critic"
                      description="Advanced structural analysis of prose."
                      defaultChecked
                    />
                  </SettingsSection>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GeneralSettings() {
  return (
    <div className="space-y-[24px] mt-[24px]">
      <div>
        <h1 className="text-[28px] font-bold text-[#F0F0F0] leading-[1.2] tracking-[-0.01em] mb-[8px]">
          General Options
        </h1>
        <p className="text-[14px] text-[#888888] leading-[1.6]">
          Customize your writing environment and workflow preferences.
        </p>
      </div>
      <SettingsSection title="Writing Experience">
        <SettingRow
          title="Focus Mode"
          description="Dims interface elements when typing."
          defaultChecked
        />
        <SettingRow
          title="Typewriter Scroll"
          description="Keeps active line centered."
        />
        <SettingRow
          title="Smart Punctuation"
          description="Auto-convert quotes and dashes."
          defaultChecked
        />
      </SettingsSection>
      <SettingsSection title="Data & Storage">
        <SettingRow
          title="Local Auto-Save"
          description="Auto-save to browser storage."
          defaultChecked
        />
      </SettingsSection>
    </div>
  );
}

function LayerNotice({ layer, desc }: { layer: string; desc: string }) {
  return (
    <div className="px-[16px] py-[12px] rounded-[8px] border border-[#2A2A2A] bg-[#111111] flex items-start gap-[12px]">
      <Layers className="w-[16px] h-[16px] text-[#7AA2F7] mt-[2px] shrink-0" />
      <div>
        <span className="text-[14px] font-medium text-[#F0F0F0] mb-[4px] block capitalize">
          Currently editing: {layer} Layer
        </span>
        <span className="text-[12px] text-[#888888]">{desc}</span>
      </div>
    </div>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-[12px] font-medium tracking-[0.05em] text-[#888888] mb-[12px] pb-[8px] border-b border-[#2A2A2A] uppercase">
        {title}
      </h3>
      <div className="space-y-[8px]">{children}</div>
    </section>
  );
}

function SettingRow({
  title,
  description,
  defaultChecked,
  value,
}: {
  title: string;
  description: string;
  defaultChecked?: boolean;
  value?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-[24px] p-[12px] rounded-[8px] hover:bg-[#1E1E1E] transition-colors duration-150">
      <div>
        <h4 className="text-[14px] font-medium text-[#F0F0F0] mb-[4px]">
          {title}
        </h4>
        <p className="text-[12px] text-[#888888] leading-[1.4]">
          {description}
        </p>
      </div>
      {value ? (
        <span className="text-[14px] text-[#F0F0F0] font-medium bg-[#111111] px-[12px] py-[4px] rounded-[6px] border border-[#2A2A2A]">
          {value}
        </span>
      ) : (
        <Switch defaultChecked={defaultChecked} />
      )}
    </div>
  );
}
