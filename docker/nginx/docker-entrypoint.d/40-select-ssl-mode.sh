#!/bin/sh
# Official nginx image runs scripts in /docker-entrypoint.d/ before start.
# Enable HTTPS when certs exist; otherwise HTTP-only so the container still starts.
set -e

CONF_DIR=/etc/nginx/conf.d
TEMPLATE_DIR=/etc/nginx/templates
TARGET="${CONF_DIR}/default.conf"
HTTPS_TEMPLATE="${TEMPLATE_DIR}/default.https.conf"
HTTP_TEMPLATE="${TEMPLATE_DIR}/default.http.conf"

mkdir -p /var/www/certbot

CERT=""
KEY=""

if [ -f /etc/nginx/ssl/cert.pem ] && [ -f /etc/nginx/ssl/key.pem ]; then
  CERT=/etc/nginx/ssl/cert.pem
  KEY=/etc/nginx/ssl/key.pem
  echo "nginx: using /etc/nginx/ssl/cert.pem + key.pem"
elif [ -d /etc/nginx/ssl/letsencrypt/live ]; then
  # Prefer APP_DOMAIN / explicit domain; else first lineage that has both files.
  for candidate in ${SSL_DOMAIN:-} thermosolver.net; do
    if [ -n "$candidate" ] \
      && [ -e "/etc/nginx/ssl/letsencrypt/live/${candidate}/fullchain.pem" ] \
      && [ -e "/etc/nginx/ssl/letsencrypt/live/${candidate}/privkey.pem" ]; then
      CERT="/etc/nginx/ssl/letsencrypt/live/${candidate}/fullchain.pem"
      KEY="/etc/nginx/ssl/letsencrypt/live/${candidate}/privkey.pem"
      echo "nginx: using Let's Encrypt live/${candidate}"
      break
    fi
  done
  if [ -z "$CERT" ]; then
    for d in /etc/nginx/ssl/letsencrypt/live/*; do
      [ -d "$d" ] || continue
      name=$(basename "$d")
      [ "$name" = "README" ] && continue
      if [ -e "$d/fullchain.pem" ] && [ -e "$d/privkey.pem" ]; then
        CERT="$d/fullchain.pem"
        KEY="$d/privkey.pem"
        echo "nginx: using Let's Encrypt live/${name}"
        break
      fi
    done
  fi
fi

if [ -n "$CERT" ] && [ -n "$KEY" ]; then
  echo "nginx: TLS enabled — HTTP→HTTPS redirect on :80, app on :443"
  # Substitute cert paths into the HTTPS template (defaults are cert.pem/key.pem).
  sed \
    -e "s|ssl_certificate     /etc/nginx/ssl/cert.pem;|ssl_certificate     ${CERT};|" \
    -e "s|ssl_certificate_key /etc/nginx/ssl/key.pem;|ssl_certificate_key ${KEY};|" \
    "$HTTPS_TEMPLATE" > "$TARGET"
else
  echo "nginx: WARNING — no TLS certs found under /etc/nginx/ssl — HTTP only on :80"
  echo "nginx:         expected cert.pem/key.pem or letsencrypt/live/<domain>/{fullchain,privkey}.pem"
  echo "nginx:         run: make install-ssl-certs DOMAIN=thermosolver.net EMAIL=... STOP_NGINX=1 RELOAD=1"
  cp "$HTTP_TEMPLATE" "$TARGET"
fi
