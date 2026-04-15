@echo off
setlocal

set PORT=%1
if "%PORT%"=="" set PORT=5001

echo [1/3] Cleaning old listeners on port %PORT%...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do (
  echo   - stopping PID %%P
  taskkill /PID %%P /F >nul 2>&1
)

echo [2/3] Starting API on port %PORT%...
set SERVER_PORT=%PORT%
start "runt-api-%PORT%" cmd /k "cd /d %~dp0 && set SERVER_PORT=%PORT% && python main.py"

echo Waiting for API startup...
timeout /t 8 >nul

echo [3/3] Starting live captcha labeling loop...
python src\scripts\live_captcha_label_loop.py --base-url http://localhost:%PORT% --open-image

endlocal
