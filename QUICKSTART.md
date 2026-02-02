# 🚀 Thermal Software v2.0 - Quick Start Guide

**Migration Status:** ✅ COMPLETED  
**Date:** February 1, 2026

---

## ⚠️ IMPORTANT: Before Development

**ALL code must follow project naming conventions!**  
👉 Read: [NAMING_CONVENTIONS.md](NAMING_CONVENTIONS.md) **BEFORE any coding**

---

## Start Everything (One Command)

```bash
cd /opt/thermal-software
docker-compose up -d
```

**Wait 10 seconds for services to initialize, then:**

```bash
docker-compose ps
```

**Expected: 6 containers running**
- thermal-postgres (healthy)
- thermal-redis (healthy)
- thermal-backend (running)
- thermal-frontend (running)
- thermal-nginx (running)
- thermal-python (running)

---

## Access Your Application

### 🌐 Main Access Points:

```
Frontend:              http://localhost
Backend API:           http://localhost/api/v1
API Documentation:     http://localhost/api/docs
Health Check:          http://localhost/api/v1/health
```

---

## Development Commands

### View Logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

### Restart Services:
```bash
# All
docker-compose restart

# Specific
docker-compose restart backend
docker-compose restart frontend
```

### Stop Everything:
```bash
docker-compose down
```

### Stop and Remove Volumes (Fresh Start):
```bash
docker-compose down -v
```

---

## Making Code Changes

### Backend (Hot Reload Enabled):

```bash
# Edit any file in backend/src/
vim backend/src/app.controller.ts

# Changes auto-sync to container
# NestJS automatically reloads
# No manual restart needed!
```

### Frontend (HMR Enabled):

```bash
# Edit any file in frontend/src/
vim frontend/src/App.tsx

# Changes auto-sync to container
# Vite hot-reloads in browser
# See changes instantly!
```

---

## Installing Packages

### Backend:
```bash
docker-compose exec backend npm install package-name

# package.json automatically updates on host
# Commit directly!
git add backend/package.json backend/package-lock.json
git commit -m "Add package-name"
```

### Frontend:
```bash
docker-compose exec frontend npm install package-name

# package.json automatically updates on host
git add frontend/package.json frontend/package-lock.json
git commit -m "Add package-name"
```

---

## Running Tests

### Backend Tests:
```bash
docker-compose exec backend npm test
docker-compose exec backend npm run test:watch
docker-compose exec backend npm run test:cov
```

### Frontend Tests:
```bash
docker-compose exec frontend npm test
docker-compose exec frontend npm run test:watch
```

---

## Database Access

### PostgreSQL:
```bash
docker-compose exec postgres psql -U thermal -d thermal
```

### Redis:
```bash
docker-compose exec redis redis-cli
```

---

## Troubleshooting

### Services Not Starting?
```bash
# Check logs
docker-compose logs

# Rebuild containers
docker-compose build
docker-compose up -d
```

### Port Already in Use?
```bash
# Check what's using port 80
sudo lsof -i :80

# Or change port in .env
# HTTP_PORT=8080
```

### Need Fresh Start?
```bash
# Remove everything
docker-compose down -v

# Rebuild
docker-compose build

# Start fresh
docker-compose up -d
```

---

## Important Files

```
.env                    → Configuration (DO NOT commit!)
compose.yml             → Development orchestration
compose.production.yml  → Production orchestration

backend/
  src/                  → Your backend code
  package.json          → Backend dependencies

frontend/
  src/                  → Your frontend code
  package.json          → Frontend dependencies

docs/                   → Documentation
tmp/reports/            → Migration reports
```

---

## Next Steps

1. ✅ Verify all services running: `docker-compose ps`
2. ✅ Access frontend: `http://localhost`
3. ✅ Check API docs: `http://localhost/api/docs`
4. → Start building features!
5. → Read: `docs/NESTJS_MIGRATION_SPEC.md`
6. → Read: `tmp/reports/MIGRATION_COMPLETE.md`

---

## Need Help?

**Documentation:**
- `START_HERE.md` - Migration overview
- `docs/DOCKER_FIRST_SETUP.md` - Docker setup
- `docs/NESTJS_MIGRATION_SPEC.md` - Migration spec
- `tmp/reports/MIGRATION_COMPLETE.md` - What was done

**Common Issues:**
- `tmp/reports/NPM_DEPRECATED_WARNINGS_EXPLAINED.md`
- `tmp/reports/AUTO_SYNC_FILES_FIXED.md`
- `tmp/reports/DOCKER_WARNINGS_FIXED.md`

---

**🎉 Your thermal software v2.0 is ready for development!**

