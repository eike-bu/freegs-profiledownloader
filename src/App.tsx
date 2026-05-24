import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { ScannerView } from "./components/ScannerView";
import { ProfileListView } from "./components/ProfileListView";
import { InstalledView } from "./components/InstalledView";
import { SettingsView } from "./components/SettingsView";
import { AboutView } from "./components/AboutView";
import type { ViewType } from "./types";
import { APP_VERSION } from "./constants";

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>("scanner");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const renderView = () => {
    switch (activeView) {
      case "scanner":
        return <ScannerView onStatus={showStatus} />;
      case "profiles":
        return <ProfileListView onStatus={showStatus} />;
      case "installed":
        return <InstalledView onStatus={showStatus} />;
      case "settings":
        return <SettingsView onStatus={showStatus} />;
      case "about":
        return <AboutView />;
      default:
        return <ScannerView onStatus={showStatus} />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#0f1117] text-[#e1e4f0]">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeView={activeView} onNavigate={setActiveView} />
        <main className="flex-1 overflow-y-auto p-6">
          {renderView()}
        </main>
      </div>

      {statusMessage && (
        <div className="fixed bottom-6 right-6 bg-[#222436] border border-[#2d3148] rounded-lg px-4 py-3 shadow-lg text-sm z-50 animate-fadeIn">
          {statusMessage}
        </div>
      )}

      <footer className="bg-[#191b28] border-t border-[#2d3148] px-4 py-1.5 flex items-center justify-between">
        <span className="text-xs text-[#6b7280]">{APP_VERSION}</span>
        <span className="text-xs text-[#6b7280]">FreeGS Profile Manager</span>
      </footer>
    </div>
  );
}