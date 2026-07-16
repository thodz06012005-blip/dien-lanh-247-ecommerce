#!/usr/bin/env sh
set -eu

USER_DOMAIN="${USER_DOMAIN:-dienlanh247.local}"
ADMIN_DOMAIN="${ADMIN_DOMAIN:-admin.dienlanh247.local}"
CERT_DIR="${CERT_DIR:-deploy/certs}"

mkdir -p "$CERT_DIR"
chmod 700 "$CERT_DIR"

openssl req -x509 -nodes -newkey rsa:3072 -sha256 -days 30 \
  -keyout "$CERT_DIR/privkey.pem" \
  -out "$CERT_DIR/fullchain.pem" \
  -subj "/CN=$USER_DOMAIN" \
  -addext "subjectAltName=DNS:$USER_DOMAIN,DNS:$ADMIN_DOMAIN,DNS:localhost,IP:127.0.0.1"

chmod 600 "$CERT_DIR/privkey.pem"
chmod 644 "$CERT_DIR/fullchain.pem"
printf 'Local certificate generated for %s and %s\n' "$USER_DOMAIN" "$ADMIN_DOMAIN"
printf 'Production must use a CA-issued certificate such as Let\x27s Encrypt.\n'
