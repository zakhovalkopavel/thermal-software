# 🚀 Thermal Software — Dev Cheatsheet

> Full context → **[README.md](README.md)** | First-time setup → **[SETUP.md](SETUP.md)**

---

## Start / Stop

```bash
make up                         # Start all 6 services
make down                       # Stop all services
make restart                    # Stop → start
docker compose ps               # Check container statuses
docker compose down -v          # Nuclear reset (removes volumes)
```

---

## Access Points

| URL | What |
|-----|------|
| `http://localhost` | Frontend ⚠️ WIP |
| `http://localhost/api/v1` | Backend REST API |
| `http://localhost/api/docs` | Swagger UI |
| `http://localhost/api/v1/health` | Health check |

---

## Logs

```bash
make logs                       # All services (follow)
make logs-backend               # Backend only
make logs-frontend              # Frontend only
make logs-python                # Python only
docker compose logs -f nginx    # Nginx directly
```

---

## Shell Access

```bash
make backend-shell              # sh  → backend
make frontend-shell             # sh  → frontend
make python-shell               # bash → python
make postgres-shell             # bash → postgres
make redis-shell                # sh  → redis
```

---

## Code Changes

```bash
# Backend — hot reload active
vim backend/src/some.service.ts
# NestJS reloads automatically

# Frontend — HMR active
vim frontend/src/App.tsx
# Vite reloads in browser instantly

# Python — exec to run
make python-shell
python src/nasa_thermo/...
```

---

## Installing Packages

```bash
# Backend
docker compose exec backend npm install <pkg>
git add backend/package.json backend/package-lock.json

# Frontend
docker compose exec frontend npm install <pkg>
git add frontend/package.json frontend/package-lock.json

# Python (inside container)
make python-shell
poetry add <pkg>
```

---

## Tests

```bash
make test-backend                                           # All backend tests
make test-frontend                                         # All frontend tests
docker compose exec backend npm run test:watch             # Watch mode
docker compose exec backend npm run test:cov               # Coverage report
docker compose exec backend npm run test -- <file>.spec    # Single file
docker compose exec backend npm run test:e2e               # E2E tests

# Save coverage
docker compose exec backend npm run test:cov > tmp/reports/tests/coverage-$(date +%Y%m%d).txt
```

---

## Database

```bash
# PostgreSQL
docker compose exec postgres psql -U thermal -d thermal

# Redis
docker compose exec redis redis-cli
```

---

## Troubleshooting

```bash
# Service won't start — check logs
docker compose logs <service>

# Port conflict
sudo lsof -i :80
# Fix: set HTTP_PORT=8080 in .env

# Rebuild after Dockerfile change
docker compose build
make up

# .env missing
make setup && make setup-secrets && make up

# Full reset
docker compose down -v && docker compose build && make up
```
