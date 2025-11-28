from __future__ import annotations

from typing import Any, Dict
from pathlib import Path

import asyncio

from backend.domain.services.pdf_engine import PdfEngine
from backend.domain.repositories import CertificadoRepository
from backend.domain.entities import CertificadoBundleEntity
from backend.domain.services import pdf_service
from backend.domain.exceptions import CertificadoNotFoundError, DataInconsistencyError

class GetCertificateUseCase:
    def __init__(self, repository: CertificadoRepository, pdf_engine: PdfEngine):
        self.repository = repository
        self.pdf_engine = pdf_engine

    async def execute(self, id: str) -> Dict[str, Any]:
        # Loading certificate by ID
        cert_entity = await asyncio.to_thread(self.repository.get_by_id, id)
        if not cert_entity:
            raise CertificadoNotFoundError(identifier=id)

        bundle = self.pdf_engine.get_bundle_by_numero(cert_entity.numero_certificado)
        if not bundle:
            raise DataInconsistencyError("Bundle não encontrado (inconsistência de dados).")

        pdf_path = await asyncio.to_thread(self.repository.get_pdf_path, cert_entity.numero_certificado)
        if not pdf_path:
            pdf_path = await asyncio.to_thread(pdf_service.ensure_pdf, bundle, self.pdf_engine)
            
        planilha_path = self.repository.get_consolidated_spreadsheet_path()
        
        return {
            "numero_certificado": cert_entity.numero_certificado,
            "planilha": planilha_path,
            "pdf": pdf_path,
            "cert_id": cert_entity.id,
        }

class DownloadPdfUseCase:
    def __init__(self, repository: CertificadoRepository, pdf_engine: PdfEngine):
        self.repository = repository
        self.pdf_engine = pdf_engine

    async def execute(self, id: str) -> Path:
        cert_entity = await asyncio.to_thread(self.repository.get_by_id, id)
        if not cert_entity:
            raise CertificadoNotFoundError(identifier=id)
              
        # Tenta localizar por nome + número para evitar colisões
        pdf_path = await asyncio.to_thread(self.repository.get_pdf_path, cert_entity.numero_certificado)
        
        # Sempre garantir a cópia prefixada por cidade quando houver cidade disponível
        if pdf_path and cert_entity.cidade:
            pdf_path = await asyncio.to_thread(pdf_service.ensure_city_prefixed_copy, pdf_path, cert_entity.cidade, self.pdf_engine)
        elif not pdf_path:
            # Fallback to regeneration
            bundle = self.pdf_engine.get_bundle_by_numero(cert_entity.numero_certificado)
            if bundle:
                pdf_path = await asyncio.to_thread(pdf_service.ensure_pdf, bundle, self.pdf_engine)
            
        if not pdf_path or not pdf_path.exists():
            raise FileNotFoundError("PDF não encontrado.")
            
        return pdf_path

class DownloadSpreadsheetUseCase:
    def __init__(self, repository: CertificadoRepository):
        self.repository = repository

    async def execute(self, id: str) -> Path:
        planilha_path = self.repository.get_consolidated_spreadsheet_path()
        if not planilha_path.exists():
            raise FileNotFoundError("Planilha ainda não foi gerada.")
        return planilha_path
