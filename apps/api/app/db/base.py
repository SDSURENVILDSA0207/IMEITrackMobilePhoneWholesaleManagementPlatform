from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base SQLAlchemy declarative class for all models."""

    pass


# Model modules import `Base` from here. Import `app.models` in `main.py` and `alembic/env.py`
# so all tables register on `Base.metadata` (avoid importing models here — circular import).
