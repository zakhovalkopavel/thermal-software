# Quick Setup Guide

**Last Updated:** May 2026

---

## 🚀 First Time Setup

### 1. Clone the main project
```bash
git clone <this-repo> thermal-software
cd thermal-software
```

Shared libs (`vendor/page-ocr`, `vendor/source-extract`) are git submodules. See
[docs/SHARED_LIBRARIES_SUBMODULES.md](docs/SHARED_LIBRARIES_SUBMODULES.md) and
[vendor/README.md](vendor/README.md). Compose mounts both onto the python container
`PYTHONPATH`.

### 2. Run setup (submodules + .env)
```bash
make setup
# 1) git submodule update --init --recursive  (clones vendor/*)
# 2) copies .env.example → .env
# 3) make sync-vendor-env → fills each vendor/*/.env from the main .env
```

After editing OCR / Modal keys in `.env`, re-run:
```bash
make sync-vendor-env
```

### 3. Generate Secure Secrets
```bash
make setup-secrets
# Generates JWT_SECRET, JWT_REFRESH_SECRET, DB_PASSWORD automatically
```

### 4. Start Services
```bash
make up
```

The `vendor/page-ocr` **code** is always used for OCR (local and Modal): compose mounts it
on `PYTHONPATH`. You do **not** skip the submodule to “work locally” — adapters import it.

What *is* optional is **provisioning** the heavy local OCR runtime (`llama-server`, GGUF
weights, extra pip deps). The python Docker image already installs much of that
(`surya-ocr`, torch, `/opt/llama-cpp`). Re-run the installer only when rebuilding the
runtime on a bare host or refreshing models:

```bash
# Optional — host/bare-metal or to refresh llama + GGUFs:
cd vendor/page-ocr && ./install.sh --all
# Syncs .env from the host project when vendored under vendor/page-ocr.
```

Modal cloud OCR (no local llama needed for recognition):

```bash
# Set PAGE_OCR_BACKEND=modal and MODAL_TOKEN_* in .env, then:
make sync-vendor-env
make page-ocr-deploy
```

Skip OCR entirely for day-to-day backend/frontend work, or use
`make yaws1999-rebuild` / existing page dumps (no recognition).

That's it. No Node.js on the host required.
---

## 📝 Environment File (.env)

### ⚠️ Important
- **NEVER commit `.env` to git!** — it is gitignored
- `.env.example` is the source of truth for all variable names and default values

### Template Files

| File | Purpose | Git Tracked |
|------|---------|-------------|
| `.env.example` | Development template with defaults | ✅ Yes |
| `.env.production` | Production template | ✅ Yes |
| `.env` | Your active config | ❌ No (gitignored) |

> Image versions (PostgreSQL, Redis, Node.js, Nginx, Python) are defined in `.env.example`.  
> Check that file for the current pinned versions.

---

## 🔒 Generate Secure Secrets

The recommended way is:
```bash
make setup-secrets
```

This uses Docker's `alpine/openssl` — no local `openssl` required.

To print freshly-generated secrets without writing them to `.env`:
```bash
make generate-jwt
```

---

## ✅ Verification

```bash
# Check .env exists
ls -la .env

# Start services
make up

# Verify 6 containers running
docker compose ps
```

---

## 🎯 Common Commands

```bash
# Initial setup
make setup               # init-submodules + .env + sync vendor/*/.env
make init-submodules     # Clone/checkout vendor/* at pinned SHAs
make update-submodules   # Fetch latest remote tips for vendor/*
make sync-vendor-env     # Re-copy PAGE_OCR_* / MODAL_* into vendor envs
make setup-secrets       # Generate and inject secure secrets

# Start / stop
make up                 # Start all services
make down               # Stop all services
make restart            # Stop then start

# Logs
make logs               # All services (follow)
make logs-backend       # Backend only
make logs-frontend      # Frontend only

# Shell access
make backend-shell      # sh into backend container
make frontend-shell     # sh into frontend container
make python-shell       # bash into python container

# Tests
make test-backend       # Run backend tests
make test-frontend      # Full frontend gate (npm run verify; OFFLINE=1 skips contract)
```

---

## 🆘 Troubleshooting

### Error: ".env file not found"
```bash
make setup
make setup-secrets
make up
```

### Want to Reset .env?
```bash
cp .env .env.backup     # Backup first
make setup              # Recreate from template
make setup-secrets      # Regenerate secrets
```

### Services Not Coming Up?
```bash
docker compose logs backend
docker compose logs frontend
docker compose build    # Rebuild if Dockerfile changed
make up
```

---

## 📚 More Information

- **Environment variables:** [docs/ENV_ONLY_POLICY.md](docs/ENV_ONLY_POLICY.md)
- **Vendor libraries / submodules:** [docs/SHARED_LIBRARIES_SUBMODULES.md](docs/SHARED_LIBRARIES_SUBMODULES.md), [vendor/README.md](vendor/README.md)
- **Secrets policy:** [docs/PRODUCTION_SECRETS.md](docs/PRODUCTION_SECRETS.md)
- **Docker architecture:** [docs/NGINX_ARCHITECTURE.md](docs/NGINX_ARCHITECTURE.md)
- **Dev strategy:** [docs/migration/ROADMAP.md](docs/migration/ROADMAP.md)
- **Image versions:** `.env.example` — all `*_VERSION` variables are the single source of truth

---

**Ready? Run `make setup && make setup-secrets && make up`** 🚀
