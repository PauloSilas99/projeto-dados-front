from __future__ import annotations

import os
from typing import List

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.domain.exceptions import ValidationError as DomainValidationError
from backend.domain.services.system_state import SystemStateService
from backend.interface.presenters import error

# Infrastructure
from backend.infrastructure.adapters.pdf_engine_adapter import EnginePdfAdapter
from backend.infrastructure.adapters.nominatim_adapter import NominatimAdapter
from backend.infrastructure.repositories import FileCertificadoRepository
from backend.infrastructure.factories import make_engine_config

# Controllers
from backend.interface.controllers.certificados_controller import CertificadosController
from backend.interface.controllers.dashboard_controller import DashboardController
from backend.interface.controllers.admin_controller import AdminController

# Routers
from backend.infrastructure.http.routers import certificados, dashboard, admin


def _get_cors_origins() -> List[str]:
    """Retorna origens permitidas para CORS"""
    raw_origins = os.getenv("BACKEND_CORS_ORIGINS", "*")
    origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    return origins if origins else ["*"]


def create_app() -> FastAPI:
    """
    Factory function para criar a aplicação FastAPI.
    Realiza a composição de dependências (DI Manual).
    """
    app = FastAPI(
        title="Engine Excel to PDF API",
        description="Serviço backend com Clean Architecture e DI Manual (estilo Go/Node).",
        version="2.0.0",
    )

    # Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_get_cors_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Exception Handlers
    @app.exception_handler(DomainValidationError)
    async def _handle_domain_validation_error(request, exc: DomainValidationError) -> JSONResponse:
        return error("Falha de validação", codigo="VALIDATION_ERROR", detalhes=exc.errors, status_code=400)

    @app.exception_handler(RequestValidationError)
    async def _handle_request_validation_error(request, exc: RequestValidationError) -> JSONResponse:
        return error("Entrada inválida na requisição", codigo="REQUEST_VALIDATION_ERROR", detalhes=exc.errors(), status_code=422)

    # Health Check
    @app.get("/health")
    async def health_check() -> dict:
        return {"message": "Saúde do serviço", "data": {"status": "ok"}, "sucesso": True}

    # Dependency Injection & Setup
    @app.on_event("startup")
    def setup_dependencies():
        # 1. Configuração e Serviços de Domínio
        config = make_engine_config()
        system_state = SystemStateService()
        
        # Inicializa estado do sistema
        system_state.set_motor_created_at(os.getenv("START_TIME", "unknown"))

        # GARANTIA: Cria diretórios explicitamente antes do motor iniciar
        # Isso resolve problemas onde volumes do Docker mascaram diretórios criados no build
        try:
            out_dir = config.output_dir
            # Garante que o diretório pai existe (parents=True)
            os.makedirs(out_dir / "pdfs", parents=True, exist_ok=True)
            os.makedirs(out_dir / "planilhas", parents=True, exist_ok=True)
            # Cria também uploads e results na raiz (mapeados via volume)
            os.makedirs("/app/uploads", parents=True, exist_ok=True)
            os.makedirs("/app/results", parents=True, exist_ok=True)
            print(f"✅ Diretórios criados/verificados: {out_dir}, /app/uploads, /app/results")
        except Exception as e:
            print(f"⚠️ Aviso: Falha ao criar diretórios: {e}")

        # 2. Instancia dependências da infraestrutura
        pdf_engine = EnginePdfAdapter(config)
        repository = FileCertificadoRepository(pdf_engine)
        geocoding_service = NominatimAdapter()

        # 3. Cria controllers com DI via construtor
        certificados_controller = CertificadosController(
            pdf_engine=pdf_engine,
            repository=repository
        )
        dashboard_controller = DashboardController(
            pdf_engine=pdf_engine,
            geocoding_service=geocoding_service
        )
        admin_controller = AdminController(
            pdf_engine=pdf_engine,
            system_state=system_state
        )

        # 4. Injeta controllers nos routers
        certificados.setup_controller(certificados_controller)
        dashboard.setup_controller(dashboard_controller)
        admin.setup_controller(admin_controller)

    # Registra routers
    app.include_router(certificados.router)
    app.include_router(dashboard.router)
    app.include_router(admin.router)

    return app
