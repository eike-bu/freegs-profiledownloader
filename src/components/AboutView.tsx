import { Package, Github, Globe, Heart } from "lucide-react";

export function AboutView() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3b82f6]/10 rounded-2xl mb-4">
          <Package size={32} className="text-[#3b82f6]" />
        </div>
        <h2 className="text-xl font-bold mb-1">FreeGS Profile Downloader</h2>
        <p className="text-sm text-[#9ca3af]">Version 0.1.0</p>
      </div>

      <div className="bg-[#222436] border border-[#2d3148] rounded-lg p-6 space-y-4">
        <p className="text-sm text-[#9ca3af] leading-relaxed">
          FreeGS Profile Downloader automatically detects your installed MSFS
          scenery addons and matches them with community-contributed GSX
          profiles from a central repository. Download and install profiles
          with a single click.
        </p>

        <div className="border-t border-[#2d3148] pt-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Heart size={14} className="text-[#ef4444]" />
            FreeGS Project
          </h3>
          <p className="text-xs text-[#6b7280] leading-relaxed">
            FreeGS is an open-source ecosystem of tools for Microsoft Flight
            Simulator ground services. This profile downloader is the first
            component of the FreeGS suite.
          </p>
        </div>

        <div className="border-t border-[#2d3148] pt-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Github size={14} />
            Repository
          </h3>
          <p className="text-xs text-[#6b7280]">
            <a
              href="https://github.com/freegs/freegs-app"
              className="text-[#3b82f6] hover:underline"
            >
              github.com/freegs/freegs-app
            </a>
          </p>
          <p className="text-xs text-[#6b7280] mt-1">
            Profiles repository:
            <br />
            <a
              href="https://github.com/freegs/freegs-profiles"
              className="text-[#3b82f6] hover:underline"
            >
              github.com/freegs/freegs-profiles
            </a>
          </p>
        </div>

        <div className="border-t border-[#2d3148] pt-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Globe size={14} />
            License
          </h3>
          <p className="text-xs text-[#6b7280]">
            Open source. Free for personal and commercial use.
            See LICENSE file for details.
          </p>
        </div>
      </div>

      {/* Credits section */}
      <div className="bg-[#222436] border border-[#2d3148] rounded-lg p-6">
        <h3 className="text-sm font-semibold mb-3">Credits</h3>
        <div className="space-y-3 text-xs text-[#9ca3af]">
          <p>
            This tool would not be possible without the amazing GSX profile
            creators in the community who contribute their work to the FreeGS
            profile repository.
          </p>
          <p>
            Each profile in the repository includes attribution to its author
            and the scenery developer. Profile authors retain credit for their
            work.
          </p>
          <p className="text-[#6b7280]">
            GSX (Ground Service X) is a product of FSDreamTeam. FreeGS is an
            independent community project and is not affiliated with
            FSDreamTeam.
          </p>
        </div>
      </div>
    </div>
  );
}