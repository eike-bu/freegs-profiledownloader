import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Save, RotateCcw } from "lucide-react";
import type { AppSettings } from "../types";

interface SettingsViewProps {
  onStatus: (msg: string) => void;
}

export function SettingsView({ onStatus }: SettingsViewProps) {
  const [settings, setSettings] = useState<AppSettings>({
    community_folder_path: null,
    profiles_repo_url:
      "https://raw.githubusercontent.com/freegs/freegs-profiles/main/index.json",
    auto_install: true,
  });

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
      onStatus("Settings saved successfully");
    } catch (err) {
      onStatus(`Error saving settings: ${err}`);
    }
  };

  const handleReset = () => {
    const defaults: AppSettings = {
      community_folder_path: null,
      profiles_repo_url:
        "https://raw.githubusercontent.com/freegs/freegs-profiles/main/index.json",
      auto_install: true,
    };
    setSettings(defaults);
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
          <input
            type="text"
            value={settings.community_folder_path ?? ""}
            onChange={(e) =>
              setSettings({ ...settings, community_folder_path: e.target.value || null })
            }
            placeholder="Path to your MSFS Community folder"
            className="w-full bg-[#222436] border border-[#2d3148] rounded-lg px-4 py-2 text-sm text-[#e1e4f0] placeholder-[#6b7280] focus:outline-none focus:border-[#3b82f6]"
          />
          <p className="text-xs text-[#6b7280] mt-1">
            e.g. C:\Program Files\MSFS2024\Community
          </p>
        </div>

        {/* Repository URL */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Profiles Repository URL
          </label>
          <input
            type="text"
            value={settings.profiles_repo_url}
            onChange={(e) =>
              setSettings({ ...settings, profiles_repo_url: e.target.value })
            }
            className="w-full bg-[#222436] border border-[#2d3148] rounded-lg px-4 py-2 text-sm text-[#e1e4f0] placeholder-[#6b7280] focus:outline-none focus:border-[#3b82f6] font-mono text-xs"
          />
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