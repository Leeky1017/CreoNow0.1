import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Brain, Users, Share2, Clock } from "lucide-react";

const options = [
  {
    id: 1,
    title: "AI 智能写作",
    icon: Brain,
    desc: "AI-powered writing assistant",
  },
  { id: 2, title: "个人工作区", icon: Users, desc: "Personal workspace" },
  { id: 3, title: "团队协作", icon: Share2, desc: "Shared collaboration" },
  { id: 4, title: "历史同步", icon: Clock, desc: "Cloud history sync" },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [step, setStep] = useState(0);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleContinue = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      navigate("/app");
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground items-center justify-center p-8 relative overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(124,110,240,0.04)_0%,_transparent_70%)] pointer-events-none" />

      {/* Logo */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-black text-sm">
          C
        </div>
        <span className="text-lg tracking-wide">CreoNow</span>
      </div>

      <div className="max-w-2xl w-full flex flex-col items-center space-y-12 relative z-10">
        {/* Title */}
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-serif text-white tracking-tight">
            CreoNow
          </h1>
          <p className="text-muted-foreground text-sm tracking-[0.2em] uppercase">
            AI Native Content Creation IDE
          </p>
        </div>

        {/* Option cards */}
        <div className="grid grid-cols-2 gap-4 w-full">
          {options.map((opt) => {
            const isSelected = selected.has(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggle(opt.id)}
                className={`flex items-center gap-5 p-6 rounded-2xl text-left transition-all duration-200 group border ${
                  isSelected
                    ? "bg-white/[0.06] border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.03)]"
                    : "bg-secondary/50 border-border hover:bg-secondary hover:border-white/10"
                }`}
              >
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isSelected
                      ? "bg-white text-black"
                      : "bg-muted text-muted-foreground group-hover:text-white"
                  }`}
                >
                  <opt.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-foreground group-hover:text-white transition-colors">
                    {opt.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {opt.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-10 left-0 right-0 px-12 flex justify-between items-center">
        <div className="flex items-center gap-6 text-[11px] text-muted-foreground tracking-[0.15em] uppercase">
          <button className="hover:text-white transition-colors">帮助</button>
          <button
            onClick={() => navigate("/app")}
            className="hover:text-white transition-colors"
          >
            跳过
          </button>
        </div>

        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === step ? "bg-white" : "bg-zinc-800"
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={selected.size === 0}
          className="h-11 px-8 rounded-full bg-white text-black flex items-center gap-2 text-sm hover:bg-zinc-200 active:bg-zinc-300 disabled:opacity-30 disabled:pointer-events-none transition-all"
        >
          继续设置
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
