# Docker Organization

This folder contains Docker configurations for all services, organized by component.

## Structure

```
docker/
├── backend/                 # NestJS API
│   └── Dockerfile
├── frontend/                # React SPA
│   ├── Dockerfile
│   └── nginx.conf
├── nginx/                   # Reverse Proxy
    ├── Dockerfile
    ├── nginx.conf
    └── conf.d/
        └── default.conf
```

## Image Versions

All Docker image versions are managed through environment variables in `.env` file:

- `POSTGRES_VERSION=18.1-alpine`
- `REDIS_VERSION=8.4-alpine`
- `NGINX_VERSION=1.28.1-alpine`
- `NODE_VERSION=24.13.0-alpine`

**Verified:** Feb 1, 2026

## Building Images

### Backend
```bash
# From project root directory
docker build -f docker/backend/Dockerfile -t thermal-backend:latest ./backend
```

### Frontend
```bash
# From project root directory
docker build -f docker/frontend/Dockerfile -t thermal-frontend:latest ./frontend
```

### Nginx Reverse Proxy
```bash
# From project root directory
docker build -f docker/nginx/Dockerfile -t thermal-nginx:latest ./docker/nginx
```

## docker-compose.yml Reference

Update `docker-compose.yml` to reference the new Dockerfile locations:

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: ../docker/backend/Dockerfile
      args:
        NODE_VERSION: ${NODE_VERSION}
    # ...

  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/frontend/Dockerfile
      args:
        NODE_VERSION: ${NODE_VERSION}
        NGINX_VERSION: ${NGINX_VERSION}
    # ...

  nginx:
    build:
      context: ./docker/nginx
      dockerfile: ./Dockerfile
      args:
        NGINX_VERSION: ${NGINX_VERSION}
    # ...
```

## Features

### Backend Dockerfile
- ✅ Multi-stage build (builder + production)
- ✅ Non-root user (nestjs:1001)
- ✅ dumb-init for proper signal handling
- ✅ Health check endpoint
- ✅ Optimized layer caching
- ✅ Build arg for Node.js version

### Frontend Dockerfile
- ✅ Multi-stage build (builder + nginx)
- ✅ Vite production build
- ✅ Nginx static file serving
- ✅ Health check endpoint
- ✅ Gzip compression
- ✅ Security headers
- ✅ SPA routing support

### Nginx Reverse Proxy
- ✅ Upstream load balancing
- ✅ Health checks
- ✅ CORS configuration
- ✅ Security headers
- ✅ Gzip compression
- ✅ Cache configuration

### Legacy Nginx
- ✅ Serves static files
- ✅ CORS headers for ES modules
- ✅ Health check endpoint

## Security

All Dockerfiles follow security best practices:
- ✅ Non-root users
- ✅ Minimal base images (Alpine)
- ✅ No unnecessary packages
- ✅ Multi-stage builds
- ✅ Health checks
- ✅ Proper signal handling

## Version Control

- ✅ All Dockerfiles are in git
- ✅ Versions managed via `.env`
- ✅ `.env` is gitignored
- ✅ `.env.example` is tracked

---

**Last Updated:** Feb 1, 2026  
**Maintained by:** Thermal Software Team

