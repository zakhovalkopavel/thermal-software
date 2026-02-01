# Production Secrets Management

**Date:** February 1, 2026  
**Purpose:** Generate and manage JWT secrets in production environments  
**Method:** Using Docker containers (no OpenSSL required on host)

---

## Overview

Secure secrets (JWT tokens, database passwords) must be generated using cryptographically secure methods. This guide shows how to generate secrets:

1. **During setup** (development)
2. **In production** (deployed containers)
3. **For rotation** (security best practice)

---

## Development: Initial Setup

### Step 1: Create .env File

```bash
make setup
```

This creates `.env` from `.env.example` template.

### Step 2: Generate Secure Secrets

```bash
make setup-secrets
```

**What it does:**
- Uses `alpine/openssl` Docker image (no OpenSSL install needed on host)
- Generates `JWT_SECRET` (32 bytes, base64)
- Generates `JWT_REFRESH_SECRET` (32 bytes, base64)
- Generates `DB_PASSWORD` (24 bytes, base64)
- Automatically updates `.env` file
- Creates backup (`.env.bak`)

**Output:**
```
🔐 Generating secure JWT secrets using OpenSSL...

Generating JWT_SECRET...
✅ JWT_SECRET generated

Generating JWT_REFRESH_SECRET...
✅ JWT_REFRESH_SECRET generated

Generating secure DB_PASSWORD...
✅ DB_PASSWORD generated

✅ All secrets generated and saved to .env

📝 Secrets have been set in .env file
⚠️  DO NOT commit .env to git!

🚀 Next step: make up
```

### Step 3: Verify Secrets

```bash
# Check no default values remain
grep "CHANGE_THIS" .env

# Should return nothing (no matches)
```

### Step 4: Start Services

```bash
make up
```

---

## Production: Generate Secrets

### Method 1: Using Make Command (Recommended)

On production server:

```bash
# SSH into production server
ssh user@production-server

# Navigate to project
cd /path/to/thermal-software

# Generate secrets (display only)
make generate-jwt
```

**Output:**
```
🔐 Generating new JWT secrets...

JWT_SECRET:
AbCdEf1234567890RANDOM_SECRET_HERE==

JWT_REFRESH_SECRET:
XyZ9876543210ANOTHER_SECRET_HERE==

DB_PASSWORD:
Secure_Password_123==
```

**Then manually update .env:**
```bash
vim .env
# Paste the secrets
# Save and exit

# Restart backend to apply
docker-compose restart backend
```

---

### Method 2: Using Script (Interactive)

```bash
# SSH into production
ssh user@production-server

# Navigate to project
cd /path/to/thermal-software

# Run interactive script
./scripts/generate-production-secrets.sh
```

**Options:**
1. Generate and display secrets
2. Generate using running backend container
3. Update .env automatically (with backup)

**Example session:**
```
═══════════════════════════════════════════════════════════
JWT Secrets Generator - Production Environment
═══════════════════════════════════════════════════════════

─────────────────────────────────────────────────────────────
Option 1: Generate secrets (display only)
─────────────────────────────────────────────────────────────

Generate new secrets? (y/N): y

Generating secrets using alpine/openssl container...

─────────────────────────────────────────────────────────────
Generated Secrets:
─────────────────────────────────────────────────────────────

JWT_SECRET=AbCdEf1234567890...
JWT_REFRESH_SECRET=XyZ9876543210...
DB_PASSWORD=Secure_Password_123...

Update .env file with these secrets? (y/N): y
✅ Backup created: .env.backup.20260201_143022
✅ .env file updated with new secrets

⚠️  Services must be restarted for changes to take effect:
   docker-compose restart backend
```

---

### Method 3: Inside Running Container (SSH)

If containers are already running from Docker registry:

```bash
# SSH into production server
ssh user@production-server

# Generate using backend container
docker exec thermal-backend sh -c "openssl rand -base64 32"

# Output: AbCdEf1234567890RANDOM_SECRET==

# Copy this value and update .env manually
vim .env
```

**Why this works:**
- `thermal-backend` container has OpenSSL installed
- No need to pull additional images
- Works with containers from Docker registry

---

## Production: Remote Secret Generation

### Via SSH Command (Non-Interactive)

Generate secrets without logging in:

```bash
# From local machine, execute on production
ssh user@production-server "cd /path/to/thermal-software && docker exec thermal-backend sh -c 'openssl rand -base64 32'"

# Output: AbCdEf1234567890RANDOM_SECRET==
```

### Using Script Over SSH

```bash
# Execute script remotely
ssh user@production-server << 'EOF'
cd /path/to/thermal-software
./scripts/generate-production-secrets.sh
EOF
```

---

## Token Rotation (Security Best Practice)

JWT tokens should be rotated periodically (e.g., every 90 days).

### Rotation Process

**Step 1: Generate New Secrets**

```bash
# On production server
make generate-jwt > new-secrets.txt

# Or
./scripts/generate-production-secrets.sh
```

**Step 2: Update .env with New Secrets**

```bash
# Backup current .env
cp .env .env.backup.$(date +%Y%m%d)

# Update with new secrets
vim .env
# Replace JWT_SECRET and JWT_REFRESH_SECRET
```

**Step 3: Restart Backend**

```bash
docker-compose restart backend
```

**Step 4: Invalidate Old Tokens**

All existing JWT tokens will be invalidated. Users must re-login.

**Step 5: Update Logs**

```bash
echo "Token rotation completed: $(date)" >> tmp/reports/security/token-rotation.log
```

---

## Security Considerations

### DO:
✅ Use `make setup-secrets` for automatic generation  
✅ Generate secrets using `alpine/openssl` container  
✅ Rotate JWT secrets every 90 days  
✅ Keep backup of `.env` files (encrypted)  
✅ Use different secrets for dev/staging/production  
✅ Store production secrets in secure vault (e.g., HashiCorp Vault)  

### DON'T:
❌ Commit `.env` to git  
❌ Share secrets via email/chat  
❌ Use same secrets across environments  
❌ Use weak/predictable secrets  
❌ Store secrets in Docker images  
❌ Log secrets in application logs  

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          JWT_REFRESH_SECRET: ${{ secrets.JWT_REFRESH_SECRET }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
        run: |
          # SSH and update .env
          ssh user@server << EOF
            cd /path/to/thermal-software
            
            # Update secrets from GitHub Secrets
            sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
            sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}|" .env
            sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=${DB_PASSWORD}|" .env
            
            # Restart services
            docker-compose restart backend
          EOF
```

---

## Verification

### Check Secrets are Strong

```bash
# JWT_SECRET should be 44+ characters (32 bytes base64)
grep "JWT_SECRET=" .env | wc -c
# Should show: 60+ (including variable name)

# Should NOT contain default values
grep "CHANGE_THIS" .env
# Should return nothing
```

### Test Secrets Work

```bash
# Start services
docker-compose up -d

# Check backend can start with secrets
docker-compose logs backend | grep "Application is running"

# Test JWT generation
curl -X POST http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# Should return JWT token
```

---

## Troubleshooting

### Error: "alpine/openssl: not found"

**Solution:**
```bash
# Pull image manually
docker pull alpine/openssl

# Or use backend container instead
docker exec thermal-backend sh -c "openssl rand -base64 32"
```

### Error: "container not running"

**Solution:**
```bash
# Start services first
docker-compose up -d backend

# Then generate
docker exec thermal-backend sh -c "openssl rand -base64 32"
```

### Secrets Not Applied After Update

**Solution:**
```bash
# Restart backend to reload .env
docker-compose restart backend

# Or full restart
docker-compose down
docker-compose up -d
```

---

## Summary

### Development Setup
```bash
make setup           # Create .env
make setup-secrets   # Generate secrets automatically
make up             # Start services
```

### Production Setup
```bash
# Option 1: Make command
make generate-jwt > secrets.txt
vim .env  # Paste secrets
docker-compose restart backend

# Option 2: Script
./scripts/generate-production-secrets.sh

# Option 3: Inside container
docker exec thermal-backend sh -c "openssl rand -base64 32"
```

### Token Rotation
```bash
make generate-jwt              # Generate new secrets
vim .env                       # Update secrets
docker-compose restart backend # Apply changes
```

---

**All secret generation uses Docker containers - no OpenSSL install required on host!**

This works for:
- Development machines
- Production servers
- CI/CD pipelines
- Remote SSH access

Secrets are cryptographically secure (32 bytes random, base64 encoded).

