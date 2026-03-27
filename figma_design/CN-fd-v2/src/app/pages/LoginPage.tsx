import React, { useState } from "react";
import { Github, ArrowRight, Shield } from "lucide-react";
import { useNavigate } from "react-router";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/onboarding");
  };

  return (
    <div className="flex h-screen w-full bg-[#0D0D0D] text-[#F0F0F0] font-sans">
      {/* Left branding panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-[48px] border-r border-[#2A2A2A] relative overflow-hidden">
        <div className="flex items-center gap-[8px] relative z-10">
          <div className="h-[28px] w-[28px] rounded-[6px] bg-[#1E1E1E] border border-[#2A2A2A] flex items-center justify-center">
            <div className="h-[14px] w-[14px] rounded-[4px] bg-[#F0F0F0]" />
          </div>
          <span className="tracking-[0.05em] text-[14px] font-medium">
            <span className="text-[#F0F0F0]">CREO</span>
            <span className="text-[#888888]">NOW</span>
          </span>
        </div>

        <div className="max-w-md relative z-10">
          <h1 className="text-[28px] font-bold text-[#F0F0F0] leading-[1.2] tracking-[-0.01em] mb-[16px]">
            The Creator's IDE
          </h1>
          <p className="text-[14px] text-[#888888] leading-[1.6]">
            Focus on what matters. A distraction-free environment designed to help you capture your thoughts with clarity and precision.
          </p>
        </div>

        <div className="flex justify-between text-[12px] text-[#888888] tracking-[0.05em] relative z-10">
          <span>&copy; 2026 CREONOW</span>
          <span>V2.4.0</span>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-[32px] lg:p-[48px] relative">
        <div className="w-full max-w-sm space-y-[24px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-[8px] mb-[32px]">
            <div className="h-[28px] w-[28px] rounded-[6px] bg-[#1E1E1E] border border-[#2A2A2A] flex items-center justify-center">
              <div className="h-[14px] w-[14px] rounded-[4px] bg-[#F0F0F0]" />
            </div>
            <span className="tracking-[0.05em] text-[14px] font-medium">
              <span className="text-[#F0F0F0]">CREO</span>
              <span className="text-[#888888]">NOW</span>
            </span>
          </div>

          <div>
            <h2 className="text-[28px] font-bold text-[#F0F0F0] leading-[1.2] tracking-[-0.01em] mb-[8px]">Welcome back</h2>
            <p className="text-[14px] text-[#888888] leading-[1.6]">Enter your workspace credentials to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-[16px]">
            <div className="space-y-[12px]">
              <div className="space-y-[4px]">
                <label className="text-[12px] text-[#888888] tracking-[0.05em] uppercase">Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[44px] px-[16px] rounded-[6px] bg-[#111111] border border-[#2A2A2A] text-[14px] text-[#F0F0F0] placeholder:text-[#555555] outline-none focus:border-[#3A3A3A] transition-colors duration-150"
                />
              </div>
              <div className="space-y-[4px]">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] text-[#888888] tracking-[0.05em] uppercase">Password</label>
                  <button type="button" className="text-[12px] text-[#888888] hover:text-[#F0F0F0] transition-colors duration-150">Forgot?</button>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[44px] px-[16px] rounded-[6px] bg-[#111111] border border-[#2A2A2A] text-[14px] text-[#F0F0F0] placeholder:text-[#555555] outline-none focus:border-[#3A3A3A] transition-colors duration-150"
                />
              </div>
            </div>

            <label className="flex items-center gap-[8px] cursor-pointer select-none group">
              <div
                onClick={() => setKeepSignedIn(!keepSignedIn)}
                className={`h-[16px] w-[16px] rounded-[4px] border flex items-center justify-center transition-all duration-150 ${
                  keepSignedIn ? "bg-[#F0F0F0] border-[#F0F0F0]" : "border-[#2A2A2A] group-hover:border-[#3A3A3A]"
                }`}
              >
                {keepSignedIn && (
                  <svg className="h-[12px] w-[12px] text-[#0D0D0D]" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-[14px] text-[#888888] group-hover:text-[#F0F0F0] transition-colors duration-150">Keep me signed in</span>
            </label>

            <button type="submit" className="w-full h-[44px] rounded-[6px] bg-[#F0F0F0] text-[#0D0D0D] flex items-center justify-center gap-[8px] text-[14px] font-medium hover:bg-[#CCCCCC] transition-colors duration-150">
              Sign In <ArrowRight className="h-[16px] w-[16px]" />
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[#2A2A2A]" /></div>
            <div className="relative flex justify-center text-[12px] uppercase tracking-[0.05em]">
              <span className="bg-[#0D0D0D] px-[16px] text-[#888888]">Or</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[12px]">
            <button className="h-[44px] flex items-center justify-center gap-[8px] rounded-[6px] border border-[#2A2A2A] bg-transparent text-[#888888] hover:text-[#F0F0F0] hover:bg-[#1E1E1E] hover:border-[#3A3A3A] transition-all duration-150 text-[14px]">
              <Github className="h-[16px] w-[16px]" /> GitHub
            </button>
            <button className="h-[44px] flex items-center justify-center gap-[8px] rounded-[6px] border border-[#2A2A2A] bg-transparent text-[#888888] hover:text-[#F0F0F0] hover:bg-[#1E1E1E] hover:border-[#3A3A3A] transition-all duration-150 text-[14px]">
              <Shield className="h-[16px] w-[16px]" /> SSO
            </button>
          </div>

          <p className="text-center text-[14px] text-[#888888]">
            Don't have an account?{" "}
            <button className="text-[#F0F0F0] hover:underline underline-offset-4">Apply for access</button>
          </p>
        </div>
      </div>
    </div>
  );
}
