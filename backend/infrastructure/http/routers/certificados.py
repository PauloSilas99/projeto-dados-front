"""
Certificados Router - Thin wrapper sobre handlers
FastAPI-specific: apenas roteamento HTTP
Lógica de negócio está nos handlers (framework-agnostic)
"""
from __future__ import annotations

from typing import Any, Dict, List
from pathlib import Path

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import FileResponse, JSONResponse

from backend.interface.controllers.certificados_controller import CertificadosController

router = APIRouter(prefix="/certificados", tags=["certificados"])

# Controller será injetado do server.py (DI manual)
_controller: CertificadosController | None = None


def setup_controller(controller: CertificadosController) -> None:
    """
    Injeta controller configurado do server.py (DI manual estilo Go).
    
    Args:
        controller: Instância com dependências já injetadas
    """
    global _controller
    _controller = controller


@router.post("")
async def criar_certificado_manual(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Endpoint: Criar certificado manual"""
    return await _controller.criar_manual(payload)


@router.get("")
async def listar_certificados(
    id: str | None = None,
    bairro: str | None = None,
    cidade: str | None = None,
    min_valor: float | None = None,
    max_valor: float | None = None,
    limit: int = 100,
    offset: int = 0,
) -> Dict[str, Any]:
    """Endpoint: Listar certificados com filtros"""
    return await _controller.listar(
        id=id,
        bairro=bairro,
        cidade=cidade,
        min_valor=min_valor,
        max_valor=max_valor,
        limit=limit,
        offset=offset
    )


@router.post("/upload-excel")
async def upload_excel(arquivo: UploadFile = File(...)) -> Dict[str, Any]:
    """Endpoint: Upload de Excel"""
    return await _controller.upload_excel(arquivo)



@router.get("/{id}")
async def obter_por_id(id: str) -> Dict[str, Any]:
    """Endpoint: Obter certificado por ID"""
    return await _controller.obter_por_id(id)


@router.get("/{id}/pdf", response_model=None)
async def baixar_pdf_por_id(id: str):
    """Endpoint: Baixar PDF de certificado"""
    result = await _controller.baixar_pdf(id)
    
    # Se retornou Path, é sucesso - retorna FileResponse
    if isinstance(result, Path):
        return FileResponse(path=result, filename=result.name, media_type="application/pdf")
    
    # Se retornou Dict, é erro - já formatado pelo handler
    return result


@router.get("/{id}/planilha", response_model=None)
async def baixar_planilha_por_id(id: str):
    """Endpoint: Baixar planilha consolidada"""
    result = await _controller.baixar_planilha(id)
    
    # Se retornou Path, é sucesso - retorna FileResponse
    if isinstance(result, Path):
        return FileResponse(
            path=result,
            filename=result.name,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    
    # Se retornou Dict, é erro
    return result


@router.get("/planilha", response_model=None)
async def baixar_planilha_global():
    """Endpoint: Baixar planilha consolidada global (atualizada)"""
    result = await _controller.baixar_planilha_global()
    if isinstance(result, Path):
        return FileResponse(
            path=result,
            filename=result.name,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    return result
