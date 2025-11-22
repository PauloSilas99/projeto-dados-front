.PHONY: help frontend backend dev clean install

help:
	@echo "Comandos disponíveis:"
	@echo "  make install   - Instala todas as dependências (npm + pip)"
	@echo "  make frontend  - Inicia apenas o frontend (Vite)"
	@echo "  make backend   - Inicia apenas o backend (FastAPI)"
	@echo "  make dev       - Inicia frontend e backend simultaneamente"
	@echo "  make clean     - Mata todos os processos (vite + uvicorn)"

install:
	@echo "📦 Instalando dependências do frontend..."
	npm install
	@echo "🐍 Instalando dependências do backend..."
	python3 -m venv .venv
	.venv/bin/pip install -r backend/requirements.txt
	@echo "✅ Instalação completa!"

frontend:
	@echo "🚀 Iniciando frontend em http://localhost:5173"
	npm run dev

backend:
	@echo "🐍 Iniciando backend em http://localhost:8000"
	.venv/bin/uvicorn backend.main:app --reload --port 8000

dev:
	@echo "🚀 Iniciando frontend e backend..."
	@make -j2 frontend backend

clean:
	@echo "🧹 Matando processos..."
	@pkill -f "vite" || true
	@pkill -f "uvicorn" || true
	@echo "✅ Processos finalizados!"

# Docker commands
docker-build:
	@echo "🐳 Building Docker images..."
	docker compose build

docker-up:
	@echo "🐳 Starting containers..."
	docker compose up -d
	@echo "✅ Containers started!"
	@echo "   Frontend: http://localhost:5173"
	@echo "   Backend:  http://localhost:8000"

docker-down:
	@echo "🐳 Stopping containers..."
	docker compose down

docker-logs:
	@echo "📜 Showing logs..."
	docker compose logs -f

docker-restart:
	@echo "🔄 Restarting containers..."
	docker compose restart

docker-clean:
	@echo "🧹 Cleaning Docker resources..."
	docker compose down -v
	docker system prune -f

