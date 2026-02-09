# Environment-Only Configuration Policy

**Date:** February 1, 2026  
**Policy:** ALL configuration MUST come from .env files  
**Status:** Enforced

---

## Policy Statement

**NO default values in Docker files or compose.yml**

All configuration values MUST be defined in `.env` files:
- `.env` - Active configuration (gitignored)
- `.env.example` - Template with all variables
- `.env.production` - Production template

---

## Why This Policy

### ❌ Problems with Defaults in Dockerfiles/Compose

**Before (Wrong):**
```dockerfile
FROM node:${NODE_VERSION:-24.13.0-alpine}
EXPOSE ${BACKEND_PORT:-4000}
```

```yaml
environment:
  DB_HOST: ${DB_HOST:-postgres}
  DB_PORT: ${DB_PORT:-5432}
```

**Problems:**
1. **Configuration scattered** - Some in .env, some in Docker files
2. **Hard to find values** - Need to check multiple files
3. **Inconsistent defaults** - May differ between files
4. **Hidden configuration** - Defaults not obvious
5. **Hard to audit** - Can't see all config in one place

### ✅ Solution: .env Only

**After (Correct):**
```dockerfile
ARG NODE_VERSION
FROM node:${NODE_VERSION}
ARG BACKEND_PORT
EXPOSE ${BACKEND_PORT}
```

```yaml
environment:
  DB_HOST: ${DB_HOST}
  DB_PORT: ${DB_PORT}
```

**.env:**
```bash
NODE_VERSION=24.13.0-alpine
BACKEND_PORT=4000
DB_HOST=postgres
DB_PORT=5432
```

**Benefits:**
1. ✅ **Single source of truth** - All config in .env
2. ✅ **Easy to find** - One file to check
3. ✅ **Consistent** - Same values everywhere
4. ✅ **Transparent** - All config visible
5. ✅ **Easy to audit** - Review one file

---

## Implementation

### Files Updated

**1. compose.yml**
- ❌ Removed: All `${VAR:-default}` patterns
- ✅ Now: Only `${VAR}` - value MUST come from .env

**2. docker/backend/Dockerfile**
- ❌ Removed: `FROM node:${NODE_VERSION:-24.13.0-alpine}`
- ✅ Now: `FROM node:${NODE_VERSION}`
- ❌ Removed: `EXPOSE ${BACKEND_PORT:-4000}`
- ✅ Now: `EXPOSE ${BACKEND_PORT}`

**3. docker/frontend/Dockerfile**
- ❌ Removed: All default values
- ✅ Now: All from build args (which come from .env)

**4. docker/nginx/Dockerfile**
- ❌ Removed: `FROM nginx:${NGINX_VERSION:-1.28.1-alpine}`
- ✅ Now: `FROM nginx:${NGINX_VERSION}`

**5. .env.example**
- ✅ Created: Complete template with ALL variables
- ✅ Documented: Each variable explained
- ✅ Organized: Grouped by service

**6. .env.production**
- ✅ Created: Production template
- ✅ Security notes: Which values to change

---

## ALL Configuration Variables

### Application
```bash
NODE_ENV=development
APP_VERSION=2.0.0-dev
API_VERSION=v1
```

### Database
```bash
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=thermal
DB_PASSWORD=CHANGE_THIS
DB_DATABASE=thermal
```

### Cache
```bash
REDIS_HOST=redis
REDIS_PORT=6379
```

### Security
```bash
JWT_SECRET=CHANGE_THIS
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=CHANGE_THIS
JWT_REFRESH_EXPIRES_IN=7d
```

### Ports
```bash
HTTP_PORT=80
HTTPS_PORT=443
BACKEND_PORT=4000
FRONTEND_PORT=80
```

### API
```bash
VITE_API_URL=/api/v1
```

### Docker Images
```bash
POSTGRES_VERSION=18.1-alpine
REDIS_VERSION=8.4-alpine
NODE_VERSION=24.13.0-alpine
NGINX_VERSION=1.28.1-alpine
PYTHON_VERSION=3.14.3-slim
PYTHON_VERSION_NUMBER=3.14
```

**Total:** 23 configuration variables

---

## Verification

### Check for Defaults in Docker Files

```bash
# Should find NO default values (:-) in these files
grep -r ":-" docker/ compose.yml

# If any found, they must be removed!
```

### Check .env.example is Complete

```bash
# Count variables in .env.example
grep -c "=" .env.example

# Should be 23 (or more if added)
```

### Verify .env Exists

```bash
# Check .env file
ls .env || echo "ERROR: Run 'make setup' to create .env from .env.example"

# Verify it has all variables
comm -23 <(grep "^[A-Z]" .env.example | cut -d= -f1 | sort) \
         <(grep "^[A-Z]" .env | cut -d= -f1 | sort)

# Should output NOTHING (no missing variables)
```

---

## Developer Workflow

### 1. Initial Setup

```bash
# Create .env from template
make setup

# Or manually
cp .env.example .env

# Edit values
vim .env
```

### 2. Add New Configuration

**When adding a new config variable:**

1. **Add to .env.example** (with description)
```bash
# New Service Configuration
NEW_SERVICE_PORT=8080
NEW_SERVICE_HOST=newservice
```

2. **Add to .env.production** (production value)
```bash
NEW_SERVICE_PORT=8080
NEW_SERVICE_HOST=newservice
```

3. **Update docker files** (NO defaults!)
```yaml
environment:
  NEW_SERVICE_PORT: ${NEW_SERVICE_PORT}  # ✅ No :-default
```

4. **Update this document** (add to list)

5. **Test**
```bash
# Remove variable from .env temporarily
# Docker should fail with clear error
docker-compose up

# Should show: WARNING: The NEW_SERVICE_PORT variable is not set
```

### 3. Environment-Specific Values

**Development (.env):**
```bash
NODE_ENV=development
DB_PASSWORD=dev_password
```

**Production (.env):**
```bash
NODE_ENV=production
DB_PASSWORD=Strong_Pr0duction_P@ssw0rd
```

---

## Rules

### ✅ DO:
1. Define ALL config in .env files
2. Use .env.example as template
3. Document each variable
4. Keep .env.example up to date
5. Test that missing env vars cause clear errors

### ❌ DON'T:
1. Add defaults to Dockerfiles (NO `:-default`)
2. Add defaults to compose.yml (NO `:-default`)
3. Hardcode values in source code
4. Commit .env to git
5. Leave .env.example incomplete

---

## Error Handling

### Missing Variable Error

**If variable not in .env:**
```bash
docker-compose up

# Shows:
WARNING: The NODE_VERSION variable is not set. Defaulting to a blank string.
ERROR: Missing mandatory value for "NODE_VERSION": ...
```

**Fix:**
1. Check .env.example for correct value
2. Add to .env
3. Try again

### Wrong Value Error

**If value is incorrect:**
```bash
docker-compose up
# Container fails to start
docker-compose logs service_name
# Check logs for error
```

**Fix:**
1. Check .env value
2. Correct it
3. Rebuild: `docker-compose up --build`

---

## Auditing Configuration

### View All Current Config

```bash
# Show all variables (sorted)
cat .env | grep "^[A-Z]" | sort

# Or with values hidden
cat .env | grep "^[A-Z]" | sed 's/=.*/=***/' | sort
```

### Compare Environments

```bash
# Development vs Example
diff .env .env.example

# Development vs Production
diff .env .env.production
```

### Security Audit

```bash
# Check for default/weak passwords
grep -i "CHANGE_THIS" .env && echo "⚠️  Update passwords!"

# Check for weak secrets
grep -E "(secret|password)=.{0,10}$" .env && echo "⚠️  Weak secrets!"
```

---

## Summary

### Enforcement

| Item | Before | After |
|------|--------|-------|
| **Dockerfiles** | Had `:-defaults` | ✅ No defaults |
| **compose.yml** | Had `:-defaults` | ✅ No defaults |
| **.env.example** | Incomplete | ✅ All 23 variables |
| **.env.production** | Incomplete | ✅ All variables |
| **Configuration** | Scattered | ✅ Single source (.env) |

### Benefits

1. ✅ **Single source of truth** - .env files only
2. ✅ **Easy to audit** - One file to review
3. ✅ **Clear errors** - Missing vars cause immediate failure
4. ✅ **Portable** - Same compose.yml works everywhere
5. ✅ **Secure** - All secrets in .env (gitignored)

### Rule

> **ALL configuration MUST come from .env files**
> 
> **NO defaults in Docker files or compose.yml**

---

**This policy is now enforced across the entire project!**

All configuration is transparent, auditable, and centralized in .env files.
