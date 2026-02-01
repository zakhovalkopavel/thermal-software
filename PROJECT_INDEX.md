# Thermal Software - Project Index
**Version:** 2.0.0-dev  
**Last Updated:** February 1, 2026  
**Status:** Migration to NestJS - Docker-Only Approach
---
## ⚠️ CRITICAL: 100% Docker Workflow
**NO Node.js commands on host machine!**
Everything runs inside Docker containers:
- ❌ NO `npx`, `npm`, `node` commands on host
- ✅ ALL commands via `docker-compose exec backend ...`
- ✅ Structure created manually, Docker installs/builds
---
## 📁 Project Structure
```
thermal-software/
├── README.md                       # Main overview
├── SETUP.md                        # Quick setup
├── PROJECT_INDEX.md                # This file (navigation)
├── VERSION.md                      # Version tracking
├── .env                            # Config (gitignored)
├── .env.example                    # Template
├── compose.yml                     # Docker services
├── Makefile                        # Commands
│
├── backend/                        # NestJS API (create manually)
├── frontend/                       # React SPA (create manually)
├── shared/                         # Shared types
│
├── legacy/                         # Original code (read-only)
│   ├── refractory/
│   ├── furnaceCombustion/
│   └── scripts-old/
│
├── docker/                         # Docker configs
│   ├── backend/Dockerfile          # Backend container
│   ├── frontend/Dockerfile         # Frontend container
│   └── nginx/, legacy/
│
├── docs/                           # Documentation
│   ├── migration/                  # Migration guides
│   │   ├── DOCKER_FIRST_SETUP.md   # ⭐ START HERE - Docker-only guide
│   │   ├── NESTJS_MIGRATION_SPEC.md
│   │   ├── NESTJS_QUICK_START.md
│   │   └── ...
│   ├── ENVIRONMENT_MANAGEMENT.md
│   ├── PARALLEL_DEVELOPMENT_STRATEGY.md
│   └── REPORTS_MANAGEMENT.md
│
├── tmp/reports/                    # ⚠️  ALL REPORTS GO HERE
│   ├── README.md                   # Reports requirement
│   ├── calculations/               # Calculation reports
│   ├── migrations/                 # Migration logs
│   ├── performance/                # Benchmarks
│   └── tests/                      # Test results
│
└── scripts/
    ├── verify-migration-setup.sh
    └── restructure-project.sh
```
---
## 🚀 Quick Start (Docker-Only)
### 1. Setup Environment
```bash
make setup
vim .env  # Add secure JWT secrets
```
### 2. Create Backend/Frontend Manually
```bash
# Follow: docs/migration/DOCKER_FIRST_SETUP.md
# Creates directory structure manually (NO npx/npm on host)
```
### 3. Build & Run with Docker
```bash
# Docker installs everything and starts
docker-compose up --build
```
**That's it!** No Node.js on host required.
---
## 📚 Documentation
### Getting Started
- **⭐ START HERE:** `docs/migration/DOCKER_FIRST_SETUP.md` - Docker-only setup
- `README.md` - Project overview
- `SETUP.md` - Environment setup
- `VERSION.md` - Version tracking
### Migration
- `docs/migration/DOCKER_FIRST_SETUP.md` - Docker-only approach (NEW)
- `docs/migration/NESTJS_MIGRATION_SPEC.md` - Complete spec
- `docs/migration/NESTJS_QUICK_START.md` - 30-min guide
- `docs/migration/ARCHITECTURE_COMPARISON.md` - Before/after
### Configuration
- `docs/ENVIRONMENT_MANAGEMENT.md` - .env guide
- `docs/PARALLEL_DEVELOPMENT_STRATEGY.md` - Dev strategy
- `docs/REPORTS_MANAGEMENT.md` - Reports guide
- `docker/README.md` - Docker organization
---
## ⚠️ Important Rules
### 1. Docker-Only Commands
❌ **NEVER on host:**
```bash
npx @nestjs/cli new backend        # NO!
npm install                         # NO!
npm create vite                     # NO!
```
✅ **ALWAYS in Docker:**
```bash
docker-compose exec backend sh                 # Access container
docker-compose exec backend npm run test       # Run commands
```
### 2. Reports Location
⚠️ **ALL reports, logs, and output files MUST go to `tmp/reports/`**
✅ Correct:
```bash
echo "Results" > tmp/reports/calculations/calc-20260201.log
npm run migrate > tmp/reports/migrations/migration-20260201.log
```
❌ Wrong:
```bash
echo "Results" > report.log  # NOT in project root!
```
### 3. Secrets Protection
- ❌ NEVER commit: `.env`, `*.key`, `*.pem`, `*.crt`, certificates
- ✅ ALWAYS use: `.env.example` as template
---
## 🔗 Quick Links
### Implementation
1. **Start:** `docs/migration/DOCKER_FIRST_SETUP.md` ⭐
2. **Verify:** `tmp/reports/READY_FOR_IMPLEMENTATION.md`
3. **Reference:** `docs/migration/NESTJS_MIGRATION_SPEC.md`
### Configuration
1. **Environment:** `docs/ENVIRONMENT_MANAGEMENT.md`
2. **Docker:** `docker/README.md`
3. **Versions:** `VERSION.md`
### Reports & Logs
1. **Guide:** `docs/REPORTS_MANAGEMENT.md`
2. **Location:** `tmp/reports/`
3. **Cleanup:** `make clean-reports`
---
## 📊 Current Status
| Component | Status | Location |
|-----------|--------|----------|
| Legacy System | ✅ Production | `legacy/` |
| Database Services | ✅ Ready | postgres, redis |
| Backend (NestJS) | ⏳ Create manually | Follow DOCKER_FIRST_SETUP.md |
| Frontend (React) | ⏳ Create manually | Follow DOCKER_FIRST_SETUP.md |
| Docker Config | ✅ Complete | `docker/` |
| Documentation | ✅ Complete | `docs/` |
---
## 🛠️ Common Commands
```bash
# Setup
make setup              # Create .env
vim .env                # Edit secrets
# Development (everything in Docker)
docker-compose up --build           # Build and start all
docker-compose ps                   # Check services
docker-compose logs -f backend      # View logs
docker-compose exec backend sh      # Access container
docker-compose restart backend      # Restart service
# Cleanup
make clean-reports      # Clean old reports
docker-compose down     # Stop all services
```
---
## 🎯 Next Steps
1. ✅ Environment configured
2. ✅ Documentation complete
3. ⏳ **Follow: `docs/migration/DOCKER_FIRST_SETUP.md`**
   - Create backend structure manually
   - Create frontend structure manually
   - Run `docker-compose up --build`
   - Docker handles all installation/building
**No Node.js on host required!** 🐳
---
**Last Updated:** February 1, 2026  
**Maintainer:** Thermal Software Team
