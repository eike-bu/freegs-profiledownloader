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
  download_url: string;
}

export interface InstalledProfile {
  icao: string;
  developer: string;
  ini_path: string;
  py_path: string | null;
}

export interface AppSettings {
  community_folder_path: string | null;
  profiles_repo_url: string;
  auto_install: boolean;
}

export type ViewType =
  | "scanner"
  | "profiles"
  | "installed"
  | "settings"
  | "about";