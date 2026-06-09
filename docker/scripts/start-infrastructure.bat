@echo off
title FoodScroll Infrastructure Starter
setlocal enabledelayedexpansion

:: ============================================================
:: FoodScroll - Start Infrastructure (Windows)
:: Starts MySQL, PostgreSQL, MongoDB, Neo4j, Redis
:: ============================================================

set "SCRIPT_DIR=%~dp0"
set "DOCKER_DIR=%SCRIPT_DIR%.."
set "COMPOSE_FILE=%DOCKER_DIR%\docker-compose.infrastructure.yml"

:: ───── Cargar variables desde .env ─────
if exist "%DOCKER_DIR%\.env" (
    for /f "tokens=1,* delims==" %%a in ('type "%DOCKER_DIR%\.env" ^| findstr /v "^#" ^| findstr /v "^$"') do (
        set "%%a=%%b"
    )
    echo Loaded environment from .env
)
:: ──────────────────────────────────────

echo Starting FoodScroll infrastructure (databases)...
docker compose -f "%COMPOSE_FILE%" up -d

echo.
echo Waiting for databases to become healthy...

:: MySQL
set /p "=  MySQL..." <nul
:wait_mysql
docker compose -f "%COMPOSE_FILE%" exec -T mysql mysqladmin ping -h localhost --silent >nul 2>&1
if errorlevel 1 (
    set /p "=." <nul
    timeout /t 2 /nobreak >nul
    goto wait_mysql
)
echo  OK

:: PostgreSQL
set /p "=  PostgreSQL..." <nul
:wait_postgres
docker compose -f "%COMPOSE_FILE%" exec -T postgres pg_isready -U postgres --quiet >nul 2>&1
if errorlevel 1 (
    set /p "=." <nul
    timeout /t 2 /nobreak >nul
    goto wait_postgres
)
echo  OK

:: MongoDB
set /p "=  MongoDB..." <nul
:wait_mongo
docker compose -f "%COMPOSE_FILE%" exec -T mongodb mongosh --quiet --eval "db.adminCommand('ping')" >nul 2>&1
if errorlevel 1 (
    set /p "=." <nul
    timeout /t 2 /nobreak >nul
    goto wait_mongo
)
echo  OK

:: Neo4j
set /p "=  Neo4j..." <nul
:wait_neo4j
docker compose -f "%COMPOSE_FILE%" exec -T neo4j cypher-shell -u neo4j -p "%NEO4J_PASSWORD%" "RETURN 1" >nul 2>&1
if errorlevel 1 (
    set /p "=." <nul
    timeout /t 3 /nobreak >nul
    goto wait_neo4j
)
echo  OK

:: Redis
set /p "=  Redis..." <nul
:wait_redis
docker compose -f "%COMPOSE_FILE%" exec -T redis redis-cli ping 2>nul | findstr "PONG" >nul
if errorlevel 1 (
    set /p "=." <nul
    timeout /t 1 /nobreak >nul
    goto wait_redis
)
echo  OK

echo.
echo Infrastructure is ready!
echo.
echo Databases:
echo   MySQL(3306)     -^> identity, customer, location, delivery, orders
echo   PostgreSQL(5432)-^> restaurant
echo   MongoDB(27017)  -^> publications, engagement
echo   Neo4j(7687)     -^> social-graph
echo   Redis(6379)     -^> cache
echo.
pause
