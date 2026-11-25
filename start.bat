@echo off
rem Starts MyCircle at http://localhost:3000 (the address Supabase's sign-in link returns to).
cd /d "%~dp0"
echo.
echo   MyCircle is running at http://localhost:3000
echo   Keep this window open while you use it. Press Ctrl+C to stop.
echo.
start "" cmd /c "timeout /t 2 >nul & start http://localhost:3000"
py -c "import http.server" >nul 2>nul
if %errorlevel%==0 (
  py -m http.server 3000
  goto :eof
)
python -c "import http.server" >nul 2>nul
if %errorlevel%==0 (
  python -m http.server 3000
  goto :eof
)
npx --yes serve -l 3000 .
