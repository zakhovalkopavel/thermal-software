# Nginx SSL, Dev Workflow, Issues, and Production Ops

**Parent index:** [NGINX_ARCHITECTURE.md](./NGINX_ARCHITECTURE.md)

---

### Current layout (`docker/nginx/conf.d/`)

- Port **80**: `/health` + ACME path; all other traffic **301 → HTTPS**
- Port **443**: TLS using `/etc/nginx/ssl/cert.pem` + `key.pem`; app routes in `app-locations.inc`

Nginx **will not start** on 443 without those cert files. Create them before (or right after) `make up`:

```bash
# Production env (thermosolver.net HTTPS) → .env
make setup-production
make setup-secrets

# Let's Encrypt
make install-ssl-certs DOMAIN=thermosolver.net EMAIL=you@example.com STOP_NGINX=1 RELOAD=1

# Local / emergency self-signed
make ssl-self-signed DOMAIN=localhost RELOAD=1
```

**SSL certificates location:**
```
docker/nginx/ssl/
├── cert.pem
└── key.pem
```

**Volume mount:**
```yaml
volumes:
  - ./docker/nginx/ssl:/etc/nginx/ssl:ro
```

---

## Development Workflow

### Access Services

**Through Nginx (recommended):**
```bash
# Frontend
curl http://localhost/

# Backend API
curl http://localhost/api/v1/health

# Swagger docs
curl http://localhost/api/docs

# Open in browser
open http://localhost          # Frontend
open http://localhost/api/docs # Swagger
```

**Direct Access (for debugging):**
```bash
# Backend (internal network)
docker-compose exec backend curl http://localhost:4000/health

# Frontend (internal network)
docker-compose exec frontend curl http://localhost:80/
```

### View Nginx Logs

```bash
# Access logs
docker-compose logs nginx

# Follow logs
docker-compose logs -f nginx

# Save to report
docker-compose logs nginx > tmp/reports/migrations/nginx-logs-$(date +%Y%m%d).log
```

### Reload Nginx Configuration

```bash
# After changing conf.d/default.conf
docker-compose exec nginx nginx -s reload

# Or restart container
docker-compose restart nginx
```

### Test Configuration

```bash
# Test nginx config syntax
docker-compose exec nginx nginx -t

# Should output: "test is successful"
```

---

## Common Issues & Solutions

### 1. Backend 502 Bad Gateway

**Symptom:**
```bash
curl http://localhost/api/v1/health
# 502 Bad Gateway
```

**Cause:** Backend not running or not accessible

**Fix:**
```bash
# Check backend is running
docker-compose ps backend

# Check backend health
docker-compose exec backend curl http://localhost:4000/health

# Restart backend
docker-compose restart backend
```

### 2. Frontend 502 Bad Gateway

**Symptom:**
```bash
curl http://localhost/
# 502 Bad Gateway
```

**Cause:** Frontend not running

**Fix:**
```bash
# Check frontend is running
docker-compose ps frontend

# Restart frontend
docker-compose restart frontend
```

### 3. CORS Errors

**Symptom:** Browser console shows CORS errors

**Fix:** Check nginx configuration has CORS headers:
```nginx
location /api/ {
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
}
```

### 4. Can't Access Swagger

**Symptom:** http://localhost/api/docs returns 404

**Cause:** Backend not serving Swagger or route not configured

**Fix:**
```bash
# Check backend swagger endpoint
docker-compose exec backend curl http://localhost:4000/api/docs

# If works, check nginx config has /api/docs route
```

---

## Production Deployment

### 1. Install certificates (script)

Preferred path — uses Docker `certbot/certbot`, writes gitignored files under
`docker/nginx/ssl/`, and keeps Let's Encrypt state in `docker/nginx/ssl/letsencrypt/`:

```bash
# First issue (DNS A/AAAA must already point here; port 80 must be free)
make install-ssl-certs DOMAIN=yourdomain.com EMAIL=you@example.com STOP_NGINX=1 RELOAD=1

# Or call the script directly
./scripts/install-ssl-certs.sh issue \
  --domain yourdomain.com \
  --email you@example.com \
  --stop-nginx \
  --reload

# Host- or panel-provided files
./scripts/install-ssl-certs.sh install \
  --cert /path/to/fullchain.pem \
  --key /path/to/privkey.pem \
  --reload

# Renew (~every 60 days; cron-friendly)
make renew-ssl-certs STOP_NGINX=1 RELOAD=1
```

`STOP_NGINX=1` temporarily stops the compose `nginx` service so standalone HTTP-01
can bind port 80. `STAGING=1` hits Let's Encrypt staging (safer while testing).

Manual equivalent (same layout the script produces):

```bash
certbot certonly --standalone -d yourdomain.com
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem docker/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem docker/nginx/ssl/key.pem
```

### 2. Update nginx configuration
Enable HTTPS server block in `conf.d/default.conf` (see Production (HTTPS) above).

### 3. Environment Variables
```bash
# Update .env.production
HTTP_PORT=80
HTTPS_PORT=443
```

### 4. Deploy
```bash
docker compose -f compose.yml -f compose.production.yml up -d
```

---

## Monitoring & Performance

### Access Logs
```bash
# View access log
docker-compose exec nginx cat /var/log/nginx/access.log

# Tail access log
docker-compose logs -f nginx | grep "GET"
```

### Performance Metrics
```nginx
# Add to nginx.conf for metrics
location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    deny all;
}
```

### Health Checks
```bash
# Nginx health
curl http://localhost/health

# Backend health (through nginx)
curl http://localhost/api/v1/health

# Direct backend health
docker-compose exec backend curl http://localhost:4000/health
```

---

## Summary

### Services Access Matrix

| Service | Direct Access | Through Nginx | Production |
|---------|---------------|---------------|------------|
| **Frontend** | ❌ No | ✅ http://localhost/ | ✅ https://domain.com/ |
| **Backend** | ❌ No | ✅ http://localhost/api/v1 | ✅ https://domain.com/api/v1 |
| **Swagger** | ❌ No | ✅ http://localhost/api/docs | ✅ https://domain.com/api/docs |
| **Postgres** | ⚠️ Dev only (5432) | ❌ No | ❌ Internal only |
| **Redis** | ⚠️ Dev only (6379) | ❌ No | ❌ Internal only |
| **Python** | ❌ No | ❌ No | ❌ Internal only |

### Port Summary

| Port | Service | Access |
|------|---------|--------|
| **80** | Nginx HTTP | Public |
| **443** | Nginx HTTPS | Public (production) |
| 4000 | Backend | Internal only |
| 80 | Frontend | Internal only |
| 5432 | PostgreSQL | Internal (or dev) |
| 6379 | Redis | Internal (or dev) |

---

**Nginx is the ONLY entry point to your application!**

All external requests → Nginx → Backend/Frontend (internal)

This provides security, scalability, and flexibility.
