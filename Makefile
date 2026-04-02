.PHONY: dev build install docker-up docker-down db-migrate db-seed db-studio judge-build-images

install:
	npm install

dev:
	npx turbo run dev

build:
	npx turbo run build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

db-migrate:
	cd apps/api && npx prisma migrate dev

db-seed:
	cd apps/api && npx prisma db seed

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
