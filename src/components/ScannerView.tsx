import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Search, FolderOpen, Loader2, HardDrive } from "lucide-react";
import type { SceneryAddon, AppSettings } from "../types";

interface ScannerViewProps {
  onStatus: (msg: string) => void;
}

export function ScannerView({ onStatus }: ScannerViewProps) {
  const [addons, setAddons] = useState<SceneryAddon[]>([]);
  const [loading, setLoading] = useState(false);
  const [communityPath, setCommunityPath] = useState<string>("");
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load saved community folder path
  useEffect(() => {
    (async () => {
      try {
        const settings: AppSettings = await invoke("get_settings");
        if (settings.community_folder_path) {
          setCommunityPath(settings.community_folder_path);
        }
      } catch {
        // Use defaults
      }
      setSettingsLoaded(true);
    })();
  }, []);

  const handleScan = async () => {
    if (!communityPath.trim()) {
      onStatus("Please enter a Community folder path first");
      return;
    }
    setLoading(true);
    try {
      const result: SceneryAddon[] = await invoke("scan_community_folder", {
        path: communityPath.trim(),
      });
      setAddons(result);
      const icaoCount = result.filter((a) => a.icao).length;
      onStatus(
        `Found ${result.length} addons (${icaoCount} with ICAO codes)`
      );
    } catch (err) {
      onStatus(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const selectFolder = async () => {
    try {
      // Use Tauri dialog to pick folder
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ directory: true });
      if (selected) {
        setCommunityPath(selected);
        // Auto-save as default
        const settings: AppSettings = await invoke("get_settings");
        settings.community_folder_path = selected;
        await invoke("save_settings", { settings });
      }
    } catch {
      // Fallback: manual entry
    }
  };

  if (!settingsLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-[#6b7280]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Scan section */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Scan Community Folder</h2>
        <p className="text-sm text-[#9ca3af] mb-4">
          Point to your MSFS Community folder to detect installed scenery
          addons.
        </p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={communityPath}
              onChange={(e) => setCommunityPath(e.target.value)}
              placeholder="e.g. C:\MSFS\Community or /home/user/.local/share/Steam/steamapps/common/MSFS2024/Community"
              className="w-full bg-[#222436] border border-[#2d3148] rounded-lg px-4 py-2.5 text-sm text-[#e1e4f0] placeholder-[#6b7280] focus:outline-none focus:border-[#3b82f6]"
            />
          </div>
          <button
            onClick={selectFolder}
            className="flex items-center gap-2 px-3 py-2.5 bg-[#222436] border border-[#2d3148] rounded-lg text-sm hover:bg-[#2d3148] transition-colors"
            title="Browse folders"
          >
            <FolderOpen size={18} />
          </button>
          <button
            onClick={handleScan}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#3b82f6] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Search size={18} />
            )}
            {loading ? "Scanning..." : "Scan"}
          </button>
        </div>
      </div>

      {/* Results */}
      {addons.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">
            Detected Addons ({addons.length})
          </h3>
          <div className="space-y-1">
            {addons.map((addon) => (
              <div
                key={addon.path}
                className="flex items-center gap-3 bg-[#222436] border border-[#2d3148] rounded-lg px-4 py-3"
              >
                <HardDrive size={16} className="text-[#6b7280]" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {addon.name}
                  </div>
                  <div className="text-xs text-[#6b7280] truncate">
                    {addon.path}
                  </div>
                </div>
                {addon.icao ? (
                  <span className="text-xs font-mono bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20 rounded px-2 py-0.5">
                    {addon.icao}
                  </span>
                ) : (
                  <span className="text-xs text-[#6b7280]">—</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {addons.length === 0 && !loading && (
        <div className="text-center py-16 text-[#6b7280]">
          <Search size={40} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">Enter a Community folder path and click Scan</p>
        </div>
      )}
    </div>
  );
}