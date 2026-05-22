import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { HardDrive, FileText, Loader2 } from "lucide-react";
import type { InstalledProfile } from "../types";

interface InstalledViewProps {
  onStatus: (msg: string) => void;
}

export function InstalledView({ onStatus }: InstalledViewProps) {
  const [profiles, setProfiles] = useState<InstalledProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInstalled();
  }, []);

  const loadInstalled = async () => {
    setLoading(true);
    try {
      const result: InstalledProfile[] = await invoke("get_installed_profiles");
      setProfiles(result);
    } catch (err) {
      onStatus(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-[#6b7280]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Installed Profiles</h2>
        <p className="text-sm text-[#9ca3af]">
          GSX profiles currently installed in your profiles folder.
        </p>
      </div>

      {profiles.length === 0 && (
        <div className="text-center py-16 text-[#6b7280]">
          <HardDrive size={40} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">No GSX profiles installed yet.</p>
          <p className="text-xs mt-1">
            Use the Available Profiles tab to download profiles.
          </p>
        </div>
      )}

      <div className="space-y-1">
        {profiles.map((profile) => (
          <div
            key={profile.ini_path}
            className="flex items-center gap-3 bg-[#222436] border border-[#2d3148] rounded-lg px-4 py-3"
          >
            <HardDrive size={16} className="text-[#6b7280]" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[#3b82f6] text-sm">
                  {profile.icao}
                </span>
                <span className="text-xs text-[#6b7280]">
                  {profile.developer}
                </span>
              </div>
              <div className="text-xs text-[#6b7280] truncate mt-0.5">
                {profile.ini_path}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#6b7280]">
              <FileText size={14} />
              {profile.py_path ? "INI + PY" : "INI only"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}