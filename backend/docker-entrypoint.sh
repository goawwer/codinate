#!/bin/sh
set -e

DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=disable"

echo "Running database migrations..."
migrate -path /app/migrations -database "$DB_URL" up

echo "Starting backend..."
exec ./codinate-backend serve