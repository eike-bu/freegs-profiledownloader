import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Package,
  Loader2,
  Download,
  Globe,
  User,
  MapPin,
} from "lucide-react";
import type { ProfileEntry } from "../types";

interface ProfileListViewProps {
  onStatus: (msg: string) => void;
}

export function ProfileListView({ onStatus }: ProfileListViewProps) {
  const [profiles, setProfiles] = useState<ProfileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const settings: any = await invoke("get_settings");
      const indexUrl = settings.profiles_repo_url;
      const result: ProfileEntry[] = await invoke("fetch_profile_index", {
        url: indexUrl,
      });
      setProfiles(result);
      onStatus(`Loaded ${result.length} profiles`);
    } catch (err) {
      onStatus(`Failed to load profile index: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (profile: ProfileEntry) => {
    try {
      onStatus(`Downloading ${profile.icao} (${profile.developer})...`);
      const data: number[] = await invoke("download_profile", {
        url: profile.download_url,
      });
      const bytes = new Uint8Array(data);
      await invoke("install_profile", {
        profileZip: Array.from(bytes),
      });
      onStatus(`✅ ${profile.icao} installed successfully`);
    } catch (err) {
      onStatus(`❌ Download failed: ${err}`);
    }
  };

  // Get unique regions for the filter
  const regions = [...new Set(profiles.map((p) => p.region))].sort();

  // Filter profiles
  const filtered = profiles.filter((p) => {
    if (filter !== "all" && p.region !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.icao.toLowerCase().includes(q) ||
        p.scenery_name.toLowerCase().includes(q) ||
        p.developer.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Group by region
  const grouped = filtered.reduce<Record<string, ProfileEntry[]>>(
    (acc, p) => {
      if (!acc[p.region]) acc[p.region] = [];
      acc[p.region].push(p);
      return acc;
    },
    {}
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-[#6b7280]" />
        <span className="ml-3 text-sm text-[#9ca3af]">
          Loading profiles...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Available Profiles</h2>
        <p className="text-sm text-[#9ca3af]">
          Browse and download GSX profiles from the community repository.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by ICAO, scenery, or developer..."
          className="flex-1 bg-[#222436] border border-[#2d3148] rounded-lg px-4 py-2 text-sm text-[#e1e4f0] placeholder-[#6b7280] focus:outline-none focus:border-[#3b82f6]"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-[#222436] border border-[#2d3148] rounded-lg px-3 py-2 text-sm text-[#e1e4f0] focus:outline-none focus:border-[#3b82f6]"
        >
          <option value="all">All Regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button
          onClick={loadProfiles}
          className="flex items-center gap-2 px-3 py-2 bg-[#222436] border border-[#2d3148] rounded-lg text-sm hover:bg-[#2d3148] transition-colors"
        >
          <Loader2 size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Profile cards grouped by region */}
      {Object.entries(grouped).length === 0 && (
        <div className="text-center py-16 text-[#6b7280]">
          <Package size={40} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            No profiles found. Click Refresh to load from the repository.
          </p>
        </div>
      )}

      {Object.entries(grouped).map(([region, entries]) => (
        <div key={region}>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">
            <Globe size={14} />
            {region}
            <span className="text-xs font-normal text-[#6b7280]">
              ({entries.length})
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {entries.map((profile) => (
              <div
                key={`${profile.icao}-${profile.developer}`}
                className="bg-[#222436] border border-[#2d3148] rounded-lg p-4 hover:border-[#3d4260] transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-lg font-mono font-bold text-[#3b82f6]">
                      {profile.icao}
                    </span>
                    <span className="text-xs text-[#6b7280] ml-2">
                      {profile.scenery_name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDownload(profile)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3b82f6] text-white rounded-md text-xs font-medium hover:bg-[#2563eb] transition-colors"
                  >
                    <Download size={14} />
                    Install
                  </button>
                </div>
                <div className="space-y-1 text-xs text-[#9ca3af]">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} />
                    {profile.developer}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User size={12} />
                    by {profile.profile_author}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}