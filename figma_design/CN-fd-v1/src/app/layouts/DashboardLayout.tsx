import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";

export function DashboardLayout() {
  return (
    <div className="flex h-screen w-full bg-[#000000] text-neutral-200 antialiased font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 h-full flex flex-col min-w-0 bg-[#070707] rounded-tl-xl border-l border-t border-neutral-800/40 mt-1 relative">
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
