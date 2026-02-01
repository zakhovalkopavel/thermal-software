# Thermal Software - Modern Architecture

Enterprise-grade thermal engineering software with client-server architecture.

---

## 🎯 **WANT TO START IMPLEMENTATION?**

### → **[START_HERE.md](START_HERE.md)** ⭐ **READ THIS FIRST!**

**This is your SINGLE STARTING POINT for migration implementation.**

Everything you need:
- ✅ Pre-implementation checklist
- ✅ Mandatory rules enforcement
- ✅ Step-by-step phases (0→1→2→3→4)
- ✅ Checkpoints and verification
- ✅ Troubleshooting guide
- ✅ Progress tracking

**Before writing ANY code:** Open [START_HERE.md](START_HERE.md)

---

## 🏗️ Architecture

```
├── legacy/              ← Original system (production, read-only)
├── backend/            ← NestJS API (new)
├── frontend/           ← React SPA (new)
├── shared/             ← Shared types/constants
└── docs/               ← Documentation
```

## 🚀 Quick Start

### Run Legacy System (Current Production)
```bash
docker-compose up legacy-refractory
# Access: http://localhost:18080
```

### Run New System (Development)
```bash
# Start database
docker-compose up postgres redis

# Backend (when ready)
cd backend
npm install
npm run start:dev
# Access: http://localhost:4000/api/docs

# Frontend (when ready)
cd frontend
npm install
npm run dev
# Access: http://localhost:3000
```

### Run Both Systems
```bash
docker-compose up
# Legacy:  http://localhost:18080
# New:     http://localhost:3000
# API:     http://localhost:4000/api/docs
```

## 📋 Project Rules & Manifests

### Core Rules
1. **Docker-Only:** NO Node.js commands on host → [PROJECT_INDEX.md](PROJECT_INDEX.md#️-important-rules)
2. **Reports Location:** ALL reports to `tmp/reports/` → [REPORTS_MANAGEMENT.md](docs/REPORTS_MANAGEMENT.md)
3. **Secrets Protection:** NO `.env`, certificates in git → [.gitignore](.gitignore)
4. **Version Control:** Latest stable versions → [VERSION.md](VERSION.md)

### Manifests
- **[PROJECT_INDEX.md](PROJECT_INDEX.md)** - Complete project navigation & rules
- **[VERSION.md](VERSION.md)** - Docker image versions (verified Feb 1, 2026)
- **[SETUP.md](SETUP.md)** - Environment setup guide
- **Legacy Manifest:** `legacy/MANIFEST.md` - Original project structure

## 📚 Documentation

### Getting Started
- **⭐ START HERE:** [docs/migration/DOCKER_FIRST_SETUP.md](docs/migration/DOCKER_FIRST_SETUP.md) - Docker-only setup
- **Project Index:** [PROJECT_INDEX.md](PROJECT_INDEX.md) - Complete navigation
- **Setup Guide:** [SETUP.md](SETUP.md) - Environment setup

### Migration Guides
- **Docker-Only Setup:** [docs/migration/DOCKER_FIRST_SETUP.md](docs/migration/DOCKER_FIRST_SETUP.md)
- **Full Spec:** [docs/migration/NESTJS_MIGRATION_SPEC.md](docs/migration/NESTJS_MIGRATION_SPEC.md)
- **Quick Start:** [docs/migration/NESTJS_QUICK_START.md](docs/migration/NESTJS_QUICK_START.md)
- **Architecture:** [docs/migration/ARCHITECTURE_COMPARISON.md](docs/migration/ARCHITECTURE_COMPARISON.md)
- **Strategy:** [docs/migration/PARALLEL_DEVELOPMENT_STRATEGY.md](docs/migration/PARALLEL_DEVELOPMENT_STRATEGY.md)

### Configuration
- **Environment:** [docs/ENVIRONMENT_MANAGEMENT.md](docs/ENVIRONMENT_MANAGEMENT.md)
- **Reports:** [docs/REPORTS_MANAGEMENT.md](docs/REPORTS_MANAGEMENT.md)
- **Docker:** [docker/README.md](docker/README.md)

## 🎯 Current Status

- ✅ **Legacy System:** Production-ready, serving users
- 🚧 **New Backend:** In development
- 🚧 **New Frontend:** In development
- 📊 **Migration:** Phase 0 - Structure setup complete

## 🔧 Development

See `/docs/migration/NESTJS_QUICK_START.md` for setup instructions.

## 📞 Support

Check documentation in `/docs/migration/` folder.
