FROM node:20-slim AS base

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json turbo.json ./

# Copy workspace package.json files
COPY packages/shared/package.json packages/shared/
COPY packages/config/ packages/config/
COPY apps/web/package.json apps/web/

# Install all dependencies
RUN npm ci

# Copy source
COPY packages/shared/ packages/shared/
COPY apps/web/ apps/web/

# Build shared package
RUN npm run build --workspace=@sturec/shared

# Build web
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID

RUN npm run build --workspace=@sturec/web

WORKDIR /app/apps/web

EXPOSE 3000
CMD ["npm", "run", "start"]
