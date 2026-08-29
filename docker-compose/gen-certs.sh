#!/bin/bash

set -e

CERT_DIR="./certs"
PFX_PASSWORD="YourPassword"

echo "⚠️ For use in development only - do NOT use in production scenarios!"

echo "📂 Creating certificate directory: $CERT_DIR"
mkdir -p "$CERT_DIR"

echo "🔒 Generating ASP.NET development certificate (aspnetapp.pfx)"
dotnet dev-certs https -ep "$CERT_DIR/aspnetapp.pfx" -p "$PFX_PASSWORD"

echo "🔐 Generating Nginx self-signed certificate (tl-cert.pem and tl-key.pem)"
openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout "$CERT_DIR/tl-key.pem" \
  -out "$CERT_DIR/tl-cert.pem" \
  -subj "/CN=localhost"

echo "🎫 Generating OpenIddict token certificates (signing and encryption)"
# These sign and encrypt access tokens. Unlike the ephemeral keys they replace, they must
# survive restarts - otherwise every deploy signs all users out. Keep them out of git.
for use in signing encryption; do
  openssl req -x509 -nodes -days 730 \
    -newkey rsa:2048 \
    -keyout "$CERT_DIR/oidc-$use.key" \
    -out "$CERT_DIR/oidc-$use.crt" \
    -subj "/CN=MiniPlat $use"

  openssl pkcs12 -export \
    -inkey "$CERT_DIR/oidc-$use.key" \
    -in "$CERT_DIR/oidc-$use.crt" \
    -out "$CERT_DIR/oidc-$use.pfx" \
    -passout "pass:$PFX_PASSWORD"

  rm -f "$CERT_DIR/oidc-$use.key" "$CERT_DIR/oidc-$use.crt"
done

echo "✅ Certificates generated in $CERT_DIR"