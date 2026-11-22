# Nginx Reverse Proxy Architecture

**Version:** 1.0.0  
**Date:** February 1, 2026  
**Nginx Version:** 1.28.1-alpine (verified: February 1, 2026)

---

## Overview

Nginx acts as a **reverse proxy** that sits in front of backend and frontend services. This provides:
- ✅ Single entry point (port 80/443)
- ✅ SSL/TLS termination
- ✅ Load balancing (when scaled)
- ✅ Static file caching
- ✅ Security headers
- ✅ API routing
- ✅ CORS handling

---

## Topic index

| Doc | Contents |
|-----|----------|
| [nginx-services-routing-and-config.md](./nginx-services-routing-and-config.md) | Architecture, services, routing, config files, why reverse proxy |
| [nginx-ssl-workflow-and-ops.md](./nginx-ssl-workflow-and-ops.md) | SSL, workflow, common issues, production, monitoring |

