import { Package, HardDrive, Settings, Info, Search } from "lucide-react";
import type { ViewType } from "../types";
import { APP_VERSION, APP_DISPLAY } from "../constants";

interface SidebarProps {
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
}

const navItems: { view: ViewType; label: string; icon: typeof Search }[] = [
  { view: "scanner", label: "Scanner", icon: Search },
  { view: "profiles", label: "Available Profiles", icon: Package },
  { view: "installed", label: "Installed", icon: HardDrive },
  { view: "settings", label: "Settings", icon: Settings },
  { view: "about", label: "About", icon: Info },
];

export function Sidebar({ activeView, onNavigate }: SidebarProps) {
  return (
    <aside className="w-56 bg-[#1a1d2e] border-r border-[#2d3148] flex flex-col py-4">
      <div className="px-4 mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
          Navigation
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {navItems.map(({ view, label, icon: Icon }) => (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeView === view
                ? "bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20"
                : "text-[#9ca3af] hover:text-[#e1e4f0] hover:bg-[#222436]"
            }`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="px-4 mt-auto pt-4 border-t border-[#2d3148]">
        <div className="text-xs text-[#6b7280]">
          <div className="font-medium">{APP_DISPLAY}</div>
          <div>{APP_VERSION}</div>
        </div>
      </div>
    </aside>
  );
}