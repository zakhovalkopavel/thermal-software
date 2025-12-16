FROM node:24-alpine

WORKDIR /usr/src/app

# Install system dependencies
RUN apk add --no-cache make

# Copy all subprojects
COPY . .

# Install dependencies for refractory
WORKDIR /usr/src/app/refractory
RUN npm install && npm run build

# Install dependencies for other subprojects if they exist
WORKDIR /usr/src/app/furnaceCombustion
RUN if [ -f package.json ]; then npm install; fi

# Return to root
WORKDIR /usr/src/app

# Default: API server (can be overridden in compose.yaml)
CMD ["sh", "-c", "cd refractory && node server.js"]


