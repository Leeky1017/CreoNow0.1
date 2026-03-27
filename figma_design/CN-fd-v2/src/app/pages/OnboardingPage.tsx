import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Brain, Users, Share2, Clock } from "lucide-react";
import { cn } from "../components/ui/utils";

const options = [
  { id: 1, title: "Agent 智能写作", icon: Brain, desc: "Agent-powered writing assistant" },
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
    <div className="flex h-screen w-full flex-col bg-[#0D0D0D] text-[#F0F0F0] items-center justify-center p-[32px] relative overflow-hidden font-sans">
      {/* Logo */}
      <div className="absolute top-[40px] left-1/2 -translate-x-1/2 flex items-center gap-[8px]">
        <div className="h-[32px] w-[32px] rounded-[6px] bg-[#1E1E1E] border border-[#2A2A2A] flex items-center justify-center">
          <div className="h-[16px] w-[16px] rounded-[4px] bg-[#F0F0F0]" />
        </div>
        <span className="text-[16px] font-semibold tracking-[0.05em]">CreoNow</span>
      </div>

      <div className="max-w-2xl w-full flex flex-col items-center space-y-[32px] relative z-10">
        {/* Title */}
        <div className="text-center space-y-[8px]">
          <h1 className="text-[28px] font-bold text-[#F0F0F0] leading-[1.2] tracking-[-0.01em]">CreoNow</h1>
          <p className="text-[12px] text-[#888888] tracking-[0.05em] uppercase">Agent-Native Content Creation IDE</p>
        </div>

        {/* Option cards */}
        <div className="grid grid-cols-2 gap-[16px] w-full">
          {options.map((opt) => {
            const isSelected = selected.has(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggle(opt.id)}
                className={cn(
                  "flex items-center gap-[16px] p-[20px] rounded-[8px] text-left transition-all duration-150 border",
                  isSelected
                    ? "bg-[rgba(240,240,240,0.08)] border-[#3A3A3A]"
                    : "bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#3A3A3A] hover:bg-[#1E1E1E]"
                )}
              >
                <div
                  className={cn(
                    "h-[48px] w-[48px] rounded-full flex items-center justify-center shrink-0 transition-all duration-150",
                    isSelected ? "bg-[#F0F0F0] text-[#0D0D0D]" : "bg-[#1E1E1E] text-[#888888]"
                  )}
                >
                  <opt.icon className="h-[20px] w-[20px]" />
                </div>
                <div>
                  <div className="text-[14px] font-medium text-[#F0F0F0]">{opt.title}</div>
                  <div className="text-[12px] text-[#888888] mt-[4px]">{opt.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-[40px] left-0 right-0 px-[48px] flex justify-between items-center">
        <div className="flex items-center gap-[24px] text-[12px] text-[#888888] tracking-[0.05em] uppercase">
          <button className="hover:text-[#F0F0F0] transition-colors duration-150">帮助</button>
          <button onClick={() => navigate("/app")} className="hover:text-[#F0F0F0] transition-colors duration-150">跳过</button>
        </div>

        <div className="flex items-center gap-[8px]">
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn("h-[6px] w-[6px] rounded-full transition-colors duration-150", i === step ? "bg-[#F0F0F0]" : "bg-[#2A2A2A]")} />
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={selected.size === 0}
          className="h-[44px] px-[24px] rounded-[6px] bg-[#F0F0F0] text-[#0D0D0D] flex items-center gap-[8px] text-[14px] font-medium hover:bg-[#CCCCCC] disabled:opacity-30 disabled:pointer-events-none transition-all duration-150"
        >
          继续设置 <ArrowRight className="h-[16px] w-[16px]" />
        </button>
      </div>
    </div>
  );
}