#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.cloudflare}"
WRANGLER_SECRET_COMMAND="${WRANGLER_SECRET_COMMAND:-wrangler versions secret put}"
read -r -a secret_command <<< "$WRANGLER_SECRET_COMMAND"

if [ ! -f "$ENV_FILE" ]; then
  echo "Env file not found: $ENV_FILE"
  echo "Create it from your Vercel environment variables, then run:"
  echo "  scripts/cloudflare-set-secrets.sh $ENV_FILE"
  exit 1
fi

while IFS= read -r line || [ -n "$line" ]; do
  line="${line#"${line%%[![:space:]]*}"}"
  line="${line%"${line##*[![:space:]]}"}"

  if [ -z "$line" ] || [[ "$line" == \#* ]]; then
    continue
  fi

  line="${line#export }"

  if [[ "$line" != *=* ]]; then
    continue
  fi

  key="${line%%=*}"
  value="${line#*=}"
  value="${value%$'\r'}"

  if [[ "$value" == \"*\" && "$value" == *\" ]]; then
    value="${value:1:${#value}-2}"
  elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
    value="${value:1:${#value}-2}"
  fi

  if [ -z "$key" ]; then
    continue
  fi

  echo "Setting Cloudflare secret: $key"
  printf '%s' "$value" | "${secret_command[@]}" "$key"
done < "$ENV_FILE"
