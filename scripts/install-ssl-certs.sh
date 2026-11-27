#!/usr/bin/env bash
# Issue, install, or renew TLS certificates for Nginx (docker/nginx/ssl).
# Docs: docs/nginx-ssl-workflow-and-ops.md
#
# Usage:
#   ./scripts/install-ssl-certs.sh issue --domain example.com --email you@example.com
#   ./scripts/install-ssl-certs.sh install --domain example.com
#   ./scripts/install-ssl-certs.sh install --cert /path/fullchain.pem --key /path/privkey.pem
#   ./scripts/install-ssl-certs.sh self-signed [--domain localhost]
#   ./scripts/install-ssl-certs.sh renew [--reload]
#
# Options:
#   --staging     Use Let's Encrypt staging (rate-limit safe)
#   --reload      Reload nginx after installing into docker/nginx/ssl
#   --stop-nginx  Stop the nginx compose service while issuing (frees port 80)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SSL_DIR="$PROJECT_ROOT/docker/nginx/ssl"
LE_DIR="$SSL_DIR/letsencrypt"
CERTBOT_IMAGE="${CERTBOT_IMAGE:-certbot/certbot}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() { echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"; echo -e "${BLUE}$1${NC}"; echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

usage() {
  cat <<'EOF'
Issue, install, or renew TLS certificates for Nginx (docker/nginx/ssl).
Docs: docs/nginx-ssl-workflow-and-ops.md

Usage:
  ./scripts/install-ssl-certs.sh issue --domain example.com --email you@example.com
  ./scripts/install-ssl-certs.sh install --domain example.com
  ./scripts/install-ssl-certs.sh install --cert /path/fullchain.pem --key /path/privkey.pem
  ./scripts/install-ssl-certs.sh renew [--reload]
  ./scripts/install-ssl-certs.sh self-signed [--domain localhost]

Options:
  --staging     Use Let's Encrypt staging (rate-limit safe)
  --reload      Reload nginx after installing into docker/nginx/ssl
  --stop-nginx  Stop the nginx compose service while issuing (frees port 80)
EOF
  exit "${1:-0}"
}

COMMAND=""
DOMAIN=""
EMAIL=""
CERT_SRC=""
KEY_SRC=""
STAGING=0
RELOAD=0
STOP_NGINX=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    issue|install|renew|self-signed|help|-h|--help)
      if [[ -z "$COMMAND" && "$1" != help && "$1" != -h && "$1" != --help ]]; then
        COMMAND="$1"
      else
        usage 0
      fi
      shift
      ;;
    --domain|-d) DOMAIN="${2:-}"; shift 2 ;;
    --email|-e) EMAIL="${2:-}"; shift 2 ;;
    --cert) CERT_SRC="${2:-}"; shift 2 ;;
    --key) KEY_SRC="${2:-}"; shift 2 ;;
    --staging) STAGING=1; shift ;;
    --reload) RELOAD=1; shift ;;
    --stop-nginx) STOP_NGINX=1; shift ;;
    *)
      print_error "Unknown argument: $1"
      usage 1
      ;;
  esac
done

COMMAND="${COMMAND:-issue}"

require_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    print_error "Docker is required (certbot runs via ${CERTBOT_IMAGE})."
    exit 1
  fi
}

compose_cmd() {
  if docker compose version >/dev/null 2>&1; then
    echo "docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    echo "docker-compose"
  else
    echo ""
  fi
}

nginx_running() {
  local compose
  compose="$(compose_cmd)"
  [[ -n "$compose" ]] || return 1
  (cd "$PROJECT_ROOT" && $compose ps -q nginx 2>/dev/null | grep -q .)
}

port_80_busy() {
  if command -v ss >/dev/null 2>&1; then
    ss -ltn "( sport = :80 )" 2>/dev/null | grep -q ':80'
  elif command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:80 -sTCP:LISTEN >/dev/null 2>&1
  else
    return 1
  fi
}

ensure_dirs() {
  mkdir -p "$SSL_DIR" "$LE_DIR"
}

install_files() {
  local cert_path="$1"
  local key_path="$2"

  if [[ ! -e "$cert_path" && ! -L "$cert_path" ]]; then
    print_error "Certificate not found: $cert_path"
    exit 1
  fi
  if [[ ! -e "$key_path" && ! -L "$key_path" ]]; then
    print_error "Private key not found: $key_path"
    exit 1
  fi

  ensure_dirs
  umask 077
  # -L: Let's Encrypt live/* are symlinks into archive/
  cp -L "$cert_path" "$SSL_DIR/cert.pem"
  cp -L "$key_path" "$SSL_DIR/key.pem"
  chmod 644 "$SSL_DIR/cert.pem"
  chmod 600 "$SSL_DIR/key.pem"
  print_success "Installed:"
  echo "  $SSL_DIR/cert.pem"
  echo "  $SSL_DIR/key.pem"
}

live_paths_for_domain() {
  local domain="$1"
  echo "$LE_DIR/live/$domain/fullchain.pem"
  echo "$LE_DIR/live/$domain/privkey.pem"
}

# Copy live lineage into docker/nginx/ssl via a container (avoids host permission/symlink issues).
install_from_letsencrypt_domain() {
  local domain="$1"
  ensure_dirs
  print_info "Copying Let's Encrypt live/$domain → docker/nginx/ssl/ (via Docker)…"

  if ! docker run --rm \
    -v "$LE_DIR:/etc/letsencrypt:ro" \
    -v "$SSL_DIR:/out" \
    --entrypoint sh \
    "$CERTBOT_IMAGE" \
    -c "set -e
      live=\"/etc/letsencrypt/live/${domain}\"
      if [ ! -e \"\$live/fullchain.pem\" ]; then
        echo \"Missing \$live/fullchain.pem\" >&2
        echo \"Contents of /etc/letsencrypt:\" >&2
        ls -la /etc/letsencrypt >&2 || true
        echo \"Contents of /etc/letsencrypt/live:\" >&2
        ls -la /etc/letsencrypt/live >&2 || true
        exit 1
      fi
      cp -L \"\$live/fullchain.pem\" /out/cert.pem
      cp -L \"\$live/privkey.pem\" /out/key.pem
      chmod 644 /out/cert.pem
      chmod 600 /out/key.pem
      ls -la /out/cert.pem /out/key.pem
    "; then
    print_error "Could not copy certs for domain ${domain} from ${LE_DIR}"
    print_info "List lineages: docker run --rm -v \"${LE_DIR}:/etc/letsencrypt\" ${CERTBOT_IMAGE} certificates"
    return 1
  fi
  print_success "Installed $SSL_DIR/cert.pem and key.pem"
}

reload_nginx_if_requested() {
  [[ "$RELOAD" -eq 1 ]] || return 0
  local compose
  compose="$(compose_cmd)"
  if [[ -z "$compose" ]]; then
    print_warning "Docker Compose not found; skip nginx reload."
    return 0
  fi
  if ! nginx_running; then
    print_warning "Nginx container is not running; skip reload."
    return 0
  fi
  print_info "Reloading nginx…"
  (cd "$PROJECT_ROOT" && $compose exec -T nginx nginx -t)
  (cd "$PROJECT_ROOT" && $compose exec -T nginx nginx -s reload)
  print_success "Nginx reloaded"
}

stop_nginx_for_issue() {
  local compose
  compose="$(compose_cmd)"
  if [[ "$STOP_NGINX" -eq 1 ]]; then
    if [[ -z "$compose" ]]; then
      print_error "--stop-nginx needs Docker Compose."
      exit 1
    fi
    print_info "Stopping nginx to free port 80…"
    (cd "$PROJECT_ROOT" && $compose stop nginx)
    return 0
  fi

  if port_80_busy || nginx_running; then
    print_error "Port 80 is in use (often by nginx). Standalone issuance needs it free."
    print_info "Re-run with --stop-nginx, or stop the listener yourself, then retry."
    exit 1
  fi
}

start_nginx_after_issue() {
  [[ "$STOP_NGINX" -eq 1 ]] || return 0
  local compose
  compose="$(compose_cmd)"
  [[ -n "$compose" ]] || return 0
  print_info "Starting nginx…"
  (cd "$PROJECT_ROOT" && $compose start nginx)
}

run_certbot() {
  local args=("$@")
  docker run --rm \
    -p 80:80 \
    -v "$LE_DIR:/etc/letsencrypt" \
    "$CERTBOT_IMAGE" \
    "${args[@]}"
}

cmd_issue() {
  require_docker
  if [[ -z "$DOMAIN" ]]; then
    print_error "--domain is required for issue"
    usage 1
  fi
  if [[ -z "$EMAIL" ]]; then
    print_error "--email is required for issue (Let's Encrypt registration)"
    usage 1
  fi

  print_header "Issue Let's Encrypt certificate"
  print_info "Domain: $DOMAIN"
  print_info "Email:  $EMAIL"
  [[ "$STAGING" -eq 1 ]] && print_warning "Using Let's Encrypt staging"

  ensure_dirs
  stop_nginx_for_issue

  local certbot_args=(
    certonly
    --standalone
    --preferred-challenges http
    --non-interactive
    --agree-tos
    --email "$EMAIL"
    -d "$DOMAIN"
  )
  if [[ "$STAGING" -eq 1 ]]; then
    certbot_args+=(--staging)
  fi

  set +e
  run_certbot "${certbot_args[@]}"
  local status=$?
  set -e

  # Certbot may exit 0 with "Certificate not yet due for renewal" — still copy live → ssl/.
  if [[ "$status" -ne 0 ]]; then
    start_nginx_after_issue
    print_error "certbot failed (exit $status)"
    exit "$status"
  fi

  if ! install_from_letsencrypt_domain "$DOMAIN"; then
    print_warning "Live certs missing after certonly — forcing one renewal to recreate files…"
    local force_args=("${certbot_args[@]}" --force-renewal)
    set +e
    run_certbot "${force_args[@]}"
    status=$?
    set -e
    if [[ "$status" -ne 0 ]] || ! install_from_letsencrypt_domain "$DOMAIN"; then
      start_nginx_after_issue
      print_error "Still no usable certs under ${LE_DIR}/live/${DOMAIN}"
      exit 1
    fi
  fi

  start_nginx_after_issue
  reload_nginx_if_requested

  print_success "Done. Nginx uses /etc/nginx/ssl/cert.pem and key.pem (bind-mounted)."
  print_info "Restart nginx if it was already running without certs: docker compose up -d --force-recreate nginx"
}

cmd_install() {
  print_header "Install certificates into docker/nginx/ssl"

  if [[ -n "$CERT_SRC" || -n "$KEY_SRC" ]]; then
    if [[ -z "$CERT_SRC" || -z "$KEY_SRC" ]]; then
      print_error "Provide both --cert and --key"
      exit 1
    fi
    install_files "$CERT_SRC" "$KEY_SRC"
  else
    if [[ -z "$DOMAIN" ]]; then
      print_error "Provide --domain (reads docker/nginx/ssl/letsencrypt/live/<domain>/) or --cert/--key"
      usage 1
    fi
    require_docker
    install_from_letsencrypt_domain "$DOMAIN"
  fi

  reload_nginx_if_requested
}

cmd_self_signed() {
  require_docker
  local domain="${DOMAIN:-localhost}"
  print_header "Create self-signed certificate"
  print_info "Domain CN/SAN: $domain (browsers will warn — fine for local/dev)"

  ensure_dirs
  local tmp
  tmp="$(mktemp -d)"
  docker run --rm \
    -v "$tmp:/out" \
    alpine/openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
      -keyout /out/key.pem \
      -out /out/cert.pem \
      -subj "/CN=${domain}" \
      -addext "subjectAltName=DNS:${domain},DNS:localhost,IP:127.0.0.1"

  install_files "$tmp/cert.pem" "$tmp/key.pem"
  rm -rf "$tmp"
  reload_nginx_if_requested
  print_success "Self-signed cert installed — nginx can listen on 443"
}

cmd_renew() {
  require_docker
  print_header "Renew Let's Encrypt certificates"

  if [[ ! -d "$LE_DIR/live" ]]; then
    print_error "No Let's Encrypt data under $LE_DIR — run issue first."
    exit 1
  fi

  ensure_dirs
  stop_nginx_for_issue

  local certbot_args=(renew --non-interactive)
  if [[ "$STAGING" -eq 1 ]]; then
    certbot_args+=(--staging)
  fi

  set +e
  run_certbot "${certbot_args[@]}"
  local status=$?
  set -e

  start_nginx_after_issue

  if [[ "$status" -ne 0 ]]; then
    print_error "certbot renew failed (exit $status)"
    exit "$status"
  fi

  # Refresh nginx copy for each live lineage (via Docker so symlinks resolve).
  local domains
  domains="$(
    docker run --rm \
      -v "$LE_DIR:/etc/letsencrypt:ro" \
      --entrypoint sh \
      "$CERTBOT_IMAGE" \
      -c 'ls -1 /etc/letsencrypt/live 2>/dev/null | grep -v README || true'
  )"
  if [[ -z "$domains" ]]; then
    print_warning "No lineages under ${LE_DIR}/live after renew"
  else
    while IFS= read -r domain; do
      [[ -n "$domain" ]] || continue
      print_info "Refreshing nginx files from $domain"
      install_from_letsencrypt_domain "$domain" || true
    done <<<"$domains"
  fi

  reload_nginx_if_requested
  print_success "Renewal finished"
}

case "$COMMAND" in
  issue) cmd_issue ;;
  install) cmd_install ;;
  self-signed) cmd_self_signed ;;
  renew) cmd_renew ;;
  *) usage 1 ;;
esac
