# Docker Registry Commands, Script Usage, and Configuration

**Parent index:** [DOCKER_REGISTRY.md](./DOCKER_REGISTRY.md)

---

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
