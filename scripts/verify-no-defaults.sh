#!/bin/bash
# Verify no default values in Docker files and compose.yml
set -e
echo "🔍 Verifying no default values in configuration files..."
echo ""
ERRORS=0
# Check for :- patterns (default values)
echo "Checking for default value patterns (:-) ..."
if grep -r ":-" docker/ compose.yml 2>/dev/null; then
    echo "❌ ERROR: Found default values in Docker files!"
    echo "   All values must come from .env files"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ No default values found in Docker files"
fi
echo ""
# Check .env.example has all required variables
echo "Checking .env.example completeness..."
REQUIRED_VARS=(
    "NODE_ENV"
    "APP_VERSION"
    "API_VERSION"
    "DB_HOST"
    "DB_PORT"
    "DB_USERNAME"
    "DB_PASSWORD"
    "DB_DATABASE"
    "REDIS_HOST"
    "REDIS_PORT"
    "JWT_SECRET"
    "JWT_EXPIRES_IN"
    "JWT_REFRESH_SECRET"
    "JWT_REFRESH_EXPIRES_IN"
    "HTTP_PORT"
    "HTTPS_PORT"
    "BACKEND_PORT"
    "FRONTEND_PORT"
    "VITE_API_URL"
    "POSTGRES_VERSION"
    "REDIS_VERSION"
    "NODE_VERSION"
    "NGINX_VERSION"
    "PYTHON_VERSION"
)
for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" .env.example; then
        echo "❌ ERROR: ${var} not found in .env.example"
        ERRORS=$((ERRORS + 1))
    fi
done
if [ $ERRORS -eq 0 ]; then
    echo "✅ All ${#REQUIRED_VARS[@]} required variables in .env.example"
fi
echo ""
# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  WARNING: .env file not found"
    echo "   Run: make setup (or cp .env.example .env)"
else
    echo "✅ .env file exists"
    # Check for default passwords
    if grep -q "CHANGE_THIS" .env; then
        echo "⚠️  WARNING: Default passwords found in .env"
        echo "   Update: JWT_SECRET, JWT_REFRESH_SECRET, DB_PASSWORD"
    else
        echo "✅ No default passwords in .env"
    fi
fi
echo ""
echo "═══════════════════════════════════════"
if [ $ERRORS -eq 0 ]; then
    echo "✅ VERIFICATION PASSED"
    echo "═══════════════════════════════════════"
    exit 0
else
    echo "❌ VERIFICATION FAILED: ${ERRORS} error(s)"
    echo "═══════════════════════════════════════"
    exit 1
fi
