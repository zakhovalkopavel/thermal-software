#!/bin/sh
# Official nginx image runs scripts in /docker-entrypoint.d/ before start.
# Pick HTTP-only vs HTTPS based on mounted certs so the container does not crash
# before `make install-ssl-certs` on a fresh server.
set -e

CONF_DIR=/etc/nginx/conf.d
TEMPLATE_DIR=/etc/nginx/templates
TARGET="${CONF_DIR}/default.conf"

mkdir -p /var/www/certbot

if [ -f /etc/nginx/ssl/cert.pem ] && [ -f /etc/nginx/ssl/key.pem ]; then
  echo "nginx: TLS certs found — enabling HTTPS (HTTP→HTTPS redirect)"
  cp "${TEMPLATE_DIR}/default.https.conf" "${TARGET}"
else
  echo "nginx: WARNING — no /etc/nginx/ssl/cert.pem — HTTP only on :80"
  echo "nginx:         run: make install-ssl-certs DOMAIN=thermosolver.net EMAIL=... STOP_NGINX=1 RELOAD=1"
  cp "${TEMPLATE_DIR}/default.http.conf" "${TARGET}"
fi
