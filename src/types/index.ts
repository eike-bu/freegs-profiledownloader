export interface SceneryAddon {
  name: string;
  path: string;
  icao: string | null;
}

export interface ProfileEntry {
  icao: string;
  region: string;
  developer: string;
  scenery_name: string;
  profile_author: string;
  source_type: string | null;
  source_url: string | null;
  source_name: string | null;
  /** Map of filename → sha256 hash */
  files: Record<string, string>;
}

export interface DownloadResult {
  icao: string;
  installed_files: string[];
  verified: boolean;
  message: string;
}

export interface InstalledProfile {
  icao: string;
  developer: string;
  ini_path: string;
  py_path: string | null;
}

export interface AppSettings {
  community_folder_path: string | null;
  community_folder_path_2024: string | null;
  profiles_repo_url: string;
  profiles_base_url: string;
  auto_install: boolean;
}

export interface ProfileUpdateInfo {
  icao: string;
  has_update: boolean;
  current_version: string;
  available_version: string;
  changelog: CommitEntry[];
}

export interface CommitEntry {
  author: string;
  date: string;
  message: string;
  hash: string;
}

export type ViewType =
  | "scanner"
  | "profiles"
  | "installed"
  | "settings"
  | "about";