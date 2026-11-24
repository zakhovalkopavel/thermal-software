# Docker Build Workflow, Reports, CI, and Troubleshooting

**Parent index:** [DOCKER_REGISTRY.md](./DOCKER_REGISTRY.md)

---

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
