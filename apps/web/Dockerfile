# Build from repository root: docker build -f apps/web/Dockerfile .
# VITE_API_URL: use /api/v1 when served behind the bundled nginx proxy (same origin).

FROM node:22-alpine AS builder
WORKDIR /src

RUN corepack enable pnpm

ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=${VITE_API_URL}

# Monorepo root (see repository .dockerignore — excludes node_modules, dist, .env, …)
COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @imeitrack/web build

FROM nginx:1.27-alpine

COPY --from=builder /src/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
