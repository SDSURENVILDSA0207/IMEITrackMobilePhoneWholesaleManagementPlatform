# IMEITrack API

## Run locally

1. Create and activate a virtual environment:
   - `python3 -m venv .venv`
   - `source .venv/bin/activate`
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Copy environment file:
   - `cp .env.example .env`
4. Run the API:
   - `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

Health endpoints:
- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`

Auth endpoints:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me` (Bearer token)
- `GET /api/v1/protected/admin-only` (admin role)

## Alembic quickstart

- Create migration: `alembic revision --autogenerate -m "init"`
- Apply migration: `alembic upgrade head`
