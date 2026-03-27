import React, { useState } from "react";
import { Github, ArrowRight, Shield } from "lucide-react";
import { useNavigate } from "react-router";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/onboarding");
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground font-sans">
      {/* Left branding panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 border-r border-border relative overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 via-transparent to-transparent pointer-events-none" />

        <div className="flex items-center gap-2.5 relative z-10">
          <div className="h-7 w-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
            <div className="h-3.5 w-3.5 rounded-sm bg-white/80" />
          </div>
          <span className="tracking-wider text-sm">
            <span className="text-white">CREO</span>
            <span className="text-muted-foreground">NOW</span>
          </span>
        </div>

        <div className="max-w-md relative z-10">
          <h1 className="text-5xl font-serif mb-6 leading-[1.15] text-white">
            The aesthetic
            <br />
            of silence.
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Focus on what matters. Our distraction-free environment is designed
            to help you capture your thoughts with clarity and precision.
          </p>
        </div>

        <div className="flex justify-between text-xs text-muted-foreground tracking-wider relative z-10">
          <span>&copy; 2024 CREONOW</span>
          <span>V2.4.0</span>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-24 relative">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-12">
            <div className="h-7 w-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
              <div className="h-3.5 w-3.5 rounded-sm bg-white/80" />
            </div>
            <span className="tracking-wider text-sm">
              <span className="text-white">CREO</span>
              <span className="text-muted-foreground">NOW</span>
            </span>
          </div>

          <div>
            <h2 className="text-2xl mb-2 text-white">Welcome back</h2>
            <p className="text-muted-foreground text-sm">
              Enter your workspace credentials to continue.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] text-muted-foreground tracking-[0.15em] uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full h-11 px-4 rounded-lg bg-card border text-sm text-foreground placeholder:text-zinc-600 outline-none transition-all ${
                    focusedField === "email"
                      ? "border-white/30 ring-1 ring-white/10"
                      : "border-border hover:border-white/15"
                  }`}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-muted-foreground tracking-[0.15em] uppercase">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-white transition-colors"
                  >
                    Forgot?
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full h-11 px-4 rounded-lg bg-card border text-sm text-foreground placeholder:text-zinc-600 outline-none transition-all tracking-widest ${
                    focusedField === "password"
                      ? "border-white/30 ring-1 ring-white/10"
                      : "border-border hover:border-white/15"
                  }`}
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <div
                onClick={() => setKeepSignedIn(!keepSignedIn)}
                className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${
                  keepSignedIn
                    ? "bg-white border-white"
                    : "border-white/20 group-hover:border-white/40"
                }`}
              >
                {keepSignedIn && (
                  <svg
                    className="h-3 w-3 text-black"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M2.5 6L5 8.5L9.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                Keep me signed in
              </span>
            </label>

            <button
              type="submit"
              className="w-full h-11 rounded-full bg-white text-black flex items-center justify-center gap-2 text-sm hover:bg-zinc-200 active:bg-zinc-300 transition-colors"
            >
              Sign In
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-[0.2em]">
              <span className="bg-background px-4 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="h-11 flex items-center justify-center gap-2 rounded-full border border-border bg-transparent text-muted-foreground hover:text-white hover:bg-white/5 hover:border-white/15 transition-all text-sm">
              <Github className="h-4 w-4" />
              GitHub
            </button>
            <button className="h-11 flex items-center justify-center gap-2 rounded-full border border-border bg-transparent text-muted-foreground hover:text-white hover:bg-white/5 hover:border-white/15 transition-all text-sm">
              <Shield className="h-4 w-4" />
              SSO
            </button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button className="text-white hover:underline underline-offset-4">
              Apply for access
            </button>
          </p>
        </div>

        {/* Quote */}
        <div className="absolute bottom-8 right-8 max-w-[260px] hidden xl:block">
          <p className="text-xs italic text-zinc-600 mb-2 leading-relaxed">
            "The role of the designer is that of a good, thoughtful host
            anticipating the needs of his guests."
          </p>
          <p className="text-[10px] text-zinc-700 tracking-[0.2em] uppercase">
            &mdash; Charles Eames
          </p>
        </div>
      </div>
    </div>
  );
}
