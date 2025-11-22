from __future__ import annotations

import os
from typing import Any, Dict, List
from pathlib import Path
from pathlib import Path
from pathlib import Path

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from engine_excel_to_pdf.validators import ValidationError

from .response import error, success

from .routers.certificados import router as certificados_router
from .routers.dashboard import router as dashboard_router
from .routers.admin import router as admin_router
from .deps import init_motor

 


app = FastAPI(
    title="Engine Excel to PDF API",
    description="Serviço backend para integração do motor de certificados com o frontend.",
    version="1.0.0",
)


 


def _get_cors_origins() -> List[str]:
    """
    Retorna a lista de origens permitidas para CORS.
    """
    raw_origins = os.getenv("BACKEND_CORS_ORIGINS", "*")
    origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    return origins if origins else ["*"]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _on_startup() -> None:
    app.state.motor = init_motor()


 


@app.get("/health")
async def health_check() -> dict:
    return {"message": "Saúde do serviço", "data": {"status": "ok"}, "sucesso": True}


@app.exception_handler(ValidationError)
async def _handle_engine_validation_error(request, exc: ValidationError) -> JSONResponse:
    return error("Falha de validação do motor", codigo="VALIDATION_ERROR", detalhes=exc.errors, status_code=400)


@app.exception_handler(RequestValidationError)
async def _handle_request_validation_error(request, exc: RequestValidationError) -> JSONResponse:
    return error("Entrada inválida na requisição", codigo="REQUEST_VALIDATION_ERROR", detalhes=exc.errors, status_code=422)


app.include_router(certificados_router)
app.include_router(dashboard_router)
app.include_router(admin_router)


















if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host=os.getenv("UVICORN_HOST", "0.0.0.0"),
        port=int(os.getenv("UVICORN_PORT", "8000")),
        reload=os.getenv("UVICORN_RELOAD", "false").lower() == "true",
    )


