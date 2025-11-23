"""
Admin Router - Thin wrapper sobre handlers
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from pathlib import Path

from fastapi import APIRouter, Request, Query
from fastapi.responses import FileResponse, JSONResponse

from backend.interface.controllers.admin_controller import AdminController

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Controller será injetado do server.py
_controller: AdminController | None = None


def setup_controller(controller: AdminController) -> None:
    """Injeta controller (DI manual)"""
    global _controller
    _controller = controller


@router.post("/clear-cache")
async def clear_cache(request: Request) -> Dict[str, Any]:
    """Endpoint: Limpar cache"""
    client_host = request.client.host if request.client else "unknown"
    return await _controller.clear_cache(client_host)


@router.get("/cache-status")
async def cache_status(request: Request) -> Dict[str, Any]:
    """Endpoint: Status do cache"""
    return await _controller.cache_status()


@router.get("/pdfs")
async def listar_pdfs(
    q: Optional[str] = Query(default=None),
    doc_type: Optional[str] = Query(default=None),
    data_de: Optional[str] = Query(default=None),
    data_ate: Optional[str] = Query(default=None),
    limit: int = 50,
    offset: int = 0,
) -> Dict[str, Any]:
    """Endpoint: Listar PDFs"""
    return await _controller.listar_pdfs(q, doc_type, data_de, data_ate, limit, offset)


@router.get("/pdfs/preview", response_model=None)
async def preview_pdf(name: str):
    """Endpoint: Preview de PDF"""
    result = await _controller.preview_pdf(name)
    
    if isinstance(result, Path):
        return FileResponse(path=result, media_type="application/pdf")
    
    return result


@router.get("/pdfs/download", response_model=None)
async def download_pdf(name: str):
    """Endpoint: Download de PDF"""
    result = await _controller.download_pdf(name)
    
    if isinstance(result, Path):
        return FileResponse(path=result, filename=result.name, media_type="application/pdf")
    
    return result


@router.post("/pdfs/download-zip", response_model=None)
async def download_zip(body: Dict[str, Any]):
    """Endpoint: Download de ZIP"""
    names: List[str] = body.get("names", [])
    result = await _controller.download_zip(names)
    
    if isinstance(result, Path):
        return FileResponse(path=result, filename="documentos.zip", media_type="application/zip")
    
    return result


@router.delete("/pdfs")
async def delete_pdfs(body: Dict[str, Any]) -> Dict[str, Any]:
    """Endpoint: Deletar PDFs"""
    names: List[str] = body.get("names", [])
    return await _controller.delete_pdfs(names)
