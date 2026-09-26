.PHONY: help dev build-all docker-up docker-down clean \
        fastapi-dev node-dev frontend-dev supabase-start test

# Default target
help:
	@echo "======================================================="
	@echo "              STOCKSENSE MAKEFILE COMMANDS             "
	@echo "======================================================="
	@echo "  make dev            - Start docker-compose dev environment"
	@echo "  make docker-up      - Run docker compose in background"
	@echo "  make docker-down    - Stop docker containers"
	@echo "  make fastapi-dev    - Start FastAPI backend"
	@echo "  make node-dev       - Start Node worker"
	@echo "  make frontend-dev   - Start Frontend"
	@echo "  make supabase-start - Start local Supabase instance"
	@echo "  make test           - Run backend and frontend tests"
	@echo "  make clean          - Remove temp/cache files"
	@echo "======================================================="

# --- DOCKER COMMANDS ---
docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-build:
	docker-compose build

# --- INDIVIDUAL SERVICES (LOCAL DEV) ---
fastapi-dev:
	cd backend/fastapi && uvicorn main:app --reload

node-dev:
	cd backend/node-worker && npm run dev

frontend-dev:
	cd frontend && npm run dev

supabase-start:
	supabase start

# --- COMBINED DEV ---
dev: docker-up

# --- TESTING ---
test:
	@echo "Running FastAPI tests..."
	cd backend/fastapi && pytest
	@echo "Running Frontend tests..."
	cd frontend && npm test

# --- CLEANUP ---
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name "node_modules" -exec rm -rf {} +