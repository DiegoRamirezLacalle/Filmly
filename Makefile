.PHONY: up down logs test test-catalog test-users test-frontend

up:
	docker compose -f infra/docker-compose.dev.yml up -d --build

down:
	docker compose -f infra/docker-compose.dev.yml down

logs:
	docker compose -f infra/docker-compose.dev.yml logs -f

test: test-catalog test-users test-frontend
	@echo "✅ All tests completed"

test-catalog:
	@echo "🧪 Testing api-catalog..."
	@cd api-catalog && npm test

test-users:
	@echo "🧪 Testing api-users..."
	@cd api-users && pytest

test-frontend:
	@echo "🧪 Testing frontend..."
	@cd frontend && npm test
