# NestJS Quick Start — Testing, Swagger, Docker, Verify, Next Steps

**Parent index:** [NESTJS_QUICK_START.md](./NESTJS_QUICK_START.md)

---

```bash
```bash
cd backend

# Start the server
npm run start:dev

# Test in another terminal
curl http://localhost:4000/materials

# Should return: []
```

---

## Step 8: Add Swagger Documentation (2 min)

Update `backend/src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:18080'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Refractory Calculator API')
    .setDescription('API for thermal software refractory calculations')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  
  console.log(`🚀 Backend running on: http://localhost:${port}`);
  console.log(`📚 API docs: http://localhost:${port}/api/docs`);
}

bootstrap();
```

```bash
# Restart and visit
# http://localhost:4000/api/docs
```

---

## Step 9: Update Docker Configuration (5 min)

Create `docker/Dockerfile.backend`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/main"]
```

Update `docker-compose.yml`:

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:${POSTGRES_VERSION}
    container_name: thermal-postgres
    environment:
      POSTGRES_DB: ${DB_DATABASE}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "${DB_PORT}:5432"
    networks:
      - thermal-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:${REDIS_VERSION}
    container_name: thermal-redis
    ports:
      - "${REDIS_PORT}:6379"
    networks:
      - thermal-network

  backend:
    build:
      context: ./backend
      dockerfile: ../docker/backend/Dockerfile
    container_name: thermal-backend
    environment:
      NODE_ENV: ${NODE_ENV}
      PORT: ${BACKEND_PORT}
      DB_HOST: ${DB_HOST}
      DB_PORT: ${DB_PORT}
      DB_USERNAME: ${DB_USERNAME}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_DATABASE: ${DB_DATABASE}
      REDIS_HOST: ${REDIS_HOST}
      REDIS_PORT: ${REDIS_PORT}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    expose:
      - "${BACKEND_PORT}"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - thermal-network
    command: npm run start:prod

  # Legacy calculator - will be replaced by new frontend
  legacy-calculator:
    image: nginx:${NGINX_VERSION}
    container_name: thermal-legacy-calculator
    volumes:
      - ./legacy/refractory/public:/usr/share/nginx/html/refractory/public:ro
      - ./legacy/refractory/dist:/usr/share/nginx/html/refractory/dist:ro
      - ./docker/nginx/legacy.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "${LEGACY_PORT}:80"
    networks:
      - thermal-network

networks:
  thermal-network:
    driver: bridge

volumes:
  postgres_data:
```

---

## Step 10: Verify Everything Works

```bash
# Build and start all services
```bash
# From project root directory
docker-compose up --build -d

# Check services
docker-compose ps

# Should show:
# - postgres (healthy)
# - redis (running)
# - backend (running)
# - refractory-calculator (running)
```
curl http://localhost:4000/api/v1/materials
curl http://localhost:18080/  # Old frontend still works

# View logs
docker-compose logs -f backend
```

---

## Next Steps

Now that your backend is running, proceed with:

1. **Implement Authentication** (Day 2)
   - JWT strategy
   - User registration/login
   - Protected routes

2. **Migrate Calculation Logic** (Day 3-5)
   - Port existing TypeScript classes
   - Create calculation services
   - Add caching

3. **Build Frontend** (Week 2)
   - React setup with Vite
   - API integration
   - UI components

4. **Testing** (Week 3)
   - Unit tests
   - Integration tests
   - E2E tests

---

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database not ready - wait for health check
# 2. Environment variables missing - check .env
# 3. Port already in use - change PORT in .env
```

### Database connection failed
```bash
# Test connection
docker exec -it thermal-postgres psql -U ${DB_USERNAME} -d ${DB_DATABASE}

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

### Module not found errors
```bash
cd backend
npm install
npm run build
```

---

## Useful Commands

```bash
# Backend development
cd backend
npm run start:dev          # Start with hot-reload
npm run build              # Build for production
npm run test               # Run tests

# Database
npm run typeorm migration:create -- -n MigrationName
npm run typeorm migration:run
npm run typeorm migration:revert

# Docker
docker-compose up -d       # Start all services
docker-compose down        # Stop all services
docker-compose logs -f     # View logs
docker-compose ps          # Check status
```

---

## Resources

- **NestJS Docs:** https://docs.nestjs.com
- **TypeORM Docs:** https://typeorm.io
- **Swagger UI:** http://localhost:4000/api/docs
- **Migration Spec:** [NESTJS_MIGRATION_SPEC.md](NESTJS_MIGRATION_SPEC.md)

---

**Happy Migration! 🚀**
