import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Package, Loader2, Download, Globe, User, MapPin, ExternalLink,
  ShieldCheck, RefreshCw, CheckSquare, Square, ChevronDown, ChevronUp,
  History, HardDrive,
} from "lucide-react";
import type { ProfileEntry, DownloadResult, InstalledProfile, CommitEntry } from "../types";

interface ProfileListViewProps {
  onStatus: (msg: string) => void;
}

interface ProfilePopup {
  icao: string;
  developer: string;
  changelog: CommitEntry[];
  loading: boolean;
}

export function ProfileListView({ onStatus }: ProfileListViewProps) {
  const [profiles, setProfiles] = useState<ProfileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUrl, setLastUrl] = useState<string>("");
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedIcaos, setSelectedIcaos] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [installedIcaos, setInstalledIcaos] = useState<Set<string>>(new Set());
  const [useInstalledFilter, setUseInstalledFilter] = useState(false);
  const [popup, setPopup] = useState<ProfilePopup | null>(null);

  useEffect(() => { loadProfiles(); }, []);

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const settings: any = await invoke("get_settings");
      const indexUrl = settings.profiles_repo_url;
      setLastUrl(indexUrl);
      const result: ProfileEntry[] = await invoke("fetch_profile_index", { url: indexUrl });
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

  const loadInstalledIcaos = async () => {
    try {
      const installed: InstalledProfile[] = await invoke("get_installed_profiles");
      const icaos = new Set(installed.map((p) => p.icao.toUpperCase()));
      setInstalledIcaos(icaos);
      return icaos;
    } catch {
      return new Set<string>();
    }
  };

  const handleDownload = async (profile: ProfileEntry) => {
    const key = `${profile.icao}-${profile.developer}`;
    setDownloading(key);
    try {
      const settings: any = await invoke("get_settings");
      const baseUrl = settings.profiles_base_url;
      onStatus(`⬇️ Downloading ${profile.icao}...`);
      const result: DownloadResult = await invoke("download_profile", { profile, baseUrl });
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

  const handleBatchDownload = async () => {
    const selected = profiles.filter(
      (p) => selectedIcaos.has(p.icao.toUpperCase())
    );
    if (selected.length === 0) {
      onStatus("No profiles selected for batch download");
      return;
    }
    onStatus(`⬇️ Downloading ${selected.length} profiles...`);
    const settings: any = await invoke("get_settings");
    const baseUrl = settings.profiles_base_url;
    let success = 0;
    let failed = 0;
    for (const profile of selected) {
      const key = `${profile.icao}-${profile.developer}`;
      setDownloading(key);
      try {
        await invoke("download_profile", { profile, baseUrl });
        success++;
      } catch {
        failed++;
      } finally {
        setDownloading(null);
      }
    }
    onStatus(`✅ Batch download complete: ${success} succeeded, ${failed} failed`);
    setSelectedIcaos(new Set());
  };

  const handleShowUpdates = async (profile: ProfileEntry) => {
    // Show a popup with profile update info / commit history
    setPopup({
      icao: profile.icao,
      developer: profile.developer,
      changelog: [],
      loading: true,
    });
    try {
      const commits: CommitEntry[] = await invoke("get_profile_commits", {
        icao: profile.icao,
        developer: profile.developer,
        region: profile.region,
        maxCount: 20,
      });
      setPopup({
        icao: profile.icao,
        developer: profile.developer,
        changelog: commits,
        loading: false,
      });
    } catch (err) {
      setPopup({
        icao: profile.icao,
        developer: profile.developer,
        changelog: [],
        loading: false,
      });
    }
  };

  const toggleSelect = (icao: string) => {
    const next = new Set(selectedIcaos);
    if (next.has(icao.toUpperCase())) {
      next.delete(icao.toUpperCase());
    } else {
      next.add(icao.toUpperCase());
    }
    setSelectedIcaos(next);
  };

  const toggleSelectAll = () => {
    if (selectedIcaos.size === filtered.length) {
      setSelectedIcaos(new Set());
    } else {
      setSelectedIcaos(new Set(filtered.map((p) => p.icao.toUpperCase())));
    }
  };

  const handleFilterByInstalled = async () => {
    if (useInstalledFilter) {
      setUseInstalledFilter(false);
      return;
    }
    const icaos = await loadInstalledIcaos();
    if (icaos.size === 0) {
      onStatus("No installed profiles found. Scan your Community folder first.");
      return;
    }
    setUseInstalledFilter(true);
    const count = profiles.filter((p) => icaos.has(p.icao.toUpperCase())).length;
    onStatus(`Filtering ${count} profiles matching installed addons`);
  };

  // Error state
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
          <div className="text-[#6b7280] opacity-50 mx-auto mb-4" style={{ fontSize: "48px" }}>
            📡
          </div>
          <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
          <p className="text-sm text-[#9ca3af] mb-1">
            Could not connect to the profile repository.
          </p>
          <p className="text-xs text-[#6b7280] mb-4 font-mono break-all">
            Tried: {lastUrl}
          </p>
          {!lastUrl.includes("10.8.0.1") && (
            <p className="text-xs text-[#f59e0b] mb-4">
              ⚠️ URL does not point to the VPN server (10.8.0.1)
            </p>
          )}
          <div className="flex justify-center gap-3">
            <button
              onClick={loadProfiles}
              className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-colors"
            >
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const regions = [...new Set(profiles.map((p) => p.region))].sort();

  let filtered = profiles.filter((p) => {
    if (filter !== "all" && p.region !== filter) return false;
    if (useInstalledFilter && !installedIcaos.has(p.icao.toUpperCase())) return false;
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

  const grouped = filtered.reduce<Record<string, ProfileEntry[]>>((acc, p) => {
    if (!acc[p.region]) acc[p.region] = [];
    acc[p.region].push(p);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-[#6b7280]" />
        <span className="ml-3 text-sm text-[#9ca3af]">Loading profiles...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Available Profiles</h2>
        <p className="text-sm text-[#9ca3af]">
          Browse and download GSX profiles from the community repository.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by ICAO, scenery, or developer..."
          className="flex-1 min-w-[200px] bg-[#222436] border border-[#2d3148] rounded-lg px-4 py-2 text-sm text-[#e1e4f0] placeholder-[#6b7280] focus:outline-none focus:border-[#3b82f6]"
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
          onClick={handleFilterByInstalled}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            useInstalledFilter
              ? "bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30"
              : "bg-[#222436] border border-[#2d3148] text-[#e1e4f0] hover:bg-[#2d3148]"
          }`}
        >
          <HardDrive size={14} /> Installed Only
        </button>
        <button
          onClick={loadProfiles}
          className="flex items-center gap-2 px-3 py-2 bg-[#222436] border border-[#2d3148] rounded-lg text-sm text-[#e1e4f0] hover:bg-[#2d3148] transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Batch Mode Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setBatchMode(!batchMode)}
          className={`flex items-center gap-2 text-xs transition-colors ${
            batchMode ? "text-[#3b82f6]" : "text-[#6b7280] hover:text-[#9ca3af]"
          }`}
        >
          {batchMode ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {batchMode ? "Hide batch controls" : "Batch download mode"}
        </button>
        {batchMode && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6b7280]">
              {selectedIcaos.size} selected
            </span>
            <button
              onClick={toggleSelectAll}
              className="text-xs text-[#3b82f6] hover:underline"
            >
              {selectedIcaos.size === filtered.length ? "Deselect all" : "Select all"}
            </button>
            <button
              onClick={handleBatchDownload}
              disabled={selectedIcaos.size === 0}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#22c55e] text-white rounded-md text-xs font-medium hover:bg-[#16a34a] transition-colors disabled:opacity-50"
            >
              <Download size={12} /> Download all ({selectedIcaos.size})
            </button>
          </div>
        )}
      </div>

      {error && profiles.length > 0 && (
        <div className="flex items-center gap-3 bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-lg px-4 py-3">
          <span className="text-sm text-[#9ca3af]">
            Could not refresh — using cached data.
          </span>
          <button
            onClick={loadProfiles}
            className="ml-auto text-xs text-[#3b82f6] hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {Object.entries(grouped).length === 0 && (
        <div className="text-center py-16 text-[#6b7280]">
          <Package size={40} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">No profiles found.</p>
        </div>
      )}

      {Object.entries(grouped).map(([region, entries]) => (
        <div key={region}>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">
            <Globe size={14} /> {region}{" "}
            <span className="text-xs font-normal text-[#6b7280]">
              ({entries.length})
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {entries.map((profile) => {
              const key = `${profile.icao}-${profile.developer}`;
              const isDownloading = downloading === key;
              const fileCount = Object.keys(profile.files).length;
              const hasHash =
                fileCount > 0 &&
                Object.values(profile.files).some(
                  (h) => h && h.length > 0
                );
              const hasSource =
                profile.source_url && profile.source_name;
              const isSelected = selectedIcaos.has(
                profile.icao.toUpperCase()
              );

              return (
                <div
                  key={key}
                  className={`bg-[#222436] border rounded-lg p-4 transition-colors ${
                    isSelected && batchMode
                      ? "border-[#3b82f6] bg-[#3b82f6]/5"
                      : "border-[#2d3148] hover:border-[#3d4260]"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      {batchMode && (
                        <button
                          onClick={() =>
                            toggleSelect(profile.icao)
                          }
                          className="flex-shrink-0 text-[#6b7280] hover:text-[#3b82f6]"
                        >
                          {isSelected ? (
                            <CheckSquare
                              size={18}
                              className="text-[#3b82f6]"
                            />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-mono font-bold text-[#3b82f6]">
                            {profile.icao}
                          </span>
                          {hasHash && (
                            <ShieldCheck
                              size={14}
                              className="text-green-500"
                            />
                          )}
                        </div>
                        <span className="text-xs text-[#6b7280] block truncate">
                          {profile.scenery_name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleShowUpdates(profile)}
                        className="flex items-center gap-1 px-2 py-1.5 bg-[#222436] border border-[#2d3148] rounded-md text-xs text-[#6b7280] hover:text-[#e1e4f0] hover:bg-[#2d3148] transition-colors mr-1"
                        title="View update history"
                      >
                        <History size={12} />
                      </button>
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
                  </div>
                  <div className="space-y-1 text-xs text-[#9ca3af]">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} /> {profile.developer}
                      <span className="text-[#6b7280]">
                        {" "}
                        · {fileCount} file{fileCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User size={12} /> by {profile.profile_author}
                    </div>
                    {hasSource && profile.source_url && (
                      <div className="flex items-center gap-1.5 text-[#3b82f6] mt-1">
                        <ExternalLink size={12} />
                        <span className="hover:underline cursor-pointer">
                          {profile.source_name}
                        </span>
                        {profile.source_type === "freeware" ? (
                          <span className="text-[#22c55e]">· Freeware</span>
                        ) : profile.source_type === "payware" ? (
                          <span className="text-[#f59e0b]">· Payware</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Update History Popup */}
      {popup && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setPopup(null)}
        >
          <div
            className="bg-[#222436] border border-[#2d3148] rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {popup.icao} — {popup.developer}
              </h3>
              <button
                onClick={() => setPopup(null)}
                className="text-[#6b7280] hover:text-[#e1e4f0] text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-[#9ca3af] mb-2">
                Update History
              </h4>
              <p className="text-xs text-[#6b7280]">
                Recent commits for this profile in the freegs-profiles repository.
              </p>
            </div>

            {popup.loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-[#6b7280]" />
                <span className="ml-2 text-sm text-[#9ca3af]">
                  Loading changelog...
                </span>
              </div>
            ) : popup.changelog.length === 0 ? (
              <div className="text-center py-6 text-[#6b7280]">
                <p className="text-sm">No commit history available.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {popup.changelog.map((entry, _i) => (
                  <div
                    key={entry.hash}
                    className="bg-[#1a1d2e] rounded-lg p-3 border border-[#2d3148]"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#3b82f6] mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#e1e4f0] break-words">
                          {entry.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-[#6b7280]">
                          <span>{entry.author}</span>
                          <span>·</span>
                          <span>{new Date(entry.date).toLocaleDateString()}</span>
                          <span>·</span>
                          <code className="text-[10px]">{entry.hash.slice(0, 7)}</code>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-[#2d3148]">
              <button
                onClick={() => setPopup(null)}
                className="w-full px-4 py-2 bg-[#3b82f6] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}