#!/bin/bash
# Verify Migration Setup - Security & Docker-First Approach
# This script verifies that secrets are protected and Docker setup is correct

set -e

# Get project root dynamically
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

PASSED=0
FAILED=0

echo "🔍 Thermal Software - Migration Setup Verification"
echo "=================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# ==========================================
# 1. Check Secrets Protection
# ==========================================

echo "1️⃣  Checking Secrets Protection..."
echo ""

# Check .env is gitignored
if git check-ignore .env >/dev/null 2>&1; then
    pass ".env is gitignored"
else
    fail ".env is NOT gitignored - SECURITY RISK!"
fi

# Check .env is not tracked
if git ls-files | grep -q "^\.env$"; then
    fail ".env is tracked in git - REMOVE IT!"
else
    pass ".env is not tracked in git"
fi

# Check certificates are gitignored
if grep -q "^\*\.pem$" .gitignore && grep -q "^\*\.key$" .gitignore; then
    pass "Certificates (*.pem, *.key) are gitignored"
else
    fail "Certificates not properly gitignored"
fi

# Check secrets/ directory is gitignored
if grep -q "^secrets/$" .gitignore; then
    pass "secrets/ directory is gitignored"
else
    fail "secrets/ directory not gitignored"
fi

# Check no .env file is tracked
ENV_TRACKED=$(git ls-files | grep -E "\.env$" | grep -v "\.env\.example\|\.env\.production" || true)
if [ -z "$ENV_TRACKED" ]; then
    pass "No .env files tracked in git (except templates)"
else
    fail "Found tracked .env files: $ENV_TRACKED"
fi

echo ""

# ==========================================
# 2. Check Docker Configuration
# ==========================================

echo "2️⃣  Checking Docker Configuration..."
echo ""

# Check backend Dockerfile exists
if [ -f "docker/backend/Dockerfile" ]; then
    pass "Backend Dockerfile exists"

    # Check for npm ci
    if grep -q "npm ci" docker/backend/Dockerfile; then
        pass "Backend Dockerfile uses 'npm ci'"
    else
        fail "Backend Dockerfile missing 'npm ci'"
    fi

    # Check for multi-stage build
    if grep -q "AS builder" docker/backend/Dockerfile; then
        pass "Backend Dockerfile uses multi-stage build"
    else
        fail "Backend Dockerfile not using multi-stage build"
    fi
else
    fail "Backend Dockerfile missing"
fi

# Check frontend Dockerfile exists
if [ -f "docker/frontend/Dockerfile" ]; then
    pass "Frontend Dockerfile exists"

    # Check for npm ci
    if grep -q "npm ci" docker/frontend/Dockerfile; then
        pass "Frontend Dockerfile uses 'npm ci'"
    else
        fail "Frontend Dockerfile missing 'npm ci'"
    fi

    # Check for multi-stage build
    if grep -q "AS builder" docker/frontend/Dockerfile; then
        pass "Frontend Dockerfile uses multi-stage build"
    else
        fail "Frontend Dockerfile not using multi-stage build"
    fi
else
    fail "Frontend Dockerfile missing"
fi

# Check compose.yml exists
if [ -f "compose.yml" ]; then
    pass "compose.yml exists"
else
    fail "compose.yml missing"
fi

echo ""

# ==========================================
# 3. Check Documentation
# ==========================================

echo "3️⃣  Checking Documentation..."
echo ""

# Check Docker-first setup guide
if [ -f "docs/migration/DOCKER_FIRST_SETUP.md" ]; then
    pass "Docker-first setup guide exists"
else
    fail "Docker-first setup guide missing"
fi

# Check PROJECT_INDEX.md
if [ -f "PROJECT_INDEX.md" ]; then
    pass "PROJECT_INDEX.md exists"

    # Check for Docker-first mention
    if grep -q "Docker-first" PROJECT_INDEX.md || grep -q "DOCKER_FIRST" PROJECT_INDEX.md; then
        pass "PROJECT_INDEX.md mentions Docker-first approach"
    else
        warn "PROJECT_INDEX.md doesn't mention Docker-first approach"
    fi
else
    fail "PROJECT_INDEX.md missing"
fi

# Check migration docs exist
for doc in NESTJS_MIGRATION_SPEC.md NESTJS_QUICK_START.md ARCHITECTURE_COMPARISON.md MIGRATION_INDEX.md; do
    if [ -f "docs/migration/$doc" ]; then
        pass "Migration doc: $doc exists"
    else
        fail "Migration doc: $doc missing"
    fi
done

echo ""

# ==========================================
# 4. Check Reports Structure
# ==========================================

echo "4️⃣  Checking Reports Structure..."
echo ""

# Check tmp/reports exists
if [ -d "tmp/reports" ]; then
    pass "tmp/reports directory exists"
else
    fail "tmp/reports directory missing"
fi

# Check subdirectories exist
for dir in calculations migrations performance tests; do
    if [ -d "tmp/reports/$dir" ]; then
        pass "tmp/reports/$dir exists"
    else
        fail "tmp/reports/$dir missing"
    fi
done

# Check .gitkeep files exist
for dir in calculations migrations performance tests; do
    if [ -f "tmp/reports/$dir/.gitkeep" ]; then
        pass "tmp/reports/$dir/.gitkeep exists"
    else
        fail "tmp/reports/$dir/.gitkeep missing"
    fi
done

# Check README exists
if [ -f "tmp/reports/README.md" ]; then
    pass "tmp/reports/README.md exists"

    # Check for "ALL reports" requirement
    if grep -qi "ALL.*reports.*MUST" tmp/reports/README.md; then
        pass "Reports README emphasizes ALL reports requirement"
    else
        warn "Reports README doesn't emphasize requirement"
    fi
else
    fail "tmp/reports/README.md missing"
fi

echo ""

# ==========================================
# 5. Check Environment Files
# ==========================================

echo "5️⃣  Checking Environment Files..."
echo ""

# Check .env.example exists
if [ -f ".env.example" ]; then
    pass ".env.example exists"
else
    fail ".env.example missing"
fi

# Check .env.production exists
if [ -f ".env.production" ]; then
    pass ".env.production exists"
else
    fail ".env.production missing"
fi

# Check .env exists
if [ -f ".env" ]; then
    pass ".env file exists"

    # Check for secure JWT secret
    if grep -q "JWT_SECRET=CHANGE_THIS" .env; then
        fail ".env has default JWT_SECRET - CHANGE IT!"
    elif grep -q "JWT_SECRET=" .env; then
        pass ".env has JWT_SECRET configured"
    else
        warn ".env missing JWT_SECRET"
    fi
else
    warn ".env file not created yet (run: make setup)"
fi

echo ""

# ==========================================
# Summary
# ==========================================

echo "=================================================="
echo "📊 Verification Summary"
echo "=================================================="
echo ""
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${RED}Failed:${NC} $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Setup is correct.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please fix the issues above.${NC}"
    exit 1
fi

