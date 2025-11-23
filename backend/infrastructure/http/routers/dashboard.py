"""
Dashboard Router - Thin wrapper sobre handlers
"""
from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter

from backend.interface.controllers.dashboard_controller import DashboardController

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# Controller será injetado do server.py
_controller: DashboardController | None = None


def setup_controller(controller: DashboardController) -> None:
    """Injeta controller (DI manual)"""
    global _controller
    _controller = controller


@router.get("/overview")
async def dashboard_overview() -> Dict[str, Any]:
    """Endpoint: Panorama geral do dashboard"""
    return await _controller.overview()


@router.get("/certificado")
async def dashboard_certificado(id: str) -> Dict[str, Any]:
    """Endpoint: Analytics de certificado específico"""
    return await _controller.certificado(id)


@router.get("/heatmap")
async def dashboard_heatmap() -> Dict[str, Any]:
    """Endpoint: Dados para mapa de calor (cidades + coordenadas)"""
    return await _controller.get_heatmap_data()