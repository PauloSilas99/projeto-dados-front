"""
Dashboard Handlers - Framework-agnostic business logic
"""
from __future__ import annotations

from typing import Any, Dict
from urllib.parse import unquote

from backend.domain.services.pdf_engine import PdfEngine
from backend.domain.services import pdf_service
from backend.domain.exceptions import CertificadoNotFoundError
from backend.application.usecases.dashboard import GetDashboardOverviewUseCase, GetCertificateAnalyticsUseCase
from backend.application.usecases.get_city_heatmap import GetCityHeatmapDataUseCase
from backend.domain.services.geocoding import GeocodingService
from backend.interface.presenters import success, error


class DashboardController:
    """
    Controllers para endpoints do dashboard.
    """
    
    def __init__(self, pdf_engine: PdfEngine, geocoding_service: GeocodingService = None):
        """
        Injeta dependências via construtor.
        
        Args:
            pdf_engine: Interface do motor de PDF
            geocoding_service: Serviço de geocodificação (opcional)
        """
        self.pdf_engine = pdf_engine
        self.geocoding_service = geocoding_service
    
    async def overview(self) -> Dict[str, Any]:
        """Handler para overview do dashboard"""
        usecase = GetDashboardOverviewUseCase(self.pdf_engine)
        dto = usecase.execute()
        return success(dto.model_dump(), message="Panorama geral do dashboard")
    
    async def certificado(self, id: str) -> Dict[str, Any]:
        """Handler para analytics de certificado específico"""
        try:
            cert = pdf_service.load_cert_by_id(unquote(id), self.pdf_engine)
            numero = cert.to_dict().get("numero_certificado", "")
            
            usecase = GetCertificateAnalyticsUseCase(self.pdf_engine)
            payload = usecase.execute(numero)
            
            if not payload:
                return error("Certificado não encontrado.", codigo="CERT_NOT_FOUND", status_code=404)
            return success(payload, message="Dados de dashboard por certificado")
        except CertificadoNotFoundError as e:
            return error(e.message, codigo="CERT_NOT_FOUND", status_code=404)

    async def get_heatmap_data(self) -> Dict[str, Any]:
        """Handler para dados do mapa de calor"""
        if not self.geocoding_service:
            return error("Serviço de geocodificação não configurado", codigo="CONFIG_ERROR", status_code=500)
            
        try:
            from backend.infrastructure.repositories import FileCertificadoRepository
            repo = FileCertificadoRepository(self.pdf_engine)
            
            use_case = GetCityHeatmapDataUseCase(repo, self.geocoding_service)
            result = await use_case.execute()
            return success(result.model_dump(), message="Dados do mapa de calor recuperados com sucesso")
        except Exception as e:
            import traceback
            traceback.print_exc()
            return error(str(e), codigo="HEATMAP_ERROR", status_code=500)

