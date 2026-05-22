import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Package,
  Loader2,
  Download,
  Globe,
  User,
  MapPin,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import type { ProfileEntry, DownloadResult } from "../types";
import { openUrl } from "@tauri-apps/plugin-opener";

interface ProfileListViewProps {
  onStatus: (msg: string) => void;
}

export function ProfileListView({ onStatus }: ProfileListViewProps) {
  const [profiles, setProfiles] = useState<ProfileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const settings: any = await invoke("get_settings");
      const indexUrl = settings.profiles_repo_url;
      const result: ProfileEntry[] = await invoke("fetch_profile_index", {
        url: indexUrl,
      });
      setProfiles(result);
      onStatus(`✅ ${result.length} profiles loaded`);
    } catch (err) {
      const msg = `${err}`;
      setError(msg);
      onStatus(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (profile: ProfileEntry) => {
    const key = `${profile.icao}-${profile.developer}`;
    setDownloading(key);
    try {
      const settings: any = await invoke("get_settings");
      const baseUrl = settings.profiles_base_url;
      onStatus(`⬇️ Downloading ${profile.icao}...`);
      const result: DownloadResult = await invoke("download_profile", {
        profile,
        baseUrl,
      });

      if (result.verified) {
        onStatus(`✅ ${result.message}`);
      } else {
        onStatus(`⚠️ ${result.message}`);
      }
    } catch (err) {
      onStatus(`❌ Download failed: ${err}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleOpenSource = async (url: string) => {
    try {
      await openUrl(url);
    } catch {
      // Fallback — copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        onStatus("📋 URL copied to clipboard");
      } catch {
        onStatus("❌ Could not open link");
      }
    }
  };

  // Offline/Error state
  if (error && profiles.length === 0 && !loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-1">Available Profiles</h2>
          <p className="text-sm text-[#9ca3af]">
            Browse and download GSX profiles from the community repository.
          </p>
        </div>
        <div className="bg-[#222436] border border-[#2d3148] rounded-lg p-8 text-center">
          <WifiOff size={48} className="mx-auto mb-4 text-[#6b7280] opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
          <p className="text-sm text-[#9ca3af] mb-4 max-w-md mx-auto">
            Could not connect to the profile repository ({error.split(":")[0] || "timeout"}).
            Make sure you are connected to the FreeGS VPN (10.8.0.1).
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={loadProfiles}
              className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-colors"
            >
              <RefreshCw size={16} />
              Retry
            </button>
            <button
              onClick={() => setError(null)}
              className="flex items-center gap-2 px-4 py-2 bg-[#222436] border border-[#2d3148] rounded-lg text-sm hover:bg-[#2d3148] transition-colors"
            >
              Show cached profiles
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Error banner (non-fatal, profiles loaded previously) */}
      {error && profiles.length > 0 && (
        <div className="flex items-center gap-3 bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-lg px-4 py-3">
          <WifiOff size={16} className="text-[#3b82f6]" />
          <span className="text-sm text-[#9ca3af]">
            Could not refresh — using cached data. Check your VPN connection.
          </span>
          <button
            onClick={loadProfiles}
            className="ml-auto text-xs text-[#3b82f6] hover:underline"
          >
            Retry
          </button>
        </div>
      )}

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
            {entries.map((profile) => {
              const key = `${profile.icao}-${profile.developer}`;
              const isDownloading = downloading === key;
              const fileCount = Object.keys(profile.files).length;
              const hasHash = fileCount > 0 && Object.values(profile.files).some((h) => h && h.length > 0);
              const hasSource = profile.source_url && profile.source_name;

              return (
                <div
                  key={key}
                  className="bg-[#222436] border border-[#2d3148] rounded-lg p-4 hover:border-[#3d4260] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-mono font-bold text-[#3b82f6]">
                          {profile.icao}
                        </span>
                        {hasHash && (
                          <span title="SHA256 verified">
                            <ShieldCheck size={14} className="text-green-500" />
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#6b7280] block truncate">
                        {profile.scenery_name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDownload(profile)}
                      disabled={isDownloading || fileCount === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3b82f6] text-white rounded-md text-xs font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      {isDownloading ? "Installing..." : "Install"}
                    </button>
                  </div>
                  <div className="space-y-1 text-xs text-[#9ca3af]">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} />
                      {profile.developer}
                      <span className="text-[#6b7280]">
                        · {fileCount} file{fileCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User size={12} />
                      by {profile.profile_author}
                    </div>
                    {hasSource && profile.source_url && (
                      <button
                        onClick={() => handleOpenSource(profile.source_url!)}
                        className="flex items-center gap-1.5 text-[#3b82f6] hover:underline mt-1"
                      >
                        <ExternalLink size={12} />
                        {profile.source_name}
                        {profile.source_type === "freeware" ? (
                          <span className="text-[#22c55e]">· Freeware</span>
                        ) : profile.source_type === "payware" ? (
                          <span className="text-[#f59e0b]">· Payware</span>
                        ) : null}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}