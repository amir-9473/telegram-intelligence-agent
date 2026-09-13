#!/bin/sh
set -eu

docker compose exec -T n8n n8n import:workflow --input=/workflows/bootstrap/00_create_data_tables.json
docker compose exec -T n8n n8n execute --id=tiaBootstrap0001
docker compose exec -T n8n n8n import:workflow --separate --input=/workflows/workflows

echo "Data tables created and runtime workflows imported in unpublished state."
