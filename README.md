# IMEITrack

**IMEITrack** is a full-stack **B2B mobile phone wholesale management platform**. It helps distributors and wholesalers track procurement, inventory (including IMEI-level traceability), sales orders, and returns (RMA) in one place—with role-based access for operations, sales, and administration.

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Root scripts](#root-scripts)
- [Quick start](#quick-start)
- [Backend setup](#backend-setup)
- [Frontend setup](#frontend-setup)
- [Environment variables](#environment-variables)
- [Docker and deployment](#docker-and-deployment)
- [Database migrations](#database-migrations)
- [Seeding sample data](#seeding-sample-data)
- [User roles](#user-roles)
- [Continuous integration](#continuous-integration)
- [Screenshots](#screenshots)
- [Future improvements](#future-improvements)
- [License](#license)

---

## Overview

IMEITrack models the lifecycle of mobile devices from **supplier purchase orders** through **receiving batches**, **IMEI registration**, **customer sales**, and **return handling**. A unified **analytics dashboard** surfaces KPIs, recent orders, low-stock signals, and distribution views for returns and inventory condition grades.

The codebase is organized as a **pnpm monorepo**: a **FastAPI** backend (`apps/api`, installable as **`imeitrack-api`** from `pyproject.toml`) and a **React** single-page app (`@imeitrack/web` in `apps/web`). Workspace packages under `packages/` (`@imeitrack/config`, `@imeitrack/types`, `@imeitrack/ui`) are available for shared code as the monorepo grows.

---

## Features

| Area | Capabilities |
|------|----------------|
| **Authentication** | JWT access tokens, protected API routes, session bootstrap on the client |
| **RBAC** | Role-gated UI and API actions (admin, inventory, sales) |
| **Master data** | Suppliers, customers, product models |
| **Procurement** | Purchase orders, line items, status workflow |
| **Inventory** | Device records with IMEI, condition grade, lock status, batch linkage, filters |
| **Sales** | Sales orders, customer assignment, device allocation with pricing, order status |
| **Returns / RMA** | Return requests tied to shipped/delivered orders and sold devices, status workflow |
| **Inventory intake** | Batch-oriented device receiving workflows (API module `inventory_intake`) |
| **Analytics** | KPI cards, recent PO/SO lists, return and condition summaries, low-stock watchlist |
| **Copilot (insights)** | Rule-based operations signals: low stock, slow movers, trends, and alert-style summaries (`/api/v1/copilot/...`) |
| **Assistant** | In-app assistant with role-aware suggested prompts and chat (`/api/v1/assistant/...`); pluggable `ASSISTANT_PROVIDER` (default: grounded) |
| **UX** | Toasts, confirmations, loading states, responsive dashboard shell |

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Redux Toolkit, React Router, React Hook Form, Zod, Axios, Lucide (icons) |
| **Backend** | Python 3, FastAPI, SQLAlchemy 2, Alembic, Pydantic Settings; package metadata in `pyproject.toml` (setuptools build backend) |
| **Database** | PostgreSQL 16 |
| **Auth** | JWT (python-jose), Passlib (bcrypt) |
| **Tooling** | pnpm 10 workspaces (`packageManager` in root `package.json`), ESLint, `concurrently` for API + web dev |

Infrastructure is defined under `infra/docker/`: Postgres-only dev compose, optional pgAdmin, and a **full-stack** `docker-compose.yml` (Postgres + API + nginx SPA). Dockerfiles live under `apps/api/` and `apps/web/`.

---

## Repository structure

```text
.
├── .github/
│   └── workflows/           # GitHub Actions CI (web lint/build, API install + compileall)
├── apps/
│   ├── api/                 # FastAPI application; pip-installable (see pyproject.toml)
│   │   ├── app/             # Main package: routes, models, services, schemas
│   │   ├── alembic/         # Database migrations
│   │   ├── scripts/         # e.g. seed for demo data
│   │   ├── pyproject.toml   # Project metadata, dependencies, setuptools package discovery
│   │   ├── requirements.txt
│   │   └── .env.example
│   └── web/                 # React + Vite SPA (@imeitrack/web)
│       └── src/
│           ├── app/         # Router, layouts, navigation, providers
│           ├── components/  # Shared UI (tables, toast, etc.)
│           ├── features/    # Domain modules (auth, inventory, orders, …)
│           └── shared/      # API client, hooks, utilities
├── packages/                # @imeitrack/config, @imeitrack/types, @imeitrack/ui
├── infra/
│   └── docker/              # docker-compose for Postgres, full stack, or dev-only
├── docs/                    # architecture.md, api-contracts.md, deployment.md
├── package.json             # Root scripts: dev, dev:web, dev:api, build, lint, typecheck, seed
├── pnpm-workspace.yaml
└── README.md
```

---

## Prerequisites

- **Node.js** 20+ locally (or compatible); **CI** currently uses Node **22** for the web build
- **pnpm 10+** (declared in root `package.json` as `packageManager`; use [Corepack](https://nodejs.org/api/corepack.html): `corepack enable` then `pnpm install`)
- **Python** 3.10+ (3.12 is used in CI for the API job); 3.11+ recommended for local work
- **PostgreSQL** 16 (or use the provided Docker Compose file)
- **pip** 24+ recommended for `pip install -e apps/api` (editable install uses **setuptools** via `pyproject.toml`); a virtual environment is recommended for the API

---

## Root scripts

Run from the **repository root** (after `pnpm install`):

| Script | What it does |
|--------|----------------|
| `pnpm dev` | Vite dev server for `@imeitrack/web` **and** API via `uvicorn` (`apps.api.app.main:app` on port 8000) |
| `pnpm dev:web` | Frontend only |
| `pnpm dev:api` | API only (same `uvicorn` entrypoint as `dev`) |
| `pnpm build` | `pnpm -r build` — builds all workspace packages that define `build` |
| `pnpm lint` | ESLint for the web app |
| `pnpm typecheck` | `tsc --noEmit` for the web app |
| `pnpm seed:api` | Run `scripts.seed` under `apps/api` (idempotent) |
| `pnpm seed:api:force` | Wipe app tables and reseed |

> Root scripts use **pnpm** (`pnpm --filter @imeitrack/web …`). If you use npm at the root, those filter-based commands will not work as written—use pnpm, or run the web and API processes manually (see below).

---

## Quick start

1. **Start PostgreSQL** (Docker example):

   ```bash
   docker compose -f infra/docker/docker-compose.dev.yml up -d
   ```

2. **Install JS dependencies** (from repo root):

   ```bash
   pnpm install
   ```

3. **Configure and migrate the API** (see [Backend setup](#backend-setup) and [Database migrations](#database-migrations)).

4. **Run API + web together** (from repo root, with `pnpm`):

   ```bash
   pnpm dev
   ```

   - Frontend: Vite dev server (default `http://localhost:5173`)
   - API: Uvicorn (default `http://localhost:8000`, module `apps.api.app.main:app` — run the command from the **repo root** so Python can resolve the `apps.*` package path)

5. **Default login** (after seeding or manual registration):  
   `admin@imeitrack.app` / `Admin123!`
   (see [Seeding sample data](#seeding-sample-data))

---

## Backend setup

1. **Create a virtual environment** (recommended):

   ```bash
   cd apps/api
   python3 -m venv .venv
   source .venv/bin/activate   # Windows: .venv\Scripts\activate
   ```

2. **Install dependencies** (pick one approach):

   **A. Classic (from `apps/api`, matches many tutorials):**

   ```bash
   pip install -r requirements.txt
   ```

   **B. Editable install (same as CI):** with your venv **activated**, run from the **repository root**:

   ```bash
   python3 -m pip install --upgrade pip
   pip install -e apps/api
   ```

   This installs the `imeitrack-api` package and its `pyproject.toml` dependencies into your environment.

3. **Environment file**:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set `DATABASE_URL` and `JWT_SECRET_KEY` (see [Environment variables](#environment-variables)).

4. **Run the API** from `apps/api` (the `app` package must resolve on the import path):

   ```bash
   cd apps/api
   source .venv/bin/activate   # if using a venv
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   The root script `pnpm dev` runs the API with `uvicorn` from the **repo root** using `python3 -m uvicorn apps.api.app.main:app` (same as `pnpm dev:api`). Running from `apps/api` with `uvicorn app.main:app` is an alternative; keep **one** working layout so imports and `PYTHONPATH` stay consistent.

5. **API health** (after migrations):

   - `GET /api/v1/health/live`
   - `GET /api/v1/health/ready`

Interactive docs: `http://localhost:8000/api/v1/docs` (OpenAPI is mounted under the API v1 prefix).

---

## Frontend setup

1. From the **repository root**:

   ```bash
   pnpm install
   ```

2. **Development server only**:

   ```bash
   pnpm dev:web
   ```

3. **Configure the API base URL** (optional). The client defaults to `http://localhost:8000/api/v1`. To override, create `apps/web/.env.local`:

   ```bash
   VITE_API_URL=http://localhost:8000/api/v1
   ```

4. **Production build**:

   ```bash
   pnpm build
   ```

   Output is `apps/web/dist/`.

---

## Environment variables

### Backend (`apps/api/.env`)

| Variable | Description |
|----------|-------------|
| `APP_NAME` | Application name (default: IMEITrack API) |
| `APP_ENV` | e.g. `development` / `production` |
| `API_V1_PREFIX` | API prefix (default: `/api/v1`) |
| `DATABASE_URL` | SQLAlchemy URL, e.g. `postgresql+psycopg2://postgres:postgres@localhost:5432/imeitrack` |
| `CORS_ORIGINS` | Allowed browser origins (comma-separated or list) |
| `JWT_SECRET_KEY` | **Required in production** — strong secret for signing tokens |
| `JWT_ALGORITHM` | Default: `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime |
| `ASSISTANT_PROVIDER` | Assistant backend: default `grounded` (in-app, data-aware behavior); set if you add external providers |
| `ASSISTANT_API_KEY` | Optional key for a future external LLM provider (unused when `grounded`) |

See `apps/api/.env.example` for a starting template. For production, compare `apps/api/.env.production.example` and [`docs/deployment.md`](docs/deployment.md).

### Frontend (`apps/web/.env.local` — optional)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Base URL for the REST API (must include `/api/v1` if your server uses that prefix). |

Templates: `apps/web/.env.example`, `apps/web/.env.production.example`.

---

## Docker and deployment

**Full stack (PostgreSQL + API + nginx SPA with `/api` proxy)** from the repository root:

```bash
docker compose -f infra/docker/docker-compose.yml up --build
```

- UI: [http://localhost](http://localhost) (API under same origin: `/api/v1/...`)
- API docs: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)

Production-oriented env templates, CORS notes, split deploy (static + API), and image build commands are documented in [`docs/deployment.md`](docs/deployment.md).

The legacy **Postgres-only** compose file remains at `infra/docker/docker-compose.dev.yml` (no API/web containers).

---

## Database migrations

Migrations are managed with **Alembic** from `apps/api`. In **development** (`APP_ENV=development`), the API also runs `Base.metadata.create_all()` on startup so a fresh Postgres instance gets tables without an initial migration. For **production**, rely on Alembic and avoid depending on that startup DDL.

1. Ensure PostgreSQL is running and `DATABASE_URL` in `.env` is correct.

2. From `apps/api` (with venv activated):

   ```bash
   cd apps/api
   export PYTHONPATH=.
   # If no revision exists yet, generate from models:
   alembic revision --autogenerate -m "describe_change"
   # Apply all migrations:
   alembic upgrade head
   ```

3. **Rollback one revision** (optional):

   ```bash
   alembic downgrade -1
   ```

> **Note:** If `alembic/versions/` has no revision files yet, either generate an initial migration with `alembic revision --autogenerate` (models loaded) or, for local dev only, depend on `create_all` until you add migrations. Production deployments should have real Alembic revisions in version control.

---

## Seeding sample data

A scripted seed loads realistic wholesale data: users, suppliers, customers, product models, devices (with IMEIs), purchase orders, sales orders, inventory batches, and return requests.

**Requirements:** migrations applied; database reachable.

From the **repository root**:

```bash
pnpm seed:api
```

First run skips if `admin@imeitrack.app` already exists. To **wipe** application tables and reseed:

```bash
pnpm seed:api:force
```

Or manually:

```bash
cd apps/api
PYTHONPATH=. python3 -m scripts.seed --force
```

**Seed accounts** (password for all: `Admin123!`):

| Email | Role |
|-------|------|
| `admin@imeitrack.app` | Admin |
| `inventory@imeitrack.app` | Inventory manager |
| `sales@imeitrack.app` | Sales manager |

---

## User roles

| Role | Typical use |
|------|-------------|
| **admin** | Full access to configuration, user management patterns, and all operational modules |
| **inventory_manager** | Procurement, receiving, inventory, device intake, fulfillment-oriented updates |
| **sales_manager** | Customers, sales orders, pricing, and customer-facing order workflows |

Exact permissions are enforced in the API and mirrored in the UI (e.g. purchase vs sales vs return status updates).

---

## Continuous integration

[GitHub Actions](.github/workflows/ci.yml) runs on every push to `main` and on pull requests:

- **web** — checks out the repo, sets up pnpm, **Node 22**, runs `pnpm install`, then `pnpm --filter @imeitrack/web lint` and `pnpm --filter @imeitrack/web build`.
- **api** — **Python 3.12**; upgrades `pip`, runs **`pip install -e apps/api`** (requires `[build-system]` + setuptools in `apps/api/pyproject.toml`), then **`python -m compileall apps/api/app`** to catch syntax errors in the application package.

---

## Screenshots

_Add portfolio-ready screenshots here (e.g. under `docs/screenshots/`). Suggested captures:_

| # | Suggested capture |
|---|-------------------|
| 1 | **Dashboard** — KPI cards, return/condition summaries, recent PO/SO |
| 2 | **Inventory** — device table with IMEI, grade, and status |
| 3 | **Sales order** — line items, device assignment, totals |
| 4 | **Returns / RMA** — return list and detail with status workflow |
| 5 | **Copilot / Assistant** — insights panel and in-app assistant (if visible in your build) |

_Example Markdown once images exist:_

`![Dashboard](docs/screenshots/dashboard.png)`

---

## Future improvements

- **Automated tests** — expand API and E2E coverage for critical flows (orders, IMEI uniqueness, RMA rules).
- **CI** — extend the existing pipeline with typecheck, API tests, and migration validation on pull requests.
- **Observability** — structured logging, metrics, and tracing for production deployments.
- **Mobile / PWA** — lightweight warehouse scanning or approval workflows.
- **Multi-tenant** — optional organization boundaries for multi-branch operations.
- **Document export** — PDF packing slips and invoices from sales orders.

---

## License

This project is provided as-is for demonstration and portfolio use. Add a `LICENSE` file if you distribute or reuse the code.

---

*Built with a focus on clarity, traceability, and operational realism for mobile wholesale teams.*
