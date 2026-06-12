@echo off
title Voraly Launcher
cd /d "%~dp0"

echo ===============================================
echo    Launching the Voraly dev environment
echo ===============================================
echo.
echo    Services (Windows Terminal tabs):
echo      - n8n          http://localhost:5678
echo      - Next.js web  http://localhost:3000
echo      - Tunnel       https://voraly-dev.loca.lt
echo.

REM --- Start the 3 services as 3 tabs in ONE Windows Terminal window ---
REM (falls back to 3 separate cmd windows if Windows Terminal is missing)
where wt >nul 2>nul && goto USEWT

echo Windows Terminal not found - opening separate windows instead.
start "Voraly - n8n"    cmd /k "npx n8n start"
start "Voraly - web"    cmd /k "cd /d %~dp0voraly-web && npm run dev"
start "Voraly - tunnel" cmd /k "timeout /t 12 && npx localtunnel --port 3000 --subdomain voraly-dev"
goto BROWSER

:USEWT
wt new-tab --title "Voraly - n8n" cmd /k "npx n8n start" ; new-tab --title "Voraly - web" cmd /k "cd /d %~dp0voraly-web && npm run dev" ; new-tab --title "Voraly - tunnel" cmd /k "timeout /t 12 && npx localtunnel --port 3000 --subdomain voraly-dev"

:BROWSER
echo.
echo Waiting ~15s for the servers to boot before opening the browser...
timeout /t 15 /nobreak >nul

echo Opening browser tabs (Chrome)...
start "" chrome "http://localhost:3000" "http://localhost:5678" "https://supabase.com/dashboard/project/xgrwlfoaqmsdcafqfvaf" "https://github.com/MahdiHellali/voraly" "https://whop.com/dashboard/biz_O6gyFNtpLYE72L/"

echo.
echo All set. You can close this window.
timeout /t 6
