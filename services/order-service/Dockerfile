# ---------- Stage 1: Build ----------
FROM python:3.11-slim AS build

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# ---------- Stage 2: Final ----------
FROM python:3.11-slim

WORKDIR /app

# Copy app files only
COPY --from=build /app /app

# Install runtime dependencies
RUN pip install --no-cache-dir -r requirements.txt

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
