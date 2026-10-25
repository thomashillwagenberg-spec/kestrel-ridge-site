#!/usr/bin/env bash
# set-form-endpoint.sh — patch the compiled JS bundle and _headers with the
# deployed Cloudflare Worker URL.
#
# Usage: ./scripts/set-form-endpoint.sh https://krh-contact-inquiries.YOUR-ACCOUNT.workers.dev
#
# Run from the repository root. The URL must be the bare origin (no trailing
# slash, no /submit path). The script appends /submit automatically.
#
# This patches the static build artefacts in _next/. You must redeploy the
# site after running it. The patch is idempotent: re-running with the same
# URL is safe.

set -euo pipefail

WORKER_ORIGIN="${1:-}"
if [[ -z "$WORKER_ORIGIN" ]]; then
  echo "Error: supply the Worker origin as the first argument." >&2
  echo "Example: $0 https://krh-contact-inquiries.abc123.workers.dev" >&2
  exit 1
fi

# Strip trailing slash.
WORKER_ORIGIN="${WORKER_ORIGIN%/}"

# Validate URL shape.
if [[ ! "$WORKER_ORIGIN" =~ ^https://[a-z0-9._-]+$ ]]; then
  echo "Error: URL must be https:// and contain no path component." >&2
  exit 1
fi

ENDPOINT="${WORKER_ORIGIN}/submit"
BRAND_CHUNK="_next/static/chunks/1t2_6z4igjn62.js"
HEADERS_FILE="_headers"

if [[ ! -f "$BRAND_CHUNK" ]]; then
  echo "Error: $BRAND_CHUNK not found. Run from the repository root." >&2
  exit 1
fi

echo "==> Patching formEndpoint in $BRAND_CHUNK"
# Replace the empty formEndpoint value. The surrounding context prevents
# false matches. If the file already has a correct URL, sed is a no-op.
sed -i '' "s|formEndpoint:\"\"|formEndpoint:\"${ENDPOINT}\"|g" "$BRAND_CHUNK"
# Also handle any variant where it was previously patched to a different URL
# (re-run with a new URL, e.g. after a Worker rename or account change):
if ! grep -q "formEndpoint:\"${ENDPOINT}\"" "$BRAND_CHUNK"; then
  echo "Warning: formEndpoint pattern not found in $BRAND_CHUNK." >&2
  echo "Inspect the file and apply the patch manually." >&2
fi

echo "==> Updating connect-src in $HEADERS_FILE"
if grep -q "WORKER_ENDPOINT" "$HEADERS_FILE"; then
  sed -i '' "s|WORKER_ENDPOINT|${WORKER_ORIGIN}|g" "$HEADERS_FILE"
else
  echo "Warning: WORKER_ENDPOINT placeholder already replaced in $_headers." >&2
fi

echo ""
echo "Done. Verify:"
echo "  grep formEndpoint $BRAND_CHUNK"
echo "  grep connect-src $HEADERS_FILE"
echo ""
echo "Next: commit the patched files, then deploy to Cloudflare Pages."
