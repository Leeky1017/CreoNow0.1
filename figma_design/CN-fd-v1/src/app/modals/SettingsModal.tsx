import React, { useState } from "react";
import { X, Layers, Database, BrainCircuit, Sparkles, Cpu, ChevronDown } from "lucide-react";
import { Switch } from "../components/ui/switch";
import { cn } from "../components/ui/utils";

type LayerType = "user" | "project" | "document";
type SettingsTab = "knowledge" | "memory" | "personalization" | "skills" | "general";

const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "General Settings", icon: <Layers className="w-4 h-4" /> },
  { id: "knowledge", label: "Knowledge Base", icon: <Database className="w-4 h-4" /> },
  { id: "memory", label: "Memory Management", icon: <BrainCircuit className="w-4 h-4" /> },
  { id: "personalization", label: "Personalization", icon: <Sparkles className="w-4 h-4" /> },
  { id: "skills", label: "Skill System", icon: <Cpu className="w-4 h-4" /> },
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
           onOpenChange(false);
           setLayerDropdownOpen(false);
        }
      }}
    >
      <div className="flex w-full max-w-4xl h-[75vh] bg-card border border-border shadow-2xl shadow-black/50 rounded-xl overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-border bg-background flex flex-col p-4 shrink-0">
          <h2 className="text-[10px] tracking-[0.15em] text-muted-foreground mb-4 px-2">
            AI WORKSPACE SETTINGS
          </h2>
          
          <nav className="flex flex-col gap-1 flex-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setLayerDropdownOpen(false); }}
                className={cn(
                  "flex items-center gap-3 text-left px-3 py-2.5 text-sm rounded-lg transition-colors font-medium",
                  activeTab === tab.id
                    ? "bg-white/10 text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="pt-4 border-t border-border mt-auto">
             <button className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-white transition-colors">
              Log Out
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col relative bg-[#0a0a0a]">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors z-20 p-1.5 rounded-md hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header & Layer Switcher */}
          {activeTab !== "general" && (
            <div className="px-8 pt-8 pb-4 border-b border-white/5 flex items-end justify-between shrink-0">
              <div>
                <h1 className="text-2xl font-serif text-white mb-2 flex items-center gap-3">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage settings across different hierarchical layers.
                </p>
              </div>
              
              {/* Layer Switcher */}
              <div className="relative">
                <span className="text-[10px] text-gray-500 font-medium tracking-wider mb-1.5 block uppercase">CURRENT LAYER</span>
                <button 
                  onClick={() => setLayerDropdownOpen(!layerDropdownOpen)}
                  className="flex items-center justify-between w-[180px] px-3 py-2 bg-black border border-white/10 rounded-lg text-sm text-white hover:border-white/20 transition-colors"
                >
                  <span className="capitalize font-medium">{activeLayer} Level</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {layerDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#111111] border border-white/10 rounded-lg overflow-hidden shadow-xl z-30">
                    {(["user", "project", "document"] as LayerType[]).map(layer => (
                      <button
                        key={layer}
                        onClick={() => { setActiveLayer(layer); setLayerDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors capitalize flex flex-col"
                      >
                        <span className="font-medium">{layer} Level</span>
                        <span className="text-[10px] text-gray-500">
                          {layer === "user" && "Global defaults"}
                          {layer === "project" && "Overrides user defaults"}
                          {layer === "document" && "Temporary overrides"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dynamic Content */}
          <div className="flex-1 overflow-y-auto p-8" onClick={() => setLayerDropdownOpen(false)}>
            <div className="max-w-2xl mx-auto pb-12">
              
              {activeTab === "general" && <GeneralSettings />}

              {activeTab === "knowledge" && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  <LayerNotice layer={activeLayer} desc="Lower layers override higher layers. Knowledge base dictates facts and context for AI." />
                  
                  <SettingsSection title="Context Data">
                    {activeLayer === "user" && (
                      <SettingRow title="Global Lore & References" description="Cross-project references automatically applied." />
                    )}
                    {activeLayer === "project" && (
                      <SettingRow title="Project World-building" description="Specific setting, lore, and history for this project." />
                    )}
                    {activeLayer === "document" && (
                      <SettingRow title="Chapter-specific Facts" description="Details relevant only to this active document." />
                    )}
                  </SettingsSection>
                </div>
              )}

              {activeTab === "memory" && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  <LayerNotice layer={activeLayer} desc="Memory tracks context. Document memory is temporary unless promoted." />
                  
                  <SettingsSection title="Memory Rules">
                    {activeLayer === "user" && (
                      <>
                        <SettingRow title="Writing Habits" description="Long-term tracking of your style preferences." defaultChecked />
                        <SettingRow title="Auto-summarize old sessions" description="Compress old project memory to save context." defaultChecked />
                      </>
                    )}
                    {activeLayer === "project" && (
                      <>
                        <SettingRow title="Character Progression" description="Track character arc changes automatically." defaultChecked inherited />
                        <SettingRow title="Plot consistency enforcement" description="Warn if new text contradicts previous chapters." />
                      </>
                    )}
                    {activeLayer === "document" && (
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-400 mb-1">Session-only Memory</h4>
                        <p className="text-xs text-blue-300/70 mb-3">Memory at the document level is volatile. You can promote important facts to the project layer manually via the AI chat.</p>
                      </div>
                    )}
                  </SettingsSection>
                </div>
              )}

              {activeTab === "personalization" && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  {activeLayer === "document" ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Sparkles className="w-8 h-8 text-gray-600 mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">No Document-level Settings</h3>
                      <p className="text-sm text-gray-400 max-w-sm">
                        Personalization is handled at the User or Project level. For document-specific tone, instruct the AI directly via chat.
                      </p>
                    </div>
                  ) : (
                    <>
                      <LayerNotice layer={activeLayer} desc="Define how the AI interacts with you and its writing style." />
                      <SettingsSection title="Tone & Style">
                        <SettingRow title="Language" description="Default language for AI responses." value="English" />
                        <SettingRow title="Tone" description="How the AI formats its suggestions." value={activeLayer === "user" ? "Professional" : "Hard Sci-fi (Overridden)"} />
                        {activeLayer === "project" && <SettingRow title="Inherit User Defaults" description="Revert tone settings to global preferences." defaultChecked={false} />}
                      </SettingsSection>
                    </>
                  )}
                </div>
              )}

              {activeTab === "skills" && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  <LayerNotice layer={activeLayer} desc="Skills are enabled by default. Disable them at lower layers to restrict AI capabilities." />
                  
                  <SettingsSection title="Available Skills">
                    <SettingRow title="Web Browsing" description="Allow AI to search the internet for facts." defaultChecked />
                    <SettingRow title="Code Interpreter" description="Allow AI to run Python for data analysis." defaultChecked />
                    <SettingRow title="Image Generation" description="Allow AI to generate concept art." defaultChecked={activeLayer !== "document"} inherited={activeLayer === "document"} />
                    <SettingRow title="Deep Critic" description="Advanced structural analysis of prose." defaultChecked />
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
    <div className="space-y-10 animate-in fade-in duration-200 mt-8">
      <div>
        <h1 className="text-2xl font-serif text-white mb-1.5">General Options</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Customize your writing environment and workflow preferences.
        </p>
      </div>

      <SettingsSection title="Writing Experience">
        <SettingRow title="Focus Mode" description="Dims interface elements when typing." defaultChecked />
        <SettingRow title="Typewriter Scroll" description="Keeps active line centered." />
        <SettingRow title="Smart Punctuation" description="Auto-convert quotes and dashes." defaultChecked />
      </SettingsSection>
      <SettingsSection title="Data & Storage">
        <SettingRow title="Local Auto-Save" description="Auto-save to browser storage." defaultChecked />
      </SettingsSection>
    </div>
  );
}

function LayerNotice({ layer, desc }: { layer: string, desc: string }) {
  return (
    <div className="px-4 py-3 rounded-lg border border-white/5 bg-[#111111] flex items-start gap-3 mb-6">
      <Layers className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
      <div>
        <span className="text-sm font-medium text-white mb-0.5 block capitalize">Currently editing: {layer} Layer</span>
        <span className="text-xs text-gray-400">{desc}</span>
      </div>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-[10px] tracking-[0.15em] text-muted-foreground mb-4 pb-2 border-b border-border uppercase">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function SettingRow({
  title,
  description,
  defaultChecked,
  value,
  inherited
}: {
  title: string;
  description: string;
  defaultChecked?: boolean;
  value?: string;
  inherited?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-8 p-3 rounded-lg hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="text-sm font-medium text-white">{title}</h4>
          {inherited && <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-gray-400 font-medium">Inherited</span>}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {value ? (
        <span className="text-sm text-white font-medium bg-[#111111] px-3 py-1.5 rounded-md border border-white/10">{value}</span>
      ) : (
        <Switch defaultChecked={defaultChecked} />
      )}
    </div>
  );
}