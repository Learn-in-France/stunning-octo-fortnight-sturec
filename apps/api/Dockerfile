FROM node:20-slim AS base
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json turbo.json ./

# Copy workspace package.json files
COPY packages/shared/package.json packages/shared/
COPY packages/config/ packages/config/
COPY apps/api/package.json apps/api/

# Install all dependencies
RUN npm ci

# Copy source
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/

# Build shared package
RUN npm run build --workspace=@sturec/shared

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build API
RUN npm run build --workspace=@sturec/api

WORKDIR /app/apps/api

EXPOSE 3001
CMD ["node", "dist/server.js"]
