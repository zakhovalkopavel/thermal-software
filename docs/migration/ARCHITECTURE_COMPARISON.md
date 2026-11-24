# Client-Server Architecture: Before vs After

## Overview Comparison

| Aspect | **Current (Monolithic)** | **Target (Client-Server)** |
|--------|--------------------------|----------------------------|
| **Architecture** | Browser-executed modules | Separate frontend + backend |
| **Backend** | Simple Node.js HTTP server | NestJS enterprise framework |
| **Frontend** | Vanilla JS + HTML | React SPA + TypeScript |
| **Database** | LocalStorage only | PostgreSQL + Redis |
| **Authentication** | None | JWT-based auth |
| **API** | 2 basic endpoints | RESTful API with 20+ endpoints |
| **State Management** | DOM manipulation | Redux/Zustand |
| **Validation** | Client-side only | Both client + server |
| **Testing** | Manual | Automated (Jest, Cypress) |
| **Scalability** | Single instance | Horizontally scalable |
| **Deployment** | Single container | Multi-container orchestration |

---

## Topic index

| Doc | Contents |
|-----|----------|
| [architecture-comparison-structure.md](./architecture-comparison-structure.md) | Architecture, code organization, data flow |
| [architecture-comparison-api-state.md](./architecture-comparison-api-state.md) | API, state management, auth, database |
| [architecture-comparison-ops.md](./architecture-comparison-ops.md) | Performance, testing, deployment, when to migrate |

