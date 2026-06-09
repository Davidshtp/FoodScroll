#!/usr/bin/env bash
# ============================================================
# FoodScroll - Start Infrastructure (Databases only)
# Starts MySQL, PostgreSQL, MongoDB, Neo4j, Redis
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_INFRA="$DOCKER_DIR/docker-compose.infrastructure.yml"

# Cargar variables de entorno del .env
if [ -f "$DOCKER_DIR/.env" ]; then
    set -a
    source "$DOCKER_DIR/.env"
    set +a
    echo "Loaded environment from .env"
fi

echo "Starting FoodScroll infrastructure (databases)..."
docker compose -f "$COMPOSE_INFRA" up -d

echo ""
echo "Waiting for databases to become healthy..."

declare -A CHECKS=(
    ["MySQL"]="docker compose -f $COMPOSE_INFRA exec -T mysql mysqladmin ping -h localhost --silent"
    ["PostgreSQL"]="docker compose -f $COMPOSE_INFRA exec -T postgres pg_isready --quiet"
    ["MongoDB"]="docker compose -f $COMPOSE_INFRA exec -T mongodb mongosh --quiet --eval 'db.adminCommand(\"ping\")'"
    ["Neo4j"]="docker compose -f $COMPOSE_INFRA exec -T neo4j cypher-shell -u neo4j -p \"${NEO4J_PASSWORD}\" \"RETURN 1\""
    ["Redis"]="docker compose -f $COMPOSE_INFRA exec -T redis redis-cli ping"
)

for DB in "${!CHECKS[@]}"; do
    echo -n "  $DB..."
    CMD="${CHECKS[$DB]}"
    for i in $(seq 1 30); do
        if eval "$CMD" > /dev/null 2>&1; then
            echo " OK"
            break
        fi
        echo -n "."
        sleep 2
    done
done

echo ""
echo "Infrastructure is ready!"
echo ""
echo "Databases:"
echo "  MySQL(3306)     -> identity, customer, location, delivery, orders"
echo "  PostgreSQL(5432)-> restaurant"
echo "  MongoDB(27017)  -> publications, engagement"
echo "  Neo4j(7687)     -> social-graph"
echo "  Redis(6379)     -> cache"