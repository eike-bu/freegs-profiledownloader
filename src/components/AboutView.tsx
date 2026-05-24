import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Package, Github, Globe, Heart } from "lucide-react";
import { APP_VERSION, APP_NAME, APP_DISPLAY, REPO_URL, PROFILES_REPO_URL, LICENSE_TEXT } from "../constants";

export function AboutView() {
  const [info, setInfo] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    invoke<Record<string, any>>("get_server_info")
      .then(setInfo)
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3b82f6]/10 rounded-2xl mb-4">
          <Package size={32} className="text-[#3b82f6]" />
        </div>
        <h2 className="text-xl font-bold mb-1">{APP_DISPLAY}</h2>
        <p className="text-sm text-[#9ca3af]">
          Version {info ? info.version : APP_VERSION}
        </p>
      </div>

      <div className="bg-[#222436] border border-[#2d3148] rounded-lg p-6 space-y-4">
        <p className="text-sm text-[#9ca3af] leading-relaxed">
          {APP_NAME} automatically detects your installed MSFS scenery addons
          and matches them with community-contributed GSX profiles from a central repository.
        </p>

        <div className="border-t border-[#2d3148] pt-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Heart size={14} className="text-[#ef4444]" /> FreeGS Project
          </h3>
          <p className="text-xs text-[#6b7280] leading-relaxed">
            FreeGS is an open-source ecosystem of tools for Microsoft Flight Simulator
            ground services. This profile downloader is the first component of the FreeGS suite.
          </p>
        </div>

        <div className="border-t border-[#2d3148] pt-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Github size={14} /> Repository
          </h3>
          <p className="text-xs text-[#6b7280]">
            App repository:{" "}
            <a href={REPO_URL} className="text-[#3b82f6] hover:underline">
              {REPO_URL}
            </a>
          </p>
          <p className="text-xs text-[#6b7280] mt-1">
            Profiles repository:{" "}
            <a href={PROFILES_REPO_URL} className="text-[#3b82f6] hover:underline">
              {PROFILES_REPO_URL}
            </a>
          </p>
        </div>

        <div className="border-t border-[#2d3148] pt-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Globe size={14} /> License
          </h3>
          <p className="text-xs text-[#6b7280]">{LICENSE_TEXT}</p>
        </div>
      </div>

      <div className="bg-[#222436] border border-[#2d3148] rounded-lg p-6">
        <h3 className="text-sm font-semibold mb-3">Credits</h3>
        <div className="space-y-3 text-xs text-[#9ca3af]">
          <p>Credits to the GSX profile creators. Not affiliated with FSDreamTeam.</p>
        </div>
      </div>
    </div>
  );
}