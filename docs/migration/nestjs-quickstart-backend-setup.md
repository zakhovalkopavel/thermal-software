# NestJS Quick Start — Backend, DB, Env, Modules, TypeORM

**Parent index:** [NESTJS_QUICK_START.md](./NESTJS_QUICK_START.md)

---

**⚠️ Only use if you cannot use Docker!**

## Step 1: Create Backend (5 min)

```bash
# From project root directory

# Create NestJS backend
npx @nestjs/cli new backend --package-manager npm

# Navigate to backend
cd backend

# Install core dependencies
npm install --save \
  @nestjs/typeorm typeorm pg \
  @nestjs/config \
  @nestjs/swagger \
  @nestjs/jwt @nestjs/passport passport passport-jwt \
  bcrypt \
  class-validator class-transformer

npm install --save-dev \
  @types/passport-jwt \
  @types/bcrypt
```

---

## Step 2: Setup Database (3 min)

```bash
# From project root directory

# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Or run standalone containers
docker run --name thermal-postgres \
  -e POSTGRES_DB=thermal \
  -e POSTGRES_USER=thermal \
  -e POSTGRES_PASSWORD=${DB_PASSWORD} \
  -p 5432:5432 \
  -d postgres:${POSTGRES_VERSION}

docker run --name thermal-redis \
  -p 6379:6379 \
  -d redis:${REDIS_VERSION}
```

---

## Step 3: Configure Environment (2 min)

```bash
cd backend

# Create .env file
cat > .env << 'EOF'
# Server
NODE_ENV=development
PORT=4000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=thermal
DB_PASSWORD=${DB_PASSWORD}
DB_DATABASE=thermal

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
EOF
```

---

## Step 4: Generate Modules (5 min)

```bash
cd backend

# Generate core modules
nest g module config
nest g module database

# Generate feature modules
nest g resource auth --no-spec
nest g resource users --no-spec
nest g resource materials --no-spec
```

# When prompted, choose:
# - Transport layer: REST API
# - CRUD entry points: Yes
```

---

## Step 5: Setup TypeORM Configuration (5 min)

Create `backend/src/config/database.config.ts`:

```typescript
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  migrationsRun: true,
};
```

Update `backend/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MaterialsModule } from './materials/materials.module';
import { MixesModule } from './mixes/mixes.module';
import { CalculationsModule } from './calculations/calculations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
    UsersModule,
    MaterialsModule,
    MixesModule,
    CalculationsModule,
  ],
})
export class AppModule {}
```

---

## Step 6: Create First Entity (5 min)

Create `backend/src/materials/entities/material.entity.ts`:

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  category: string;

  @Index()
  @Column()
  variant: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  composition: Record<string, number>;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  density_g_cm3: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  meltingPoint_C: number;

  @Column({ type: 'jsonb', nullable: true })
  thermalProperties: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

Update `backend/src/materials/materials.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialsService } from './materials.service';
import { MaterialsController } from './materials.controller';
import { Material } from './entities/material.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Material])],
  controllers: [MaterialsController],
  providers: [MaterialsService],
  exports: [MaterialsService],
})
export class MaterialsModule {}
```

---
