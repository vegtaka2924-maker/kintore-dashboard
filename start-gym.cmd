@echo off
rem 筋トレ ダッシュボードを1クリック起動（サーバ→ブラウザ）。
cd /d "%~dp0"
start "gym-server" cmd /c node server.cjs
timeout /t 1 >nul
start "" http://localhost:8765/dashboard.html
