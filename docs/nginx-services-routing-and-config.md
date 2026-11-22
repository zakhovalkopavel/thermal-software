# Nginx Services, Routing, and Configuration Files

**Parent index:** [NGINX_ARCHITECTURE.md](./NGINX_ARCHITECTURE.md)

---

```
                           ┌─────────────────────┐
                           │   Internet/Browser  │
                           └──────────┬──────────┘
                                      │
                           Port 80/443│
                                      ↓
                           ┌──────────────────────────────┐
                           │    Nginx Reverse Proxy       │
                           │    (thermal-nginx)           │
                           │  • Serves frontend static    │
                           │  • Proxies API requests      │
                           └──────────┬───────────────────┘
                                      │
                ┌─────────────────────┼─────────────────────┐
                │                     │                     │
         /      │              /api/v1│                     │
                ↓                     ↓                     ↓
    ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
    │  Frontend       │   │    Backend      │   │    Python       │
    │  Builder Only   │   │  (NestJS API)   │   │   Scripts       │
    │  (Vite build)   │   │  Port: 4000     │   │                 │
    │  Shares /dist   │   │                 │   │                 │
    └─────────────────┘   └─────────────────┘   └─────────────────┘
            │                     │                     │
            └─────────────────────┼─────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
            ┌───────▼─────┐           ┌────────▼────┐
            │  PostgreSQL │           │    Redis    │
            └─────────────┘           └─────────────┘
```

**Key Points:**
- Frontend container only **builds** React app (no web server)
- Nginx **directly serves** static files from shared volume
- Nginx **proxies** API requests to backend
- No double-proxy overhead!
            │  Port: 5432 │           │  Port: 6379 │
            └─────────────┘           └─────────────┘
```

---

## Service Configuration

### Docker Services

```yaml
services:
  nginx:
    - Listens on: 80, 443
    - Proxies to: backend:4000, frontend:80
    - Container: thermal-nginx
    
  backend:
    - Listens on: 4000 (internal only)
    - No direct external access
    - Accessed via: http://localhost/api/v1
    
  frontend:
    - Listens on: 80 (internal only)
    - No direct external access
    - Accessed via: http://localhost
    
  python:
    - No HTTP exposure
    - Connects to postgres internally
    
  postgres:
    - Port 5432 (for development, can expose)
    - Internal network access
    
  redis:
    - Port 6379 (for development, can expose)
    - Internal network access
```

---

## Routing Rules

### Frontend Routes (/)
```
http://localhost/             → frontend:80/
http://localhost/index.html   → frontend:80/index.html
http://localhost/assets/*     → frontend:80/assets/*
```

**All requests to `/` go to React SPA**

### Backend API Routes (/api/v1)
```
http://localhost/api/v1/*     → backend:4000/api/v1/*
```

**Examples:**
```
http://localhost/api/v1/health           → backend:4000/api/v1/health
http://localhost/api/v1/calculations     → backend:4000/api/v1/calculations
http://localhost/api/docs                → backend:4000/api/docs (Swagger)
```

### Health Check (/health)
```
http://localhost/health       → Nginx returns 200 "healthy"
```

Used by Docker healthcheck and monitoring.

---

## Configuration Files

### 1. docker/nginx/Dockerfile
```dockerfile
FROM nginx:1.28.1-alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

### 2. docker/nginx/nginx.conf
Main nginx configuration (workers, events, etc.)

### 3. docker/nginx/conf.d/default.conf
**Upstream backends:**
```nginx
upstream backend_api {
    server backend:4000;
    keepalive 32;
}

upstream frontend_app {
    server frontend:80;
    keepalive 32;
}
```

**Server block:**
```nginx
server {
    listen 80;
    
    # Frontend (default)
    location / {
        proxy_pass http://frontend_app;
        # ... proxy headers
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://backend_api;
        # ... proxy headers, CORS
    }
    
    # Health check
    location /health {
        return 200 "healthy\n";
    }
}
```

---

## Why Nginx is NOT Inside Backend/Frontend

### ❌ Wrong Approach (Nginx in Frontend Container)
```
frontend container:
├── Node.js (Vite build)
├── Nginx (serves static files)
└── Exposes port 3000
```

**Problems:**
- Couples frontend and web server
- Can't easily switch web servers
- No centralized routing
- Each service exposed directly
- SSL must be configured per service

### ✅ Correct Approach (Separate Nginx)
```
nginx container:
├── Only nginx
├── Proxies to backend & frontend
└── Single entry point (port 80/443)

frontend container:
├── Only static files
└── Served by nginx or any web server

backend container:
├── Only NestJS
└── Proxied by nginx
```

**Benefits:**
- ✅ Single entry point for all services
- ✅ Easy to add SSL (only in nginx)
- ✅ Can change backend/frontend independently
- ✅ Load balancing ready (add more backend instances)
- ✅ Centralized logging and monitoring
- ✅ Security headers in one place

---
