#!/usr/bin/env bash
# ============================================================
# FoodScroll - Start Application (Microservices + Nginx)
# Requires infrastructure to be running first
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_APP="$DOCKER_DIR/docker-compose.application.yml"

echo "Starting FoodScroll application stack..."
echo ""

if ! docker compose -f "$COMPOSE_APP" ps --services --filter "status=running" 2>/dev/null | grep -q .; then
    echo "Starting all services..."
    docker compose -f "$COMPOSE_APP" up -d
else
    echo "Some services are already running. Recreating..."
    docker compose -f "$COMPOSE_APP" up -d --remove-orphans
fi

echo ""
echo -n "Waiting for Gateway..."
for i in $(seq 1 30); do
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        echo " OK"
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

echo "Application stack is running!"
echo ""
echo "Access URLs:"
echo "  HTTPS (via Nginx): https://localhost"
echo "  HTTP  (via Gateway): http://localhost:3000/api"
echo "  Health:            https://localhost/health"
echo ""
echo "Logs:   docker compose -f $COMPOSE_APP logs -f"
echo "Stop:   docker compose -f $COMPOSE_APP down"
