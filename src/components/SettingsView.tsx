import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Save, RotateCcw, FolderOpen } from "lucide-react";
import type { AppSettings } from "../types";

interface SettingsViewProps {
  onStatus: (msg: string) => void;
}

export function SettingsView({ onStatus }: SettingsViewProps) {
  const [settings, setSettings] = useState<AppSettings>({
    community_folder_path: null,
    profiles_repo_url:
      "http://10.8.0.1/freegs/freegs-profiles/raw/branch/main/index.json",
    profiles_base_url:
      "http://10.8.0.1/freegs/freegs-profiles/raw/branch/main",
    auto_install: true,
  });
  const [communityPath2024, setCommunityPath2024] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const saved: AppSettings = await invoke("get_settings");
        setSettings(saved);
      } catch {
        // Use defaults
      }
    })();
  }, []);

  const handleSave = async () => {
    try {
      await invoke("save_settings", { settings });
      onStatus("✅ Settings saved");
    } catch (err) {
      onStatus(`❌ ${err}`);
    }
  };

  const handleReset = () => {
    setSettings({
      community_folder_path: null,
      profiles_repo_url:
        "http://10.8.0.1/freegs/freegs-profiles/raw/branch/main/index.json",
      profiles_base_url:
        "http://10.8.0.1/freegs/freegs-profiles/raw/branch/main",
      auto_install: true,
    });
  };

  const selectFolder = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ directory: true });
      if (selected) {
        setSettings({ ...settings, community_folder_path: selected });
      }
    } catch {
      // Fallback: manual entry
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Settings</h2>
        <p className="text-sm text-[#9ca3af]">
          Configure the FreeGS Profile Downloader.
        </p>
      </div>
      <div className="space-y-4">
        {/* Community Folder */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            MSFS Community Folder
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={settings.community_folder_path ?? ""}
              onChange={(e) =>
                setSettings({ ...settings, community_folder_path: e.target.value || null })
              }
              placeholder="Path to your MSFS Community folder"
              className="flex-1 bg-[#222436] border border-[#2d3148] rounded-lg px-4 py-2 text-sm text-[#e1e4f0] placeholder-[#6b7280] focus:outline-none focus:border-[#3b82f6]"
            />
            <button
              onClick={selectFolder}
              className="flex items-center justify-center px-3 py-2 bg-[#222436] border border-[#2d3148] rounded-lg hover:bg-[#2d3148] transition-colors"
              title="Browse folders"
            >
              <FolderOpen size={18} />
            </button>
          </div>
          <p className="text-xs text-[#6b7280] mt-1">
            e.g. C:\Program Files\MSFS2024\Community
          </p>
        </div>

        {/* Community Folder 2024 */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            MSFS 2024 Community Folder (optional)
          </label>
          <input
            type="text"
            value={communityPath2024}
            onChange={(e) => setCommunityPath2024(e.target.value)}
            placeholder="Path to MSFS 2024 Community folder (if different)"
            className="w-full bg-[#222436] border border-[#2d3148] rounded-lg px-4 py-2 text-sm text-[#e1e4f0] placeholder-[#6b7280] focus:outline-none focus:border-[#3b82f6]"
          />
          <p className="text-xs text-[#6b7280] mt-1">
            For MSFS 2024 installations with separate Community folder.
          </p>
        </div>

        {/* Profiles Repository URL */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Profile Repository URL
          </label>
          <input
            type="text"
            value={settings.profiles_repo_url}
            onChange={(e) => {
              const url = e.target.value;
              setSettings({ ...settings, profiles_repo_url: url });
              // Auto-derive base URL from index URL
              // Assumes index.json is always at the same location
              const baseUrl = url.replace("/raw/branch/main/index.json", "");
              setSettings(s => ({ ...s, profiles_base_url: baseUrl }));
            }}
            className="w-full bg-[#222436] border border-[#2d3148] rounded-lg px-4 py-2 text-sm text-[#e1e4f0] placeholder-[#6b7280] focus:outline-none focus:border-[#3b82f6] font-mono text-xs"
          />
          <p className="text-xs text-[#6b7280] mt-1">
            URL to the profile index.json file. The base URL is automatically derived.
          </p>
        </div>

        {/* Auto-install */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="auto_install"
            checked={settings.auto_install}
            onChange={(e) =>
              setSettings({ ...settings, auto_install: e.target.checked })
            }
            className="w-4 h-4 rounded border-[#2d3148] bg-[#222436] text-[#3b82f6] focus:ring-[#3b82f6]"
          />
          <label htmlFor="auto_install" className="text-sm">
            Auto-install profiles after download
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-colors"
          >
            <Save size={16} />
            Save Settings
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-[#222436] border border-[#2d3148] rounded-lg text-sm hover:bg-[#2d3148] transition-colors"
          >
            <RotateCcw size={16} />
            Reset Defaults
          </button>
        </div>
      </div>
    </div>
  );
}