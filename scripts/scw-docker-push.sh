#!/usr/bin/env bash
# Build + push image amd64 pour Scaleway Serverless Containers.
# Usage (depuis la racine du repo, avec .env chargé) :
#   set -a && source .env && set +a
#   ./scripts/scw-docker-push.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

IMAGE="${SCW_IMAGE:-rg.fr-par.scw.cloud/scolia/docslapro:latest}"

if [[ -z "${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-}" ]]; then
  echo "Charge d'abord ton .env : set -a && source .env && set +a"
  exit 1
fi

echo ">> Build linux/amd64 → $IMAGE"
docker build --platform=linux/amd64 \
  --build-arg "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}" \
  --build-arg "NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-}" \
  --build-arg "NEXT_PUBLIC_PLATFORM_APP_URL=${NEXT_PUBLIC_PLATFORM_APP_URL:-${PLATFORM_APP_URL:-}}" \
  --build-arg "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=${NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL:-/dashboard}" \
  --build-arg "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=${NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL:-/dashboard}" \
  --build-arg "NEXT_PUBLIC_SCOLA_IMAGE_CDN_HOST=${NEXT_PUBLIC_SCOLA_IMAGE_CDN_HOST:-scolia-images.s3.fr-par.scw.cloud}" \
  --build-arg "PLATFORM_APP_URL=${PLATFORM_APP_URL:-}" \
  --build-arg "PLATFORM_HOSTNAMES=${PLATFORM_HOSTNAMES:-}" \
  --build-arg "PLATFORM_CLERK_PUBLISHABLE_KEY=${PLATFORM_CLERK_PUBLISHABLE_KEY:-}" \
  -t "$IMAGE" \
  .

echo ">> Push $IMAGE"
docker push "$IMAGE"
echo "OK — redéploie le conteneur Scaleway (ou attends le pull si auto)."
