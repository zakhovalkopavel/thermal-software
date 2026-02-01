# Docker Backend - NestJS API
# Development-friendly build for initial setup

ARG NODE_VERSION
FROM node:${NODE_VERSION}

LABEL maintainer="Thermal Software Team"
LABEL version="2.0.0-dev"
LABEL description="NestJS Backend API for Thermal Software - Development"

WORKDIR /app

# Copy package files (if they exist)
COPY package*.json ./

# Copy source code
COPY . .

# Install dependencies if package-lock.json exists, otherwise skip
# We'll install interactively inside the container first time
RUN if [ -f package-lock.json ]; then \
      npm ci && npm cache clean --force; \
    elif [ -s package.json ] && [ "$(cat package.json | grep -c '\"dependencies\":{}')" -eq 0 ]; then \
      npm install && npm cache clean --force; \
    else \
      echo "Skipping npm install - run manually inside container"; \
    fi

# Expose port
ARG BACKEND_PORT
EXPOSE ${BACKEND_PORT:-4000}

# For development: keep container alive for manual commands
CMD ["sh", "-c", "if [ -d node_modules ] && [ -f dist/main.js ]; then npm run start:dev; else echo 'Run: npm install && npm run build && npm run start:dev'; tail -f /dev/null; fi"]

