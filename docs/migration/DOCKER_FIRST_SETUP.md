# NestJS Migration - Docker-Only Setup (NO Host Commands)

**Version:** 2.0.0-dev  
**Last Updated:** February 1, 2026  
**Approach:** 100% Docker - NO Node.js on host required

---

## ⚠️ CRITICAL: Everything Runs in Docker

**NO Node.js commands on your host machine!**

**AND: ALL code must follow project naming conventions!**
👉 Read first: [../../NAMING_CONVENTIONS.md](../../NAMING_CONVENTIONS.md)

❌ **NEVER run on host:**
```bash
npx @nestjs/cli new backend        # NO!
npm install                         # NO!
npm create vite                     # NO!
node --version                      # NO!
```

✅ **ALWAYS run in Docker:**
```bash
docker-compose run --rm backend npm install    # YES!
docker-compose exec backend sh                 # YES!
```

**Why?** Your host doesn't need Node.js installed. Everything happens in containers.

---

## Prerequisites

✅ Required (on host):
- Docker installed
- Docker Compose installed
- `.env` file created with secure secrets

✅ NOT required (on host):
- ❌ Node.js
- ❌ npm
- ❌ NestJS CLI
- ❌ Vite

```bash
# Verify Docker only
docker --version           # Should work
docker-compose --version   # Should work
node --version             # Can fail - we don't need it!
```

---

## ⚠️ IMPORTANT: Portable Paths

**All commands assume you're in the project root directory.**

❌ **NEVER use absolute paths:**
```bash
cd /opt/thermal-software              # NO! Not portable
cd /home/user/projects/thermal        # NO! Not portable
```

✅ **ALWAYS use relative paths from project root:**
```bash
cd backend                            # YES!
cd frontend                           # YES!
docker-compose up -d                  # YES! (from root)
```

**Why?** Your project could be installed in different locations:
- Developer laptop: `/home/dev/thermal-software`
- Production server: `/var/www/thermal`
- Another computer: `/opt/apps/thermal`

All scripts and documentation use relative paths so the project works anywhere!

---

## Phase 1: Create Backend Structure (15 minutes)

### Step 1.1: Create Backend Directory Structure Manually

**NO npx command!** We'll create the structure ourselves, then let Docker build it.

```bash
# From project root directory

# Create backend directory structure
mkdir -p backend/src
mkdir -p backend/test

# Create package.json
cat > backend/package.json << 'EOF'
{
  "name": "thermal-backend",
  "version": "2.0.0-dev",
  "description": "NestJS Backend API for Thermal Software",
  "author": "Thermal Software Team",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/config": "^3.1.1",
    "@nestjs/swagger": "^7.1.17",
    "@nestjs/typeorm": "^10.0.1",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    "bcrypt": "^5.1.1",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "typeorm": "^0.3.19",
    "pg": "^8.11.3",
    "redis": "^4.6.12",
    "reflect-metadata": "^0.2.1",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.0",
    "@nestjs/schematics": "^10.1.0",
    "@nestjs/testing": "^10.3.0",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.11",
    "@types/node": "^20.11.5",
    "@types/passport-jwt": "^4.0.0",
    "@types/passport-local": "^1.0.38",
    "@types/bcrypt": "^5.0.2",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.3",
    "jest": "^29.7.0",
    "prettier": "^3.2.4",
    "source-map-support": "^0.5.21",
    "ts-jest": "^29.1.1",
    "ts-loader": "^9.5.1",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.3.3"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
EOF

# Create tsconfig.json
cat > backend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}
EOF

# Create nest-cli.json
cat > backend/nest-cli.json << 'EOF'
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
EOF

# Create main.ts
cat > backend/src/main.ts << 'EOF'
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Thermal Software API')
    .setDescription('NestJS API for thermal engineering calculations')
    .setVersion('2.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
EOF

# Create app.module.ts
cat > backend/src/app.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
EOF

# Create app.controller.ts
cat > backend/src/app.controller.ts << 'EOF'
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  health(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
EOF

# Create app.service.ts
cat > backend/src/app.service.ts << 'EOF'
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Thermal Software API v2.0.0';
  }
}
EOF

# Create .dockerignore
cat > backend/.dockerignore << 'EOF'
node_modules
npm-debug.log
dist
.git
.env
.env.local
*.md
.vscode
.idea
coverage
.cache
EOF

echo "✅ Backend structure created"
```

### Step 1.2: Build and Start Backend with Docker

**Now Docker installs everything and builds:**

```bash
# Build backend (Docker runs npm ci + npm run build)
docker-compose up --build -d backend

# Check if it's running
docker-compose ps backend

# View logs
docker-compose logs -f backend

# Should see:
# - npm ci installing dependencies
# - npm run build compiling TypeScript
# - "Application is running on: http://localhost:4000"
```

### Step 1.3: Verify Backend

```bash
# Test health endpoint
curl http://localhost:4000/health

# Should return: {"status":"ok","timestamp":"..."}

# Open Swagger docs in browser
# http://localhost:4000/api/docs
```

---

## Phase 2: Create Frontend Structure (15 minutes)

### Step 2.1: Create Frontend Directory Structure Manually

**NO npm create vite!** We'll create the structure ourselves.

```bash
# From project root directory

# Create frontend directory structure
mkdir -p frontend/src
mkdir -p frontend/public

# Create package.json
cat > frontend/package.json << 'EOF'
{
  "name": "thermal-frontend",
  "version": "2.0.0-dev",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.3",
    "axios": "^1.6.5",
    "@tanstack/react-query": "^5.17.19"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "eslint": "^8.56.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "typescript": "^5.3.3",
    "vite": "^5.0.11"
  }
}
EOF

# Create vite.config.ts
cat > frontend/vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://backend:4000',
        changeOrigin: true,
      },
    },
  },
})
EOF

# Create tsconfig.json
cat > frontend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

# Create tsconfig.node.json
cat > frontend/tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
EOF

# Create index.html
cat > frontend/index.html << 'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Thermal Software</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# Create main.tsx
cat > frontend/src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

# Create App.tsx
cat > frontend/src/App.tsx << 'EOF'
import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [apiStatus, setApiStatus] = useState<string>('Checking...')

  useEffect(() => {
    fetch('/api/v1/health')
      .then(res => res.json())
      .then(data => setApiStatus(data.status))
      .catch(() => setApiStatus('error'))
  }, [])

  return (
    <div className="App">
      <h1>Thermal Software v2.0.0</h1>
      <p>Frontend: React + Vite + TypeScript</p>
      <p>Backend: NestJS</p>
      <p>API Status: <strong>{apiStatus}</strong></p>
      <p>
        <a href="/api/docs" target="_blank">Open Swagger API Docs</a>
      </p>
    </div>
  )
}

export default App
EOF

# Create App.css
cat > frontend/src/App.css << 'EOF'
.App {
  text-align: center;
  padding: 2rem;
}

h1 {
  color: #646cff;
  font-size: 3em;
  margin: 0.5em 0;
}

a {
  color: #646cff;
  text-decoration: none;
}

a:hover {
  color: #535bf2;
}
EOF

# Create index.css
cat > frontend/src/index.css << 'EOF'
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}
EOF

# Create .dockerignore
cat > frontend/.dockerignore << 'EOF'
node_modules
npm-debug.log
dist
.git
.env
.env.local
*.md
.vscode
.idea
coverage
.cache
EOF

echo "✅ Frontend structure created"
```

### Step 2.2: Build and Start Frontend with Docker

```bash
# Build frontend (Docker runs npm ci + npm run build)
docker-compose up --build -d frontend

# Check if it's running
docker-compose ps frontend

# View logs
docker-compose logs -f frontend

# Should see:
# - npm ci installing dependencies
# - npm run build (Vite building)
# - nginx serving on port 3000
```

### Step 2.3: Verify Frontend

```bash
# Test frontend
curl http://localhost:3000

# Should return HTML

# Open in browser
# http://localhost:3000
```

---

## Phase 3: Verify Everything Works (5 minutes)

### Step 3.1: Check All Services

```bash
# View all services
docker-compose ps

# Should see:
# thermal-postgres    (healthy)
# thermal-redis       (healthy)
# thermal-backend     (running)
# thermal-frontend    (running)
```

### Step 3.2: Test Connectivity

```bash
# Test backend
curl http://localhost:4000/health
# {"status":"ok","timestamp":"..."}

# Test frontend
curl http://localhost:3000
# <!doctype html>...

# Test Swagger
curl http://localhost:4000/api/docs
# HTML page with Swagger UI
```

### Step 3.3: Access in Browser

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Swagger Docs: http://localhost:4000/api/docs

---

## Phase 4: Development Workflow (Docker-Only)

### Making Code Changes

**All editing happens on host, all running happens in Docker:**

```bash
# Edit backend code (on host)
vim backend/src/app.controller.ts

# Restart backend (in Docker)
docker-compose restart backend

# View logs
docker-compose logs -f backend
```

### Running Commands Inside Containers

```bash
# Access backend shell
docker-compose exec backend sh

# Inside container, you can:
npm run build
npm run test
npm run lint

# Exit
exit

# Or run commands directly
docker-compose exec backend npm run test
docker-compose exec backend npm run lint
```

### Adding New Dependencies

```bash
# Edit package.json on host
vim backend/package.json

# Add dependency, then rebuild
docker-compose up --build backend

# Docker will run npm ci and install new dependencies
```

### Generating NestJS Resources (Inside Container)

```bash
# Access backend container
docker-compose exec backend sh

# Now you can use nest CLI (it's installed in container)
nest generate resource users
nest generate module auth
nest generate service calculations

# Exit container
exit

# Restart to apply changes
docker-compose restart backend
```

---

## Phase 5: Database Integration

### Step 5.1: Configure TypeORM (Inside Container)

Edit `backend/src/app.module.ts` on host:

```typescript
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV === 'development',
    }),
  ],
  // ...
})
export class AppModule {}
```

Restart:

```bash
docker-compose restart backend
```

### Step 5.2: Run Migrations (Inside Container)

```bash
# Access backend container
docker-compose exec backend sh

# Generate migration
npm run typeorm migration:generate -- -n CreateUsers

# Run migrations
npm run typeorm migration:run

# Exit
exit
```

---

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs backend | tail -50

# Common issues:
# 1. Database not ready - wait for postgres healthcheck
# 2. Port in use - check: lsof -i :4000 (on host)
# 3. Syntax error - check backend/src files
```

### Frontend won't build

```bash
# Check logs
docker-compose logs frontend | tail -50

# Common issues:
# 1. Missing dependencies - check package.json
# 2. TypeScript errors - check tsconfig.json
# 3. Vite config issues - check vite.config.ts
```

### Can't access containers

```bash
# List all containers
docker ps -a

# Check if services are running
docker-compose ps

# Restart all
docker-compose restart

# Rebuild all
docker-compose down
docker-compose up --build
```

### Need to run npm commands

```bash
# ALWAYS run inside container:
docker-compose exec backend npm install    # Inside backend
docker-compose exec frontend npm install   # Inside frontend

# OR access shell first:
docker-compose exec backend sh
npm install
npm run test
exit
```

---

## Summary: Pure Docker Workflow

```bash
# 1. Create project structure (manually on host)
#    - Create directories
#    - Create package.json, tsconfig.json, etc.
#    - Create source files

# 2. Build and run with Docker (Docker installs everything)
docker-compose up --build

# 3. Make code changes (on host)
vim backend/src/...
vim frontend/src/...

# 4. Run commands (inside container)
docker-compose exec backend npm run test
docker-compose exec backend sh  # Access shell

# 5. Rebuild after package.json changes
docker-compose up --build backend
```

**No Node.js needed on your host machine!** Everything runs in Docker.

---

## Verification Checklist

- [ ] No `npx` commands run on host
- [ ] No `npm install` run on host
- [ ] No `node` commands run on host
- [ ] All npm commands run via `docker-compose exec`
- [ ] Package files created manually or copied
- [ ] Docker Compose handles all installation
- [ ] All 4 services running (postgres, redis, backend, frontend)
- [ ] Backend accessible at http://localhost:4000
- [ ] Frontend accessible at http://localhost:3000
- [ ] Swagger docs at http://localhost:4000/api/docs

---

**100% Docker-based workflow - No host Node.js required!** 🐳

