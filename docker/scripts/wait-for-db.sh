#!/usr/bin/env bash
# ============================================================
# FoodScroll - Wait for Database
# Generic health check script for database containers
# Usage: ./wait-for-db.sh <service-name> [timeout]
# ============================================================
set -euo pipefail

SERVICE="${1:?Usage: $0 <service-name> [timeout]}"
TIMEOUT="${2:-60}"
COUNTER=0

case "$SERVICE" in
    mysql)
        CMD="mysqladmin ping -h localhost --silent"
        ;;
    postgres)
        CMD="pg_isready -U postgres --quiet"
        ;;
    mongodb)
        CMD="mongosh --quiet --eval 'db.adminCommand(\"ping\")'"
        ;;
    neo4j)
        CMD="cypher-shell -u neo4j -p \"${NEO4J_PASSWORD:-feedgo123}\" \"RETURN 1\""
        ;;
    redis)
        CMD="redis-cli ping"
        ;;
    *)
        echo "Unknown service: $SERVICE"
        echo "Supported: mysql, postgres, mongodb, neo4j, redis"
        exit 1
        ;;
esac

echo -n "Waiting for $SERVICE..."
while [ $COUNTER -lt $TIMEOUT ]; do
    if eval "docker compose exec -T $SERVICE $CMD" 2>/dev/null; then
        echo " OK (${COUNTER}s)"
        exit 0
    fi
    echo -n "."
    sleep 2
    COUNTER=$((COUNTER + 2))
done

echo " TIMEOUT after ${TIMEOUT}s"
exit 1
