# 🚀 START HERE: Migration Implementation Guide

**THIS IS YOUR STARTING POINT FOR MIGRATION IMPLEMENTATION**

**Version:** 1.0.0  
**Date:** February 1, 2026  
**Status:** Ready for Implementation

---

## ⚠️ CRITICAL: Read This Entire File Before Starting

This document is your **SINGLE SOURCE OF TRUTH** for implementing the NestJS migration. Follow it step-by-step. Do not skip sections.

---

## 📋 Pre-Implementation Checklist

Before you write a single line of code, verify these are complete:

### Environment Setup
```bash
# 1. Create .env from template
make setup

# 2. Generate secure JWT secrets automatically
make setup-secrets

# 3. Verify secrets were generated (no CHANGE_THIS)
grep "CHANGE_THIS" .env && echo "❌ Secrets not generated!" || echo "✅ Secrets OK"

# 4. Verify Docker
docker --version || echo "ERROR: Install Docker!"
docker-compose --version || echo "ERROR: Install Docker Compose!"

# 5. Verify no Node.js required on host
node --version && echo "⚠️  Node.js found but NOT required" || echo "✅ No Node.js (correct)"
```

**Required Status:**
- [x] `.env` file exists
- [x] `.env` has secure JWT_SECRET (not "CHANGE_THIS_SECRET")
- [x] `.env` has secure JWT_REFRESH_SECRET  
- [x] `.env` has secure DB_PASSWORD
- [x] Docker installed
- [x] Docker Compose installed
- [ ] Node.js on host (NOT required - that's the point!)

---

## 🔴 MANDATORY RULES (ENFORCE THESE!)

### Rule 1: 100% Docker Workflow - NO Exceptions

**❌ NEVER RUN ON HOST:**
```bash
npx @nestjs/cli new backend        # NO!
npm install                         # NO!
npm create vite                     # NO!
node --version                      # Don't need it!
npm run anything                    # NO!
```

**✅ ALWAYS USE DOCKER:**
```bash
docker-compose up --build                    # YES!
docker-compose exec backend npm run test     # YES!
docker-compose exec backend sh               # YES! (then run npm inside)
```

**Why?** 
- Consistent environment for all developers
- No "works on my machine" issues
- No Node.js installation required on host
- Docker Compose handles ALL dependencies

**Enforcement:**
- If you catch yourself typing `npm` or `npx` on host, STOP!
- Always prefix with `docker-compose exec backend` or `docker-compose exec frontend`

---

### Rule 2: ALL Reports to tmp/reports/ - NO Exceptions

**❌ NEVER SAVE REPORTS HERE:**
```bash
echo "Report" > report.md                    # NO! (project root)
echo "Log" > calculation-log.txt             # NO! (project root)
mkdir outputs && echo "test" > outputs/r.txt # NO! (random folder)
```

**✅ ALWAYS SAVE TO tmp/reports/:**
```bash
echo "Report" > tmp/reports/calculations/calc-$(date +%Y%m%d).log      # YES!
npm run migrate > tmp/reports/migrations/migration-$(date +%Y%m%d).log # YES!
npm test > tmp/reports/tests/test-results-$(date +%Y%m%d).txt          # YES!
```

**Subdirectories:**
- `tmp/reports/calculations/` - All calculation results
- `tmp/reports/migrations/` - All migration logs
- `tmp/reports/performance/` - All benchmarks
- `tmp/reports/tests/` - All test results

**Enforcement:**
- Before saving ANY file, ask: "Is this a report/log/output?"
- If YES → Save to `tmp/reports/[category]/`
- Files in `tmp/reports/` are automatically gitignored

---

### Rule 3: NO Secrets in Git - NO Exceptions

**❌ NEVER COMMIT:**
```bash
git add .env                # NO!
git add *.key               # NO!
git add *.pem               # NO!
git add secrets/            # NO!
```

**✅ ALWAYS USE TEMPLATES:**
```bash
git add .env.example        # YES! (template)
git add .env.production     # YES! (template)
# .env itself is gitignored
```

**Enforcement:**
- Before `git add`, run: `git status | grep -E "\.env$|\.key$|\.pem$"`
- If anything shows up, DO NOT COMMIT!
- Check `.gitignore` has these patterns

---

## 📁 Project Structure (Know This!)

```
thermal-software/
├── README.md                    # ← Entry point for humans
├── START_HERE.md                # ← THIS FILE (implementation start)
├── PROJECT_INDEX.md             # ← Navigation & rules reference
├── VERSION.md                   # ← Docker versions
├── SETUP.md                     # ← Environment setup
├── .env                         # ← Config (gitignored!)
├── .env.example                 # ← Template (git tracked)
├── compose.yml                  # ← Docker services
├── Makefile                     # ← Commands
│
├── backend/                     # ← CREATE THIS (Phase 1)
├── frontend/                    # ← CREATE THIS (Phase 2)
├── shared/                      # ← Shared types
│
├── legacy/                      # ← Original code (READ-ONLY!)
│   ├── refractory/              # ← Don't modify
│   └── furnaceCombustion/       # ← Don't modify
│
├── docker/                      # ← Docker configs (ready)
│   ├── backend/Dockerfile       # ← Backend container
│   ├── frontend/Dockerfile      # ← Frontend container
│   └── legacy/nginx.conf        # ← Legacy system
│
├── docs/                        # ← All documentation
│   ├── migration/               # ← Migration guides
│   │   ├── DOCKER_FIRST_SETUP.md        # ← Detailed step-by-step
│   │   ├── NESTJS_MIGRATION_SPEC.md     # ← Complete spec
│   │   └── ARCHITECTURE_COMPARISON.md   # ← Before/after
│   ├── ENVIRONMENT_MANAGEMENT.md
│   ├── REPORTS_MANAGEMENT.md
│   └── PARALLEL_DEVELOPMENT_STRATEGY.md
│
└── tmp/reports/                 # ← ALL REPORTS GO HERE!
    ├── calculations/
    ├── migrations/
    ├── performance/
    └── tests/
```

---

## 🎯 Implementation Path (Follow This Order)

### Phase 0: Verification (5 minutes)

**YOU ARE HERE!** ← Current step

```bash
# Verify environment
cat .env | grep JWT_SECRET    # Should NOT be "CHANGE_THIS_SECRET"

# Verify Docker
docker-compose ps             # Should show postgres, redis

# Start databases if not running
docker-compose up -d postgres redis

# Verify databases are healthy
docker-compose ps             # Both should show "healthy"
```

**Output this to report:**
```bash
echo "Phase 0 Verification: $(date)" > tmp/reports/migrations/phase0-verification.log
docker-compose ps >> tmp/reports/migrations/phase0-verification.log
grep JWT_SECRET .env >> tmp/reports/migrations/phase0-verification.log
```

**Checkpoint:** All databases healthy? → Proceed to Phase 1

---

### Phase 1: Create Backend Structure (30 minutes)

**DO NOT use `npx` or `npm` on host!**

**Step 1.1: Create Directory Structure**

```bash
# From project root directory

# Create directories
mkdir -p backend/src
mkdir -p backend/test
```

**Step 1.2: Create package.json**

Open `docs/migration/DOCKER_FIRST_SETUP.md` and copy the complete `package.json` from there.

```bash
# DON'T type it manually! Copy from the guide:
cat docs/migration/DOCKER_FIRST_SETUP.md | grep -A 50 "cat > backend/package.json"
```

Or create it:
```bash
cat > backend/package.json << 'EOF'
{
  "name": "thermal-backend",
  "version": "2.0.0-dev",
  "description": "NestJS Backend API for Thermal Software",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/config": "^3.1.1",
    "@nestjs/swagger": "^7.1.17",
    "@nestjs/typeorm": "^10.0.1",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "bcrypt": "^5.1.1",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "typeorm": "^0.3.19",
    "pg": "^8.11.3",
    "redis": "^4.6.12",
    "reflect-metadata": "^0.2.1",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.0",
    "@nestjs/testing": "^10.3.0",
    "@types/node": "^20.11.5",
    "@types/passport-jwt": "^4.0.0",
    "@types/bcrypt": "^5.0.2",
    "typescript": "^5.3.3"
  }
}
EOF
```

**Step 1.3: Create Configuration Files**

See `docs/migration/DOCKER_FIRST_SETUP.md` for complete files:
- `tsconfig.json`
- `nest-cli.json`
- `.dockerignore`

**Step 1.4: Create Source Files**

See `docs/migration/DOCKER_FIRST_SETUP.md` for:
- `src/main.ts`
- `src/app.module.ts`
- `src/app.controller.ts`
- `src/app.service.ts`

**Step 1.5: Build with Docker**

```bash
# Docker installs everything!
docker-compose up --build -d backend

# Watch logs
docker-compose logs -f backend

# Should see: "Application is running on: http://localhost:4000"
```

**Save logs to report:**
```bash
echo "Phase 1 Backend Build: $(date)" > tmp/reports/migrations/phase1-backend.log
docker-compose logs backend >> tmp/reports/migrations/phase1-backend.log
```

**Verification:**
```bash
# Test backend
curl http://localhost:4000/health
# Should return: {"status":"ok","timestamp":"..."}

# Test Swagger
curl http://localhost:4000/api/docs
# Should return HTML
```

**Checkpoint:** Backend returns health check? → Proceed to Phase 2

---

### Phase 2: Create Frontend Structure (30 minutes)

**Step 2.1: Create Directory Structure**

```bash
# From project root directory

mkdir -p frontend/src
mkdir -p frontend/public
```

**Step 2.2: Create Files**

See `docs/migration/DOCKER_FIRST_SETUP.md` for complete files:
- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `index.html`
- `src/main.tsx`
- `src/App.tsx`
- `.dockerignore`

**Step 2.3: Build with Docker**

```bash
# Docker installs everything!
docker-compose up --build -d frontend

# Watch logs
docker-compose logs -f frontend
```

**Save logs:**
```bash
echo "Phase 2 Frontend Build: $(date)" > tmp/reports/migrations/phase2-frontend.log
docker-compose logs frontend >> tmp/reports/migrations/phase2-frontend.log
```

**Step 2.4: Start Nginx Reverse Proxy**

```bash
# Build and start nginx
docker-compose up --build -d nginx

# Watch logs
docker-compose logs -f nginx
```

**Verification:**
```bash
# Test through nginx proxy
curl http://localhost
# Should return HTML

# Test API through proxy
curl http://localhost/api/v1/health
# Should return health check

# Open browser
# http://localhost (frontend)
# http://localhost/api/docs (swagger)
```

**Checkpoint:** Frontend and API accessible through nginx? → Proceed to Phase 3

---

### Phase 3: Verify Everything Works (10 minutes)

```bash
# Check all services
docker-compose ps

# Should see:
# - thermal-postgres    (healthy)
# - thermal-redis       (healthy)
# - thermal-backend     (running)
# - thermal-frontend    (running)
# - thermal-python      (running)
# - thermal-nginx       (running)
```

**Save status:**
```bash
echo "Phase 3 Verification: $(date)" > tmp/reports/migrations/phase3-verification.log
docker-compose ps >> tmp/reports/migrations/phase3-verification.log
curl http://localhost/api/v1/health >> tmp/reports/migrations/phase3-verification.log
curl http://localhost >> tmp/reports/migrations/phase3-verification.log
```

**Browser Tests:**
1. Open http://localhost - Should show React app
2. Open http://localhost/api/docs - Should show Swagger UI
3. Frontend should connect to API through /api/v1

**Checkpoint:** All 6 services running and accessible through nginx? → Proceed to Phase 4

# Should see:
# - thermal-postgres    (healthy)
# - thermal-redis       (healthy)
# - thermal-backend     (running)
# - thermal-frontend    (running)
```

**Save status:**
```bash
echo "Phase 3 Verification: $(date)" > tmp/reports/migrations/phase3-verification.log
docker-compose ps >> tmp/reports/migrations/phase3-verification.log
curl http://localhost:4000/health >> tmp/reports/migrations/phase3-verification.log
curl http://localhost:3000 >> tmp/reports/migrations/phase3-verification.log
```

**Browser Tests:**
1. Open http://localhost:3000 - Should show React app
2. Open http://localhost:4000/api/docs - Should show Swagger UI
3. Frontend should show "API Status: ok"

**Checkpoint:** All 4 services running and accessible? → Proceed to Phase 4

---

### Phase 4: Implement Features (See Full Spec)

Now follow detailed implementation in:
**`docs/migration/NESTJS_MIGRATION_SPEC.md`**

**Implementation Order (FOLLOW STRICTLY):**

#### Step 4.1: Setup Project Structure & Configuration
```bash
# Inside backend container
docker-compose exec backend sh

# Create configuration structure
mkdir -p src/config
mkdir -p src/common/interfaces
mkdir -p src/common/dto

# Create constants files (NO hardcoded values in code!)
# src/config/constants.ts
# src/config/calculation.constants.ts
# src/config/database.constants.ts

exit
```

#### Step 4.2: Copy & Adapt Legacy Models (SEPARATE STEP!)
**Important:** This is a SEPARATE step before new development.

1. **Copy** working models from `legacy/refractory/`
2. **Adapt** to NestJS structure (entities, DTOs)
3. **Don't modify** logic yet - just structure
4. **Test** that copied models work
5. **Document** what was copied in `tmp/reports/migrations/phase4-legacy-adaptation.log`

```bash
# Document what you're copying
echo "Phase 4.2 Legacy Model Adaptation: $(date)" > tmp/reports/migrations/phase4-legacy-models.log
echo "Models copied from legacy/refractory/:" >> tmp/reports/migrations/phase4-legacy-models.log
# List each model copied
```

#### Step 4.3: Implement with SOLID & OOP Principles

**For EACH feature module:**

**A. Create Structure:**
```
backend/src/modules/[feature]/
├── entities/           # Database entities
├── dto/               # Input/Output DTOs
├── interfaces/        # TypeScript interfaces
├── services/          # Business logic (SOLID)
├── controllers/       # HTTP endpoints (thin)
└── tests/            # Unit & integration tests
```

**B. Write Tests FIRST (TDD):**
```bash
# Inside container
docker-compose exec backend sh

# Create test file FIRST
# src/modules/[feature]/services/[feature].service.spec.ts

# Write test cases
# Then implement service to pass tests

exit
```

**C. Implement Following SOLID:**
- **Services:** Single responsibility, depend on interfaces
- **DTOs:** Validate all inputs with class-validator
- **No hardcoded values:** Use config files
- **Interfaces:** Define contracts between layers

**D. Run Tests:**
```bash
# Test specific module
docker-compose exec backend npm run test -- [feature].service.spec

# Check coverage
docker-compose exec backend npm run test:cov

# Save results
docker-compose exec backend npm run test:cov > tmp/reports/tests/[feature]-coverage-$(date +%Y%m%d).txt
```

**E. Document:**
```bash
echo "Feature [name] implemented: $(date)" >> tmp/reports/migrations/phase4-features.log
echo "Tests: $(docker-compose exec backend npm run test -- [feature] | grep 'Tests:')" >> tmp/reports/migrations/phase4-features.log
```

#### Step 4.4: Feature Implementation Order

1. **Authentication & Authorization** (Section 9)
   - Copy: User models from legacy
   - Adapt: Create UserEntity, DTOs
   - Write: Tests FIRST
   - Implement: Auth service (SOLID)
   - Test: JWT token generation/validation
   - Coverage: ≥80%

2. **Database Design** (Section 8)
   - Copy: Data models from legacy
   - Adapt: TypeORM entities
   - Write: Migration tests
   - Implement: Entities with relations
   - Test: CRUD operations
   - Coverage: ≥80%

3. **API Endpoints** (Section 7)
   - Copy: Calculation logic from legacy
   - Adapt: Services with interfaces
   - Write: Controller tests FIRST
   - Implement: Controllers (thin), Services (thick)
   - Test: E2E tests for all endpoints
   - Coverage: ≥80%

4. **Frontend Integration** (Section 10)
   - Copy: UI logic from legacy
   - Adapt: React components
   - Write: Component tests
   - Implement: API integration
   - Test: User flows
   - Coverage: ≥70%

#### Step 4.5: Test Specification

Create test specification BEFORE implementing:
```bash
# Document test requirements
cat > tmp/reports/migrations/TEST_SPECIFICATION.md << 'EOF'
# Test Specification for Migration

## Unit Tests
- [ ] All services ≥80% coverage
- [ ] All utilities ≥80% coverage
- [ ] DTOs validation tests
- [ ] Configuration tests

## Integration Tests
- [ ] All API endpoints
- [ ] Database operations
- [ ] Authentication flows
- [ ] Error handling

## E2E Tests
- [ ] User registration/login
- [ ] Calculation workflows
- [ ] Data persistence
- [ ] API response formats

## Test Execution
All tests run inside Docker:
`docker-compose exec backend npm run test:cov`
`docker-compose exec frontend npm run test`

Results saved to: tmp/reports/tests/
EOF
```

**Reference:** See `docs/migration/NESTJS_MIGRATION_SPEC.md` for detailed API design and database schema.

---

## 📚 Documentation Reference

**When you need help, check these in order:**

### Quick Reference
1. **THIS FILE (START_HERE.md)** - Overall flow, rules
2. **PROJECT_INDEX.md** - Navigation, all rules
3. **docs/migration/DOCKER_FIRST_SETUP.md** - Complete step-by-step

### Detailed Specs
4. **docs/migration/NESTJS_MIGRATION_SPEC.md** - Full specification
5. **docs/migration/ARCHITECTURE_COMPARISON.md** - Before/after
6. **docs/ENVIRONMENT_MANAGEMENT.md** - .env configuration
7. **docs/REPORTS_MANAGEMENT.md** - Where to save files

### Quick Commands
```bash
# View rules
cat PROJECT_INDEX.md

# View Docker setup guide
cat docs/migration/DOCKER_FIRST_SETUP.md

# View full spec
cat docs/migration/NESTJS_MIGRATION_SPEC.md

# View checklist
cat tmp/reports/READY_FOR_IMPLEMENTATION.md
```

---

## 🔧 Common Commands (Docker-Only)

### Development
```bash
# Start all services
docker-compose up -d

# Rebuild after changes
docker-compose up --build backend

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart service
docker-compose restart backend
```

### Running Commands Inside Containers
```bash
# Access backend shell
docker-compose exec backend sh

# Inside container, you can run:
npm run test
npm run build
npm run lint
nest generate resource users

# Exit container
exit

# Or run directly
docker-compose exec backend npm run test
docker-compose exec backend npm run lint
```

### Database
```bash
# Access database
docker-compose exec postgres psql -U ${DB_USERNAME} -d ${DB_DATABASE}

# Run migrations (inside backend container)
docker-compose exec backend npm run typeorm migration:run

# Generate migration
docker-compose exec backend npm run typeorm migration:generate -- -n CreateUsers
```

---

## ⚠️ Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs backend | tail -50

# Common fixes:
# 1. Database not ready
docker-compose ps postgres  # Must be "healthy"

# 2. Port in use
lsof -i :4000  # On host
docker-compose down && docker-compose up -d

# 3. Rebuild
docker-compose up --build backend
```

### Frontend won't build
```bash
# Check logs
docker-compose logs frontend | tail -50

# Rebuild from scratch
docker-compose down
docker-compose up --build frontend
```

### "I need to run npm command"
```bash
# ALWAYS prefix with docker-compose exec
docker-compose exec backend npm run [command]
docker-compose exec frontend npm run [command]

# Or access shell first
docker-compose exec backend sh
npm run [command]
exit
```

---

## ✅ Success Criteria

### Basic Setup (Phase 0-3)
- [ ] Backend running (internal port 4000)
- [ ] Frontend running (internal port 80)
- [ ] Nginx proxy running on http://localhost:80
- [ ] API accessible at http://localhost/api/v1
- [ ] Frontend accessible at http://localhost
- [ ] Swagger docs at http://localhost/api/docs
- [ ] All 6 Docker services healthy (postgres, redis, backend, frontend, python, nginx)
- [ ] NO `node_modules/` on host machine
- [ ] All logs saved to `tmp/reports/migrations/`
- [ ] NO secrets in git (verify with `git status`)

### Code Quality (Phase 4)
- [ ] NO hardcoded values (all in config files)
- [ ] All inputs use DTOs with validation
- [ ] Services follow SOLID principles
- [ ] Clear OOP structure (entities, services, controllers)
- [ ] Test coverage ≥80% for services
- [ ] Test coverage ≥80% for utilities
- [ ] Integration tests for all endpoints
- [ ] Test results saved to `tmp/reports/tests/`
- [ ] Python scripts run inside Docker (NO python on host)

---

## 🚨 Emergency Stop

If something goes wrong and you need to reset:

```bash
# Stop everything
docker-compose down

# Remove all volumes (⚠️ deletes database data!)
docker-compose down -v

# Remove all containers
docker rm -f $(docker ps -aq)

# Start fresh
docker-compose up --build
```

---

## 📊 Progress Tracking

Save your progress to reports:

```bash
# After each phase
echo "Phase [N] Complete: $(date)" >> tmp/reports/migrations/progress.log
docker-compose ps >> tmp/reports/migrations/progress.log
echo "---" >> tmp/reports/migrations/progress.log
```

---

## 🎯 Summary: What Makes This the Starting Point?

1. **Single Entry Point** - You don't need to read 10 files to start
2. **Enforces All Rules** - Docker-only, reports location, secrets
3. **Clear Path** - Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4
4. **Checkpoints** - Verify each phase before proceeding
5. **Troubleshooting** - Common issues and fixes
6. **References** - Links to detailed docs when needed

**When someone says "implement migration":**
→ Point them to **THIS FILE** (START_HERE.md)
→ They follow it step-by-step
→ All rules are enforced automatically
→ They know where to look for more details

---

**Ready? Start with Phase 0 verification above!** 🚀

**Questions?** Check PROJECT_INDEX.md or docs/migration/DOCKER_FIRST_SETUP.md

