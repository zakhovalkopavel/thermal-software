# Docker Backend - NestJS API
# Multi-stage build for optimal image size

# ==========================================
# Stage 1: Builder
# ==========================================
ARG NODE_VERSION
FROM node:${NODE_VERSION} AS builder

LABEL maintainer="Thermal Software Team"
LABEL version="2.0.0-dev"
LABEL description="NestJS Backend API for Thermal Software - Builder Stage"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci && \
    npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# ==========================================
# Stage 2: Production
# ==========================================
ARG NODE_VERSION
FROM node:${NODE_VERSION}

LABEL maintainer="Thermal Software Team"
LABEL version="2.0.0-dev"
LABEL description="NestJS Backend API for Thermal Software"

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Copy package files for production dependencies
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Switch to non-root user
USER nestjs

# Expose port (configurable via env)
ARG BACKEND_PORT
EXPOSE ${BACKEND_PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${BACKEND_PORT}/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/main.js"]

