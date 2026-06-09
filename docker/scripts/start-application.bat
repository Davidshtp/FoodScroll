@echo off
title FoodScroll Application Starter
setlocal enabledelayedexpansion

:: ============================================================
:: FoodScroll - Start Application (Windows)
:: Starts all microservices + API Gateway + Nginx
:: ============================================================

set "SCRIPT_DIR=%~dp0"
set "DOCKER_DIR=%SCRIPT_DIR%.."
set "COMPOSE_APP=%DOCKER_DIR%\docker-compose.application.yml"

echo Starting FoodScroll application stack...
echo.

docker compose -f "%COMPOSE_APP%" ps --services --filter "status=running" >nul 2>&1
if errorlevel 1 (
    echo Starting all services...
    docker compose -f "%COMPOSE_APP%" up -d
) else (
    echo Some services already running. Recreating...
    docker compose -f "%COMPOSE_APP%" up -d --remove-orphans
)

echo.
set /p "=Waiting for Gateway..." <nul
for /l %%i in (1,1,30) do (
    curl -sf http://localhost:3000/health >nul 2>&1
    if not errorlevel 1 (
        echo  OK
        goto :done
    )
    set /p "=." <nul
    timeout /t 2 /nobreak >nul
)
:done

echo.
echo Application stack is running!
echo.
echo Access URLs:
echo   HTTPS (via Nginx): https://localhost
echo   HTTP  (via Gateway): http://localhost:3000/api
echo   Health:            https://localhost/health
echo.
echo Logs:   docker compose -f "%COMPOSE_APP%" logs -f
echo Stop:   docker compose -f "%COMPOSE_APP%" down
echo.
pause
