# Quick Setup Guide

**Last Updated:** May 2026

---

## 🚀 First Time Setup

### 1. Create Environment File
```bash
make setup
# Copies .env.example → .env
```

### 2. Generate Secure Secrets
```bash
make setup-secrets
# Generates JWT_SECRET, JWT_REFRESH_SECRET, DB_PASSWORD automatically
```

### 3. Start Services
```bash
make up
```

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
make setup              # Create .env from .env.example
make setup-secrets      # Generate and inject secure secrets

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
make test-frontend      # Run frontend tests
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
- **Secrets policy:** [docs/PRODUCTION_SECRETS.md](docs/PRODUCTION_SECRETS.md)
- **Docker architecture:** [docs/NGINX_ARCHITECTURE.md](docs/NGINX_ARCHITECTURE.md)
- **Dev strategy:** [docs/migration/ROADMAP.md](docs/migration/ROADMAP.md)
- **Image versions:** `.env.example` — all `*_VERSION` variables are the single source of truth

---

**Ready? Run `make setup && make setup-secrets && make up`** 🚀
