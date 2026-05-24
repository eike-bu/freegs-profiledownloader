import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Search, Loader2, HardDrive } from "lucide-react";
import type { SceneryAddon, AppSettings } from "../types";

interface ScannerViewProps {
  onStatus: (msg: string) => void;
}

export function ScannerView({ onStatus }: ScannerViewProps) {
  const [addons, setAddons] = useState<SceneryAddon[]>([]);
  const [loading, setLoading] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [hasPath, setHasPath] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const settings: AppSettings = await invoke("get_settings");
        setHasPath(!!settings.community_folder_path);
      } catch {}
      setSettingsLoaded(true);
    })();
  }, []);

  const handleScan = async () => {
    try {
      const settings: AppSettings = await invoke("get_settings");
      const path = settings.community_folder_path;
      if (!path?.trim()) {
        onStatus("Please set your Community folder path in Settings first");
        return;
      }
      setLoading(true);
      const result: SceneryAddon[] = await invoke("scan_community_folder", {
        path: path.trim(),
      });
      setAddons(result);
      const icaoCount = result.filter((a) => a.icao).length;
      onStatus(`Found ${result.length} addons (${icaoCount} with ICAO codes)`);
    } catch (err) {
      onStatus(`Error: ${err}`);
    } finally {
      setLoading(false);
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
      <div>
        <h2 className="text-lg font-semibold mb-1">Scan Community Folder</h2>
        <p className="text-sm text-[#9ca3af] mb-4">
          Click Scan to detect installed scenery addons in your configured Community folder.
        </p>
        {!hasPath ? (
          <div className="bg-[#222436] border border-[#2d3148] rounded-lg p-6 text-center">
            <p className="text-sm text-[#9ca3af] mb-2">
              No Community folder configured yet.
            </p>
            <p className="text-xs text-[#6b7280] mb-3">
              Go to Settings to set your MSFS Community folder path.
            </p>
            <button
              onClick={() => onStatus("Navigate to Settings → Configure Community Folder")}
              className="text-xs text-[#3b82f6] hover:underline"
            >
              Configure in Settings
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleScan}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#3b82f6] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              {loading ? "Scanning..." : "Scan Now"}
            </button>
          </div>
        )}
      </div>

      {addons.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">
            Detected Addons ({addons.length})
          </h3>
          <div className="space-y-1">
            {addons.map((addon) => (
              <div key={addon.path} className="flex items-center gap-3 bg-[#222436] border border-[#2d3148] rounded-lg px-4 py-3">
                <HardDrive size={16} className="text-[#6b7280]" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{addon.name}</div>
                  <div className="text-xs text-[#6b7280] truncate">{addon.path}</div>
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

      {addons.length === 0 && !loading && hasPath && (
        <div className="text-center py-16 text-[#6b7280]">
          <Search size={40} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">Click Scan to scan your Community folder</p>
        </div>
      )}
    </div>
  );
}