#!/usr/bin/env bash
# ============================================================
# FoodScroll - Initialize Databases
# Re-runs initialization scripts for all databases
# WARNING: This will DROP and recreate all data
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$DOCKER_DIR/docker-compose.infrastructure.yml"

echo "WARNING: This will reset ALL databases and ALL data will be lost!"
read -p "Are you sure? (y/N): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Stopping all database containers..."
docker compose -f "$COMPOSE_FILE" down

echo ""
echo "Removing persistent volumes..."
docker volume rm feedgo-mysql-data feedgo-postgres-data feedgo-mongodb-data feedgo-neo4j-data feedgo-redis-data 2>/dev/null || true

echo ""
echo "Starting fresh database containers..."
docker compose -f "$COMPOSE_FILE" up -d

echo ""
echo "Waiting for databases to be ready..."
$SCRIPT_DIR/wait-for-db.sh mysql 60
$SCRIPT_DIR/wait-for-db.sh postgres 60
$SCRIPT_DIR/wait-for-db.sh mongodb 60
$SCRIPT_DIR/wait-for-db.sh neo4j 90
$SCRIPT_DIR/wait-for-db.sh redis 30

echo ""
echo "Databases initialized successfully!"
echo "All init scripts have been executed."
