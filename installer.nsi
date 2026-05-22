; FreeGS Profile Downloader v0.2.1-beta — NSIS Installer
; Ships WebView2Loader.dll alongside the app for zero-dependency startup

!define PRODUCT_NAME "FreeGS - Profile Downloader"
!define PRODUCT_VERSION "0.2.1-beta"
!define PRODUCT_PUBLISHER "FreeGS Project"
!define PRODUCT_WEB_SITE "http://10.8.0.1/freegs/freegs-app"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\freegs-app.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"

SetCompressor lzma
RequestExecutionLevel admin

; Modern UI
!include "MUI2.nsh"
!include "LogicLib.nsh"

; MUI Settings
!define MUI_ABORTWARNING
!define MUI_ICON "src-tauri\icons\icon.ico"

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; Languages
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "German"

;--------------------------------
; Sections

Section "Install" SEC01
  SetOutPath "$INSTDIR"

  ; App binary
  File "freegs-app-v0.2.1-beta-windows-x86_64.exe"
  Rename "$INSTDIR\freegs-app-v0.2.1-beta-windows-x86_64.exe" "$INSTDIR\freegs-app.exe"

  ; WebView2 loader DLL — shipped alongside the app
  ; Prevents "WebView2Loader.dll not found" even if Evergreen Runtime is missing
  File "WebView2Loader.dll"

  ; Shortcuts
  CreateDirectory "$SMPROGRAMS\FreeGS"
  CreateShortCut "$SMPROGRAMS\FreeGS\FreeGS - Profile Downloader.lnk" "$INSTDIR\freegs-app.exe"
  CreateShortCut "$DESKTOP\FreeGS - Profile Downloader.lnk" "$INSTDIR\freegs-app.exe"

  ; Uninstaller
  WriteUninstaller "$INSTDIR\uninst.exe"

  ; Registry
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\freegs-app.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"

  ; Ensure WebView2 Evergreen Runtime is available (fallback)
  DetailPrint "Checking WebView2 Runtime..."
  ReadRegStr $0 HKLM "SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
  StrCmp $0 "" webview2_maybe_missing webview2_found

webview2_maybe_missing:
  DetailPrint "WebView2 Runtime not found in registry. Checking 64-bit..."
  ReadRegStr $0 HKLM "SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
  StrCmp $0 "" webview2_install webview2_found

webview2_install:
  DetailPrint "WebView2 Runtime not found. Downloading..."
  NSISdl::download "https://go.microsoft.com/fwlink/p/?LinkId=2124703" "$TEMP\MicrosoftEdgeWebview2Setup.exe"
  Pop $R0
  StrCmp $R0 "success" webview2_download_ok
    DetailPrint "Download failed: $R0"
    DetailPrint "App will use the bundled WebView2Loader.dll instead."
    Goto webview2_done

webview2_download_ok:
  DetailPrint "Installing WebView2 Runtime..."
  ExecWait '"$TEMP\MicrosoftEdgeWebview2Setup.exe" /silent /install' $1
  DetailPrint "WebView2 installer exit code: $1"
  Delete "$TEMP\MicrosoftEdgeWebview2Setup.exe"

webview2_found:
  DetailPrint "WebView2 Runtime found (version: $0)."

webview2_done:
SectionEnd

;--------------------------------
; Uninstaller

Section Uninstall
  Delete "$INSTDIR\freegs-app.exe"
  Delete "$INSTDIR\WebView2Loader.dll"
  Delete "$INSTDIR\uninst.exe"
  RMDir "$INSTDIR"

  Delete "$SMPROGRAMS\FreeGS\FreeGS - Profile Downloader.lnk"
  RMDir "$SMPROGRAMS\FreeGS"
  Delete "$DESKTOP\FreeGS - Profile Downloader.lnk"

  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
SectionEnd