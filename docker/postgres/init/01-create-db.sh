#!/bin/bash
# ============================================================
# FoodScroll - PostgreSQL Initialization
# Creates restaurant-service database, user, and PostGIS extension
# ============================================================

set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER feedgo WITH LOGIN PASSWORD '${POSTGRES_PASSWORD}';
    CREATE DATABASE "restaurant-service" OWNER feedgo;
    \c "restaurant-service"
    CREATE EXTENSION IF NOT EXISTS postgis;
    CREATE EXTENSION IF NOT EXISTS postgis_topology;
    GRANT ALL PRIVILEGES ON DATABASE "restaurant-service" TO feedgo;
    GRANT ALL ON SCHEMA public TO feedgo;
EOSQL
