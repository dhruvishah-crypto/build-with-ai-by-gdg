# Stage 1: Build React Frontend
FROM node:20-alpine AS build-frontend
WORKDIR /frontend

# Copy package config and install dependencies
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

# Copy frontend source and build static assets
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve Backend & Frontend
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./

# Copy built frontend from Stage 1 into the static directory of the backend
COPY --from=build-frontend /frontend/dist ./static

EXPOSE 8080
ENV PORT 8080

# Start server dynamically on the port specified by the environment variable
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
