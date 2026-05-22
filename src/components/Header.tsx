import { Package } from "lucide-react";

export function Header() {
  return (
    <header className="h-12 bg-[#1a1d2e] border-b border-[#2d3148] flex items-center px-4 gap-3 no-select">
      <Package size={20} className="text-[#3b82f6]" />
      <h1 className="text-sm font-semibold">FreeGS Profile Downloader</h1>
    </header>
  );
}