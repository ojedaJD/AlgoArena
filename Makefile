.PHONY: setup dev build install docker-up docker-down db-migrate db-seed db-setup db-studio judge-build-images typecheck lint

# ── First-time setup (one command to get everything running) ──────────
# Works in both Docker (local) and Codespaces (no Docker) environments.
setup:
	@if command -v docker > /dev/null 2>&1 && docker info > /dev/null 2>&1; then \
		echo "==> Starting PostgreSQL and Redis via Docker..."; \
		docker compose up -d postgres redis; \
		echo "==> Waiting for PostgreSQL to be ready..."; \
		until docker compose exec postgres pg_isready -U postgres > /dev/null 2>&1; do sleep 1; done; \
	else \
		echo "==> Docker not available — using local services (Codespaces)"; \
		echo "==> Ensuring PostgreSQL is running..."; \
		pg_isready > /dev/null 2>&1 || (sudo service postgresql start && sleep 2); \
		echo "==> Configuring PostgreSQL for password-less local access..."; \
		sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';" 2>/dev/null || true; \
		sudo sed -i 's/^local.*all.*postgres.*peer/local all postgres trust/' /etc/postgresql/*/main/pg_hba.conf 2>/dev/null || true; \
		sudo sed -i 's/^host.*all.*all.*127.*md5/host all all 127.0.0.1\/32 trust/' /etc/postgresql/*/main/pg_hba.conf 2>/dev/null || true; \
		sudo service postgresql restart && sleep 2; \
		echo "==> Creating database if it doesn't exist..."; \
		psql -U postgres -h 127.0.0.1 -tc "SELECT 1 FROM pg_database WHERE datname='dsa_platform'" 2>/dev/null | grep -q 1 || \
			psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE dsa_platform;" 2>/dev/null || \
			sudo -u postgres createdb dsa_platform 2>/dev/null || true; \
		echo "==> Ensuring Redis is running..."; \
		redis-cli ping > /dev/null 2>&1 || (redis-server --daemonize yes && sleep 1); \
	fi
	@if [ ! -f .env ]; then cp .env.example .env && echo "==> Created .env from .env.example"; fi
	@if [ ! -f apps/api/.env ]; then cp apps/api/.env.example apps/api/.env && echo "==> Created apps/api/.env"; fi
	@# Fix DB port: Docker uses 5433, Codespaces uses 5432
	@if ! command -v docker > /dev/null 2>&1 || ! docker info > /dev/null 2>&1; then \
		echo "==> Adjusting DATABASE_URL for local PostgreSQL (port 5432)..."; \
		sed -i 's|localhost:5433|localhost:5432|g' .env 2>/dev/null || true; \
		sed -i 's|localhost:5433|localhost:5432|g' apps/api/.env 2>/dev/null || true; \
	fi
	@echo "==> Installing dependencies..."
	npm install
	@echo "==> Generating Prisma client..."
	cd apps/api && npx prisma generate
	@echo "==> Running database migrations..."
	cd apps/api && npx prisma migrate deploy
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
