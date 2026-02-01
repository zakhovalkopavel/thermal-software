# Docker Build and Push to Registry

**Date:** February 1, 2026  
**Purpose:** Build Docker images and push to private registry (Docker Hub)  
**Version:** Automatic versioning with timestamps

---

## Overview

This system builds production-ready Docker images and pushes them to a private Docker registry (Docker Hub or private registry). Each build is versioned and can be deployed to production.

---

## Quick Start

### 1. Configure Registry

Edit `.env`:
```bash
# Docker Registry Configuration
DOCKER_REGISTRY=docker.io
DOCKER_USERNAME=yourcompany
DOCKER_PASSWORD=your_docker_hub_access_token
IMAGE_PREFIX=thermal
```

**For Docker Hub:**
1. Go to https://hub.docker.com/settings/security
2. Create Access Token
3. Use token as `DOCKER_PASSWORD`

### 2. Build and Push

```bash
# Build and push all images (complete workflow)
make deploy-build

# Or step-by-step:
make build-images  # Build locally
make push-images   # Push to registry
```

### 3. Deploy to Production

```bash
# SSH into production server
ssh user@production-server

# Pull images
docker-compose pull

# Restart services
docker-compose up -d
```

---

## Make Commands

### Build Commands

```bash
# Build all images (no push)
make build-images

# Build specific version
make build-version VERSION=1.0.0

# Build and push (complete workflow)
make deploy-build
```

### Push Commands

```bash
# Push images to registry (must build first)
make push-images
```

---

## Script Usage

### Basic Usage

```bash
./scripts/build-and-push.sh
```

**This will:**
1. Check prerequisites (.env, Docker)
2. Login to Docker registry
3. Build backend, frontend, nginx images
4. Tag with version and 'latest'
5. Push to registry
6. Save build info to `tmp/reports/builds/`

### With Options

```bash
# Skip login (already logged in)
./scripts/build-and-push.sh --skip-login

# Only build (no push)
./scripts/build-and-push.sh --skip-push

# Only push (already built)
./scripts/build-and-push.sh --skip-build

# Specific version
./scripts/build-and-push.sh --version 1.0.0

# Help
./scripts/build-and-push.sh --help
```

---

## Versioning

### Automatic Versioning

By default, version is auto-generated using timestamp:

```
Format: YYYYMMDD-HHMMSS
Example: 20260201-143022
```

### Manual Versioning

Set version in `.env`:
```bash
VERSION=1.0.0
```

Or use command line:
```bash
./scripts/build-and-push.sh --version 1.0.0
make build-version VERSION=1.0.0
```

### Version Tags

Each build creates two tags:
- `thermal-backend:1.0.0` (specific version)
- `thermal-backend:latest` (always latest)

---

## Registry Configuration

### Docker Hub (Recommended for Start)

**Setup:**
1. Create account at https://hub.docker.com
2. Create access token (not password!)
3. Configure `.env`:

```bash
DOCKER_REGISTRY=docker.io
DOCKER_USERNAME=yourcompany
DOCKER_PASSWORD=dckr_pat_xxxxxxxxxxxxxxxxxxxx
IMAGE_PREFIX=thermal
```

**Images will be:**
```
docker.io/yourcompany/thermal-backend:1.0.0
docker.io/yourcompany/thermal-frontend:1.0.0
docker.io/yourcompany/thermal-nginx:1.0.0
```

**Public or Private:**
- Free account: 1 private repository
- Pro account: Unlimited private repositories
- Create repository at https://hub.docker.com/repository/create

---

### Private Registry (Self-Hosted)

**Setup:**
```bash
DOCKER_REGISTRY=registry.yourcompany.com:5000
DOCKER_USERNAME=admin
DOCKER_PASSWORD=your_password
IMAGE_PREFIX=thermal
```

**Run private registry:**
```bash
docker run -d \
  -p 5000:5000 \
  --name registry \
  -v /mnt/registry:/var/lib/registry \
  registry:2
```

---

## Build Process

### What Gets Built

1. **Backend** (`thermal-backend`)
   - Dockerfile: `docker/backend/Dockerfile`
   - Context: `backend/`
   - Multi-stage build (builder + production)

2. **Frontend** (`thermal-frontend`)
   - Dockerfile: `docker/frontend/Dockerfile`
   - Context: `frontend/`
   - Vite build + Nginx serve

3. **Nginx** (`thermal-nginx`)
   - Dockerfile: `docker/nginx/Dockerfile`
   - Context: `docker/nginx/`
   - Reverse proxy configuration

### Build Arguments

From `.env` file:
```bash
NODE_VERSION=24.13.0-alpine
NGINX_VERSION=1.28.1-alpine
BACKEND_PORT=4000
FRONTEND_PORT=80
VITE_API_URL=/api/v1
```

These are passed as build args automatically.

---

## Complete Workflow

### Development to Production

**1. Development**
```bash
# Setup
make setup
make setup-secrets
make up

# Develop...
# Test...
```

**2. Build for Production**
```bash
# Set version
export VERSION=1.0.0
# Or edit .env: VERSION=1.0.0

# Build and push
make deploy-build
```

**Output:**
```
═══════════════════════════════════════════════════════════
Docker Build and Push - Thermal Software
═══════════════════════════════════════════════════════════

Registry: docker.io
Username: yourcompany
Version: 1.0.0

═══════════════════════════════════════════════════════════
Building backend image
═══════════════════════════════════════════════════════════
✅ Built backend image

═══════════════════════════════════════════════════════════
Pushing backend image
═══════════════════════════════════════════════════════════
✅ Pushed docker.io/yourcompany/thermal-backend:1.0.0
✅ Pushed docker.io/yourcompany/thermal-backend:latest

... (frontend, nginx) ...

═══════════════════════════════════════════════════════════
Build and Push Complete!
═══════════════════════════════════════════════════════════
✅ All images built and pushed successfully
Version: 1.0.0
Registry: docker.io
```

**3. Deploy to Production**
```bash
# SSH into production
ssh user@production-server

# Update compose.yml to use registry images
vim compose.yml
```

Edit `compose.yml`:
```yaml
backend:
  image: docker.io/yourcompany/thermal-backend:1.0.0
  # Remove 'build' section

frontend:
  image: docker.io/yourcompany/thermal-frontend:1.0.0
  # Remove 'build' section

nginx:
  image: docker.io/yourcompany/thermal-nginx:1.0.0
  # Remove 'build' section
```

```bash
# Pull images
docker-compose pull

# Start services
docker-compose up -d

# Verify
docker-compose ps
```

---

## Build Reports

### Location

All build information saved to:
```
tmp/reports/builds/build-YYYYMMDD-HHMMSS.txt
```

### Content

```
Build Information
═════════════════════════════════════════════════════════

Date: Sat Feb  1 14:30:22 UTC 2026
Version: 1.0.0
Registry: docker.io
Username: yourcompany
Prefix: thermal

Images Built:
─────────────────────────────────────────────────────────
  - docker.io/yourcompany/thermal-backend:1.0.0
  - docker.io/yourcompany/thermal-backend:latest
  - docker.io/yourcompany/thermal-frontend:1.0.0
  - docker.io/yourcompany/thermal-frontend:latest
  - docker.io/yourcompany/thermal-nginx:1.0.0
  - docker.io/yourcompany/thermal-nginx:latest

Pull Commands:
─────────────────────────────────────────────────────────
docker pull docker.io/yourcompany/thermal-backend:1.0.0
docker pull docker.io/yourcompany/thermal-frontend:1.0.0
docker pull docker.io/yourcompany/thermal-nginx:1.0.0

Docker Compose (Production):
─────────────────────────────────────────────────────────
backend:
  image: docker.io/yourcompany/thermal-backend:1.0.0

frontend:
  image: docker.io/yourcompany/thermal-frontend:1.0.0

nginx:
  image: docker.io/yourcompany/thermal-nginx:1.0.0
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push Docker Images

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set version from tag
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_ENV
      
      - name: Create .env
        run: |
          cp .env.example .env
          echo "DOCKER_REGISTRY=docker.io" >> .env
          echo "DOCKER_USERNAME=${{ secrets.DOCKER_USERNAME }}" >> .env
          echo "DOCKER_PASSWORD=${{ secrets.DOCKER_PASSWORD }}" >> .env
          echo "VERSION=${{ env.VERSION }}" >> .env
      
      - name: Build and push
        run: ./scripts/build-and-push.sh
      
      - name: Save build report
        uses: actions/upload-artifact@v3
        with:
          name: build-report
          path: tmp/reports/builds/
```

### GitLab CI Example

```yaml
build-and-push:
  stage: build
  only:
    - tags
  script:
    - cp .env.example .env
    - echo "DOCKER_REGISTRY=$DOCKER_REGISTRY" >> .env
    - echo "DOCKER_USERNAME=$DOCKER_USERNAME" >> .env
    - echo "DOCKER_PASSWORD=$DOCKER_PASSWORD" >> .env
    - echo "VERSION=$CI_COMMIT_TAG" >> .env
    - ./scripts/build-and-push.sh
  artifacts:
    paths:
      - tmp/reports/builds/
```

---

## Troubleshooting

### Login Failed

```bash
# Test login manually
docker login docker.io -u yourcompany

# Use access token, not password
# Get token: https://hub.docker.com/settings/security
```

### Build Failed

```bash
# Check .env exists
ls .env

# Check all required variables
grep DOCKER_ .env

# Build manually for debugging
docker build -f docker/backend/Dockerfile ./backend
```

### Push Failed

```bash
# Check registry is accessible
ping docker.io

# Check you're logged in
docker info | grep Username

# Re-login
docker logout
docker login docker.io
```

### Image Not Found on Production

```bash
# Check image exists in registry
docker search yourcompany/thermal

# Pull manually
docker pull docker.io/yourcompany/thermal-backend:1.0.0

# Check tag exists
# Visit: https://hub.docker.com/r/yourcompany/thermal-backend/tags
```

---

## Best Practices

### Versioning
✅ Use semantic versioning (1.0.0, 1.1.0, 2.0.0)  
✅ Tag Git commits with version  
✅ Keep 'latest' updated for development  
✅ Use specific versions in production  

### Security
✅ Use Docker Hub access tokens (not password)  
✅ Never commit DOCKER_PASSWORD to git  
✅ Store secrets in CI/CD secrets  
✅ Scan images for vulnerabilities  

### Organization
✅ One repository per service  
✅ Tag images with git commit hash  
✅ Keep build reports in tmp/reports/builds/  
✅ Document each release  

---

## Summary

### Quick Commands

```bash
# Development
make setup
make setup-secrets
make up

# Build for production
make deploy-build

# Deploy on production
ssh user@server
docker-compose pull
docker-compose up -d
```

### Images Built

- `thermal-backend` - NestJS API
- `thermal-frontend` - React SPA
- `thermal-nginx` - Reverse proxy

### Registry Locations

**Docker Hub:**
```
docker.io/yourcompany/thermal-backend:1.0.0
docker.io/yourcompany/thermal-frontend:1.0.0
docker.io/yourcompany/thermal-nginx:1.0.0
```

**All managed through .env configuration!**

---

**Docker images can now be built, versioned, and pushed to registry automatically!** 🚀

