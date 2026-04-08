.PHONY: setup dev build install docker-up docker-down db-migrate db-seed db-setup db-studio judge-build-images typecheck lint

# ── First-time setup (one command to get everything running) ──────────
setup:
	@echo "==> Starting PostgreSQL and Redis..."
	docker compose up -d postgres redis
	@echo "==> Waiting for PostgreSQL to be ready..."
	@until docker compose exec postgres pg_isready -U postgres > /dev/null 2>&1; do sleep 1; done
	@if [ ! -f .env ]; then cp .env.example .env && echo "==> Created .env from .env.example"; fi
	@if [ ! -f apps/api/.env ]; then cp apps/api/.env.example apps/api/.env && echo "==> Created apps/api/.env"; fi
	@echo "==> Installing dependencies..."
	npm install
	@echo "==> Running database migrations..."
	cd apps/api && npx prisma migrate deploy
	@echo "==> Generating Prisma client..."
	cd apps/api && npx prisma generate
	@echo "==> Seeding database (topics, problems, curriculum)..."
	cd apps/api && npx prisma db seed
	@echo "==> Importing curriculum content from Markdown..."
	npm run curriculum:import
	@echo ""
	@echo "Setup complete! Run 'make dev' to start the application."

install:
	npm install

dev:
	npx turbo run dev

build:
	npx turbo run build

docker-up:
	docker compose up -d postgres redis

docker-down:
	docker compose down

db-migrate:
	cd apps/api && npx prisma migrate deploy

db-seed:
	cd apps/api && npx prisma db seed

db-setup:
	cd apps/api && npx prisma migrate deploy && npx prisma db seed

db-studio:
	cd apps/api && npx prisma studio

judge-build-images:
	docker build -t dsa-judge-python:latest judge-images/python/
	docker build -t dsa-judge-node:latest judge-images/node/
	docker build -t dsa-judge-cpp:latest judge-images/cpp/
	docker build -t dsa-judge-java:latest judge-images/java/

typecheck:
	npx turbo run typecheck

lint:
	npx turbo run lint
