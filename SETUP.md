# Quick Setup Guide

## 🚀 First Time Setup

### 1. Create Environment File
```bash
# Copy template to .env
make setup

# This creates .env from .env.example
```

### 2. Edit Environment Variables
```bash
# Edit .env file
vim .env
# or
nano .env
```

**Required changes:**
- ✅ `DB_PASSWORD` - Change from default
- ✅ `JWT_SECRET` - Generate: `openssl rand -base64 32`
- ✅ `JWT_REFRESH_SECRET` - Generate: `openssl rand -base64 32`

### 3. Start Services
```bash
# Start all services
make up
```

---

## 📝 Environment File (.env)

### ⚠️ Important
- **NEVER commit `.env` to git!**
- `.env` is gitignored for security
- Only `.env.example` and `.env.production` are tracked in git

### Template Files
| File | Purpose | Git Tracked |
|------|---------|-------------|
| `.env.example` | Development template | ✅ Yes |
| `.env.production` | Production template | ✅ Yes |
| `.env` | Your active config | ❌ No (gitignored) |

---

## 🔧 Latest Stable Versions (Verified Feb 1, 2026)

The `.env.example` is configured with latest stable versions:

```bash
# PostgreSQL 18.1 (verified Feb 1, 2026)
POSTGRES_VERSION=18.1-alpine

# Redis 8.4 (verified Feb 1, 2026)
REDIS_VERSION=8.4-alpine

# Nginx 1.28.1 (verified Feb 1, 2026)
NGINX_VERSION=1.28.1-alpine

# Node.js 24.13.0 LTS "Iron" (verified Feb 1, 2026)
NODE_VERSION=24.13.0-alpine
```

---

## 🔒 Generate Secure Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate refresh secret
openssl rand -base64 32

# Generate database password
openssl rand -base64 24
```

Copy the output and paste into your `.env` file.

---

## ✅ Verification

```bash
# Check .env exists
ls -la .env

# View .env (check your values)
cat .env

# Start services
make up

# Check running containers
docker ps
```

---

## 🎯 Common Commands

```bash
# Initial setup
make setup          # Create .env from template

# Start/stop
make up             # Start all services
make down           # Stop all services
make restart        # Restart all services

# Logs
make logs           # View all logs

# Development
make dev            # Start dev watch mode
make build          # Build TypeScript
make test           # Run tests
```

---

## 🆘 Troubleshooting

### Error: ".env file not found"
```bash
# Solution:
make setup
# Then edit .env and run:
make up
```

### Error: "Permission denied"
```bash
# Solution:
chmod +x scripts/restructure-project.sh
```

### Want to reset .env?
```bash
# Backup current
cp .env .env.backup

# Create fresh from template
make setup
```

---

## 📚 More Information

- Full documentation: `/docs/ENVIRONMENT_MANAGEMENT.md`
- Version tracking: `/VERSION.md`
- Migration guide: `/docs/PARALLEL_DEVELOPMENT_STRATEGY.md`

---

**Ready? Run `make setup` to begin!** 🚀

