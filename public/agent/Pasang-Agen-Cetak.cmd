@echo off
rem Launcher: jalankan install-agent.ps1 tanpa terhalang Execution Policy.
rem Taruh file ini di folder yang sama dengan install-agent.ps1 dan kti-print-agent.ps1, lalu klik dua kali.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path '%~dp0' -Filter *.ps1 | Unblock-File -ErrorAction SilentlyContinue"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-agent.ps1"
