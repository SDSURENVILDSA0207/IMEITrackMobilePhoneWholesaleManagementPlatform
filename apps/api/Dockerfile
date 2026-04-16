# Build from repository root: docker build -f apps/api/Dockerfile .
FROM python:3.12-slim-bookworm

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl libpq5 \
  && rm -rf /var/lib/apt/lists/*

COPY apps/api/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
  && pip install --no-cache-dir -r requirements.txt

COPY apps/api/ .

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

RUN chmod +x docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./docker-entrypoint.sh"]
