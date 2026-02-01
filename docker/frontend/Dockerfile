# Docker Frontend - React SPA Builder
# Development-friendly build for initial setup

ARG NODE_VERSION
FROM node:${NODE_VERSION}

LABEL maintainer="Thermal Software Team"
LABEL version="2.0.0-dev"
LABEL description="React Frontend Builder for Thermal Software - Development"

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

# Build argument for API URL
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Expose port for Vite dev server
EXPOSE 5173

# For development: keep container alive for manual commands
# If dependencies installed and built, run dev server, otherwise wait for manual setup
CMD ["sh", "-c", "if [ -d node_modules ]; then npm run dev; else echo 'Run: npm install && npm run dev'; tail -f /dev/null; fi"]


