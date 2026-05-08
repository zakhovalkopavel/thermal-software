# Docker-Only Development Setup

**Version:** 2.1.0  
**Last Updated:** May 2026  
**Approach:** 100% Docker — no Node.js on host required

> 📖 Naming conventions: [../NAMING_CONVENTIONS.md](../NAMING_CONVENTIONS.md)  
> 🗺️ Project overview: [MIGRATION_INDEX.md](MIGRATION_INDEX.md)

---

## Prerequisites

✅ Required on host:
- Docker
- Docker Compose
- `make`

❌ NOT required on host:
- Node.js / npm
- NestJS CLI
- Python

```bash
# Verify:
docker --version
docker compose version
make --version
```

---

## First-Time Setup (new machine or fresh clone)

```bash
# 1. Create .env from template
make setup

# 2. Generate secure secrets (JWT + DB password) into .env
make setup-secrets

# 3. Build images and start all services
make up
```

That's it. Docker builds the images, installs all npm/Python dependencies inside the
containers, and starts every service.

---

## What `make up` does

1. Checks `.env` exists
2. Runs `docker-compose up -d` (postgres, redis, backend, frontend, nginx, python)
3. Syncs `node_modules` from containers to host (so your IDE has type definitions)
4. Tails logs

```
Frontend:  http://localhost:<HTTP_PORT>
Backend:   http://localhost:<HTTP_PORT>/api/v1
Swagger:   http://localhost:<HTTP_PORT>/api/docs
```

The exact port is read from `HTTP_PORT` in your `.env`.

---

## Daily Workflow

| Task | Command |
|------|---------|
| Start all services | `make up` |
| Stop all services | `make down` |
| Restart all services | `make restart` |
| Force-rebuild images | `make rebuild` |
| View all logs (follow) | `make logs` |
| Backend logs | `make logs-backend` |
| Frontend logs | `make logs-frontend` |

---

## Editing Code

Edit source files directly on the host — the containers mount `backend/src/` and
`frontend/src/`, so changes are picked up automatically by the watch mode running
inside the container.

```bash
# Example: edit a service
vim backend/src/modules/refractory/services/blend-optimizer.service.ts

# Backend hot-reloads automatically (NestJS --watch mode)
make logs-backend
```

---

## Running Commands Inside Containers

Use the shell targets to open an interactive shell:

```bash
make backend-shell    # sh inside backend
make frontend-shell   # sh inside frontend
make postgres-shell   # bash inside postgres
make redis-shell      # sh inside redis
make python-shell     # bash inside python
make nginx-shell      # sh inside nginx
```

Or run a single command without opening a shell:

```bash
docker compose exec backend sh -c "nest generate service my-new-service"
docker compose exec backend sh -c "npm run lint"
docker compose exec backend sh -c "npm run build"
```

---

## Adding or Updating Dependencies

Edit `package.json` on the host, then rebuild that service:

```bash
# Backend example
vim backend/package.json          # add the dependency
docker compose build backend      # rebuild image (runs npm ci)
make up                           # restart with new image
```

Same applies for `frontend/package.json` and `python/pyproject.toml`.

---

## Running Tests

```bash
# All backend tests
make test-backend

# All frontend tests
make test-frontend

# Specific service
make test-service SERVICE=backend

# Blend optimizer demo only (filtered output)
make test-blend-demo
```

Tests always run inside the container — never on the host.

---

## TypeScript Type Checking

```bash
# Check all types (backend)
make check-types

# Check a specific pattern
make check-types-pattern PATTERN=refractory

# Verbose output
make check-types-verbose
```

---

## Generating NestJS Resources

Open a shell inside the backend container, then use the NestJS CLI:

```bash
make backend-shell

# Inside the container:
nest generate module modules/my-module
nest generate service modules/my-module/services/my-service
nest generate controller modules/my-module

exit
```

---

## Secrets and `.env`

| Command | Purpose |
|---------|---------|
| `make setup` | Create `.env` from `.env.example` |
| `make setup-secrets` | Generate secure JWT + DB password into `.env` |
| `make generate-jwt` | Print new secrets to stdout (for copy-paste) |

`.env` is **never** committed to git — see [../ENV_ONLY_POLICY.md](../ENV_ONLY_POLICY.md).

---

## Troubleshooting

### Services won't start

```bash
make check-env        # verify .env exists
make logs             # view all logs
make down && make rebuild   # rebuild from scratch
```

### Backend TypeScript errors

```bash
make logs-backend        # see compiler output
make backend-shell
npm run build            # build manually inside container
```

### Port already in use

```bash
lsof -i :<HTTP_PORT>       # find what's on the port
# or change HTTP_PORT in .env, then:
make restart
```

### node_modules out of sync (missing types in IDE)

```bash
make sync-node-modules
```

### Wipe everything and start clean

```bash
make down
docker compose down -v          # removes volumes (wipes DB)
make rebuild
```

---

## Quick Reference

```bash
# Clone + first boot
git clone <repo>
cd thermal-software
make setup && make setup-secrets && make up

# Every day
make up            # start
make down          # stop
make logs          # follow logs

# Edit code (on host, hot-reload picks it up)
vim backend/src/...
make logs-backend

# Tests
make test-backend
make test-blend-demo

# Shell access
make backend-shell
make postgres-shell
```
