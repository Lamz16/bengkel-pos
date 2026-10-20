@echo off
powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File "%~dp0tools\BengkelProLauncher.ps1"
if errorlevel 1 (
  echo.
  echo Launcher gagal dibuka. Salin pesan error di atas untuk diperiksa.
  pause
)
