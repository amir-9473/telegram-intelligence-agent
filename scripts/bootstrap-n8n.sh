#!/bin/sh
set -eu

if [ -z "${N8N_API_KEY:-}" ]; then
  echo "Set N8N_API_KEY to an owner API key before running this script." >&2
  exit 1
fi

if [ -z "${N8N_BASE_URL:-}" ] && [ -f .env ]; then
  N8N_BASE_URL=$(sed -n 's/^N8N_EDITOR_BASE_URL=//p' .env | tail -n 1)
fi

if [ -z "${N8N_BASE_URL:-}" ]; then
  echo "Set N8N_BASE_URL or N8N_EDITOR_BASE_URL in .env." >&2
  exit 1
fi

N8N_BASE_URL=${N8N_BASE_URL%/}

create_table_if_missing() {
  table_name=$1
  columns=$2
  encoded_filter="%7B%22name%22%3A%22${table_name}%22%7D"
  existing=$(curl -fsS \
    -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
    "${N8N_BASE_URL}/api/v1/data-tables?limit=1&filter=${encoded_filter}")

  if printf '%s' "$existing" | grep -Eq "\"name\"[[:space:]]*:[[:space:]]*\"${table_name}\""; then
    echo "Data table already exists: ${table_name}"
    return
  fi

  curl -fsS \
    -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${table_name}\",\"columns\":${columns}}" \
    "${N8N_BASE_URL}/api/v1/data-tables" >/dev/null
  echo "Created data table: ${table_name}"
}

create_table_if_missing subscriptions '[{"name":"user_id","type":"string"},{"name":"chat_id","type":"string"},{"name":"channel_username","type":"string"},{"name":"status","type":"string"},{"name":"added_at","type":"date"},{"name":"last_checked_message_id","type":"number"}]'
create_table_if_missing messages '[{"name":"channel_username","type":"string"},{"name":"message_id","type":"number"},{"name":"message_url","type":"string"},{"name":"text","type":"string"},{"name":"published_at","type":"date"},{"name":"views","type":"number"},{"name":"collected_at","type":"date"},{"name":"topic","type":"string"},{"name":"importance_score","type":"number"},{"name":"summary","type":"string"}]'
create_table_if_missing alerts '[{"name":"alert_id","type":"string"},{"name":"chat_id","type":"string"},{"name":"channel_username","type":"string"},{"name":"keyword","type":"string"},{"name":"status","type":"string"},{"name":"created_at","type":"date"}]'
create_table_if_missing alert_deliveries '[{"name":"delivery_key","type":"string"},{"name":"alert_id","type":"string"},{"name":"chat_id","type":"string"},{"name":"channel_username","type":"string"},{"name":"message_id","type":"number"},{"name":"keyword","type":"string"},{"name":"message_url","type":"string"},{"name":"summary","type":"string"},{"name":"status","type":"string"},{"name":"created_at","type":"date"}]'

docker compose exec -T n8n n8n import:workflow --separate --input=/workflows/workflows

echo "Data tables created and runtime workflows imported in unpublished state."
