from __future__ import annotations

from typing import Any, Dict
from urllib.parse import unquote

from fastapi import APIRouter, Depends, HTTPException

from backend.deps import get_analytics_service, get_motor
from backend.analytics_service import AnalyticsService
from backend.utils import load_cert_by_id
from backend.response import success, error


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/overview")
async def dashboard_overview(
    analytics: AnalyticsService = Depends(get_analytics_service),
) -> Dict[str, Any]:
    return success(analytics.overview(), message="Panorama geral do dashboard")


@router.get("/certificado")
async def dashboard_certificado(
    id: str,
    analytics: AnalyticsService = Depends(get_analytics_service),
    motor = Depends(get_motor),
) -> Dict[str, Any]:
    cert = load_cert_by_id(unquote(id), motor)
    numero = cert.to_dict().get("numero_certificado", "")
    payload = analytics.certificado_especifico(numero)
    if not payload:
        return error("Certificado não encontrado.", codigo="CERT_NOT_FOUND", status_code=404)
    return success(payload, message="Dados de dashboard por certificado")