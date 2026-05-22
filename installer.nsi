; FreeGS Profile Downloader v0.2.1-beta — NSIS Installer
; Handles WebView2 runtime detection + installation

!define PRODUCT_NAME "FreeGS Profile Downloader"
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
!include "WinVer.nsh"

; MUI Settings
!define MUI_ABORTWARNING
!define MUI_ICON "src-tauri\icons\icon.ico"

; Language
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "German"

;--------------------------------
; Sections

Section "Install" SEC01
  SetOutPath "$INSTDIR"
  File "freegs-app-v0.2.1-beta-windows-x86_64.exe"
  Rename "$INSTDIR\freegs-app-v0.2.1-beta-windows-x86_64.exe" "$INSTDIR\freegs-app.exe"

  ; Create shortcuts
  CreateDirectory "$SMPROGRAMS\FreeGS"
  CreateShortCut "$SMPROGRAMS\FreeGS\FreeGS Profile Downloader.lnk" "$INSTDIR\freegs-app.exe"
  CreateShortCut "$DESKTOP\FreeGS Profile Downloader.lnk" "$INSTDIR\freegs-app.exe"

  ; Write uninstaller
  WriteUninstaller "$INSTDIR\uninst.exe"

  ; Registry
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\freegs-app.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"

  ; Check and install WebView2 if needed
  DetailPrint "Checking WebView2 Runtime..."
  ReadRegStr $0 HKLM "SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
  StrCmp $0 "" webview2_not_found webview2_found

webview2_not_found:
  DetailPrint "WebView2 Runtime not found. Downloading..."
  NSISdl::download "https://go.microsoft.com/fwlink/p/?LinkId=2124703" "$TEMP\MicrosoftEdgeWebview2Setup.exe"
  Pop $R0
  StrCmp $R0 "success" webview2_download_ok
    DetailPrint "Download failed: $R0"
    MessageBox MB_ICONSTOP "WebView2 Runtime download failed.$\nPlease install manually:$\nhttps://developer.microsoft.com/en-us/microsoft-edge/webview2/"
    Goto webview2_done

webview2_download_ok:
  DetailPrint "Installing WebView2 Runtime..."
  ExecWait '"$TEMP\MicrosoftEdgeWebview2Setup.exe" /silent /install' $1
  DetailPrint "WebView2 installer exit code: $1"
  Delete "$TEMP\MicrosoftEdgeWebview2Setup.exe"
  Goto webview2_done

webview2_found:
  DetailPrint "WebView2 Runtime found (version: $0)."

webview2_done:
SectionEnd

;--------------------------------
; Uninstaller

Section Uninstall
  Delete "$INSTDIR\freegs-app.exe"
  Delete "$INSTDIR\uninst.exe"
  RMDir "$INSTDIR"

  Delete "$SMPROGRAMS\FreeGS\FreeGS Profile Downloader.lnk"
  RMDir "$SMPROGRAMS\FreeGS"
  Delete "$DESKTOP\FreeGS Profile Downloader.lnk"

  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
SectionEnd