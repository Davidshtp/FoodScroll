#!/usr/bin/env bash
# ============================================================
# FoodScroll - Generate SSL Certificates for Development
# Uses mkcert for local trusted CA and certificates
# Requires: mkcert (https://github.com/FiloSottile/mkcert)
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERTS_DIR="$(dirname "$SCRIPT_DIR")/nginx/certs/dev"

mkdir -p "$CERTS_DIR"

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "mkcert is not installed."
    echo ""
    echo "Install it first:"
    echo "  macOS:  brew install mkcert"
    echo "  Linux:  sudo apt install mkcert  (or visit https://github.com/FiloSottile/mkcert)"
    echo "  Windows: choco install mkcert"
    echo ""
    echo "Alternative: Use certbot/certbot for Let's Encrypt certs"
    exit 1
fi

# Install local CA (one-time)
echo "Installing mkcert root CA (may require sudo)..."
mkcert -install

# Generate certs for local development
echo "Generating certificates..."
mkcert \
    -cert-file "$CERTS_DIR/localhost.pem" \
    -key-file "$CERTS_DIR/localhost-key.pem" \
    localhost 127.0.0.1 ::1 host.docker.internal \
    *.localhost

echo ""
echo "Certificates generated successfully!"
echo "  Cert: $CERTS_DIR/localhost.pem"
echo "  Key:  $CERTS_DIR/localhost-key.pem"
echo ""
echo "Trusted by the local CA. Access via:"
echo "  - https://localhost"
echo "  - https://127.0.0.1"
echo "  - https://host.docker.internal"
echo "  - https://*.localhost"
