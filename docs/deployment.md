# IMEITrack deployment guide

This document covers environment configuration, Docker, CORS, and splitting the frontend and backend across hosts.

---

## Backend environment (`apps/api`)

Configuration uses **Pydantic Settings** (`app/core/config.py`): values are read from the environment (and optionally `.env` for local work).

| Variable | Purpose |
|----------|---------|
| `APP_ENV` | `development` \| `production`. In `development`, the API may create tables on startup if Alembic has nothing to apply; in `production`, rely on **migrations** only. |
| `DATABASE_URL` | SQLAlchemy URL, e.g. `postgresql+psycopg2://user:pass@host:5432/imeitrack` |
| `JWT_SECRET_KEY` | **Required in production** — strong secret for JWT signing |
| `CORS_ORIGINS` | Comma-separated allowed browser origins (see [CORS](#cors)) |
| `API_V1_PREFIX` | Default `/api/v1` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime |

Templates:

- `apps/api/.env.example` — local development
- `apps/api/.env.production.example` — production checklist

**Startup (production):**

1. Set environment variables (or mount `.env` — avoid committing secrets).
2. Run database migrations: `alembic upgrade head` (from `apps/api`, with `DATABASE_URL` set).
3. Run the API process, e.g. `uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers` (behind a reverse proxy, `--proxy-headers` helps with HTTPS and client IPs).

The Docker API image runs migrations in the entrypoint when `APP_ENV=production` (fail-fast if migrations fail). For non-production, migration failures are tolerated so empty Alembic history can fall back to development `create_all` behavior.

---

## Frontend environment (`apps/web`)

Vite exposes only variables prefixed with **`VITE_`**.

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Axios `baseURL` for the API. Must include the API prefix, e.g. `https://api.example.com/api/v1` or a **same-origin path** like `/api/v1` when the SPA and API share a host behind a reverse proxy. |

Templates:

- `apps/web/.env.example` — local dev default
- `apps/web/.env.production.example` — production build examples

**Important:** `VITE_API_URL` is embedded at **build time**. Changing the API URL requires a **rebuild** of the frontend (or separate build pipelines per environment).

---

## Docker: full stack (Postgres + API + SPA)

From the **repository root**:

```bash
docker compose -f infra/docker/docker-compose.yml up --build
```

- **Web UI:** [http://localhost](http://localhost) — nginx serves the SPA and proxies `/api/` to the API (same-origin; `VITE_API_URL=/api/v1`).
- **API (direct):** [http://localhost:8000](http://localhost:8000) — e.g. [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- **Postgres:** `localhost:5432` (user/password/db match `docker-compose.yml`)

Override secrets for local experiments:

```bash
JWT_SECRET_KEY="$(openssl rand -hex 32)" docker compose -f infra/docker/docker-compose.yml up --build
```

### Build images separately (from repo root)

```bash
docker build -f apps/api/Dockerfile -t imeitrack-api:latest .
docker build -f apps/web/Dockerfile -t imeitrack-web:latest \
  --build-arg VITE_API_URL=/api/v1 .
```

### Troubleshooting

- **`dependency failed to start: container …-api-… is unhealthy`:** The API healthcheck runs only after migrations and DB bootstrap; first boot can take a minute. Inspect logs: `docker logs <api-container-name>`. Rebuild after pulling the latest compose/Dockerfile (longer `start_period`, `curl`-based check). If you previously used `docker-compose.dev.yml`, remove stray containers: `docker compose -f infra/docker/docker-compose.yml down --remove-orphans` then `up --build` again.
- **Orphan containers:** Compose may warn about containers from another compose file (e.g. pgAdmin from `docker-compose.dev.yml`). Use `--remove-orphans` on `down`, or `docker rm` the old container.

---

## CORS

FastAPI uses `CORSMiddleware` with `allow_credentials=True`. Implications:

1. **Do not** set `CORS_ORIGINS` to `*` when credentials are enabled — browsers will reject it for credentialed requests.
2. List **exact** frontend origins: scheme + host + port, e.g. `https://app.example.com`, `https://app.example.com:443`.
3. **Same-origin (recommended for SPAs):** Put the browser on `https://app.example.com`, serve static files there, and reverse-proxy `/api` to the API. The SPA can use `VITE_API_URL=/api/v1`; the browser sees one origin and CORS preflights are avoided for typical same-origin API calls.
4. **Split origins:** Static site on `https://app.example.com`, API on `https://api.example.com` — set `CORS_ORIGINS=https://app.example.com` on the API and `VITE_API_URL=https://api.example.com/api/v1` at build time.

---

## Deploying frontend and backend separately

### Backend only

- Host FastAPI behind **HTTPS** (load balancer, Caddy, nginx, Traefik, managed ALB/API Gateway).
- Set `APP_ENV=production`, `DATABASE_URL`, `JWT_SECRET_KEY`, `CORS_ORIGINS` to your real frontend origin(s).
- Run `alembic upgrade head` on deploy (CI job, init container, or release script).
- Process manager or container: `uvicorn` with `--proxy-headers`; optionally multiple workers (`--workers N`) or migrate to Gunicorn+Uvicorn workers for CPU-bound loads.

### Frontend only

- Build: `pnpm --filter @imeitrack/web build` with `VITE_API_URL` pointing at the public API base (including `/api/v1`).
- Deploy `apps/web/dist` to static hosting (S3+CloudFront, Netlify, Vercel static, nginx).
- Ensure **HTTPS** and that `CORS_ORIGINS` on the API includes your static site origin if the API is on another domain.

### Typical production topology

1. **Single domain:** CDN/reverse proxy → `/` → static SPA, `/api` → FastAPI. Set `VITE_API_URL=/api/v1`, minimal CORS surface.
2. **Two domains:** `app.` + `api.` — configure CORS and absolute `VITE_API_URL`.

---

## Checklist (production)

- [ ] Strong, unique `JWT_SECRET_KEY` (not committed).
- [ ] `APP_ENV=production` and migrations applied before serving traffic.
- [ ] `CORS_ORIGINS` matches real frontend URLs.
- [ ] TLS termination and secure cookies if you add cookie-based auth later.
- [ ] Database credentials via secrets manager, not plain env files in images.
- [ ] Rebuild frontend when API public URL changes (`VITE_API_URL`).
