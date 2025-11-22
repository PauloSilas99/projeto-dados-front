from __future__ import annotations

from typing import Any, Dict
from urllib.parse import unquote
from pathlib import Path

from fastapi.concurrency import run_in_threadpool
from engine_excel_to_pdf.interface import MotorCertificados # Still needed for ensure_pdf if not found?
# Wait, ensure_pdf is a creation action. The repository is for reading.
# If PDF is missing, we might need to regenerate it. 
# Ideally, regeneration is a domain service or use case logic.
# For now, I will keep MotorCertificados in GetCertificateUseCase ONLY for regeneration fallback if I want to be strict,
# OR I can add ensure_pdf capability to the repository (less clean) or a separate service.
# Given the user wants Clean Arch, let's inject BOTH Repository (for reading) and Motor (for generation fallback) 
# OR better: The Use Case orchestrates.
# But wait, `GetCertificateUseCase` was doing `ensure_pdf`.
# Let's inject `MotorCertificados` as `pdf_generator` service alongside `CertificadoRepository`.

from backend.domain.repositories import CertificadoRepository
from backend.utils import ensure_pdf, build_response, build_resource_urls_id

class GetCertificateUseCase:
    def __init__(self, repository: CertificadoRepository, motor: MotorCertificados):
        self.repository = repository
        self.motor = motor

    async def execute(self, id: str) -> Dict[str, Any]:
        # Loading certificate by ID
        cert_entity = await run_in_threadpool(self.repository.get_by_id, id)
        if not cert_entity:
             raise RuntimeError("Certificado não encontrado.")

        # We need the bundle for ensure_pdf... 
        # The repository returns an Entity, not the Bundle.
        # This reveals a leak: ensure_pdf needs the Bundle object from the engine.
        # To fix this cleanly, we'd need a `PdfGenerator` interface that takes an Entity.
        # But `ensure_pdf` is coupled to `CertificadoBundle`.
        # Pragmatic solution: The repository implementation uses the engine, so it *could* return the bundle if we asked,
        # but the interface returns Entity.
        # Let's stick to the plan: "Podemos fazer um wrapper...".
        # For now, I will retrieve the bundle using the motor directly for the regeneration part, 
        # acknowledging this is a hybrid step until `ensure_pdf` is refactored.
        # OR: I can use `get_by_numero` from repository to get entity, then use motor to get bundle.
        
        # Let's use the repository for the primary read.
        
        bundle = self.motor.csv_manager.get_bundle_by_numero(cert_entity.numero_certificado)
        if not bundle:
             raise RuntimeError("Bundle não encontrado (inconsistência de dados).")

        pdf_path = await run_in_threadpool(self.repository.get_pdf_path, cert_entity.numero_certificado)
        if not pdf_path:
            pdf_path = await run_in_threadpool(ensure_pdf, bundle, self.motor)
            
        planilha_path = self.repository.get_consolidated_spreadsheet_path()
        
        # We need to reconstruct the response structure. 
        # `build_response` expects a bundle.
        payload = build_response(bundle, planilha_path, pdf_path)
        payload["certificado"]["id"] = cert_entity.id
        payload["arquivos"]["urls"] = build_resource_urls_id(cert_entity.id)
        
        return payload

class DownloadPdfUseCase:
    def __init__(self, repository: CertificadoRepository, motor: MotorCertificados):
        self.repository = repository
        self.motor = motor

    async def execute(self, id: str) -> Path:
        cert_entity = await run_in_threadpool(self.repository.get_by_id, id)
        if not cert_entity:
             raise RuntimeError("Certificado não encontrado.")
             
        pdf_path = await run_in_threadpool(self.repository.get_pdf_path, cert_entity.numero_certificado)
        
        if not pdf_path:
            # Fallback to regeneration
            bundle = self.motor.csv_manager.get_bundle_by_numero(cert_entity.numero_certificado)
            if bundle:
                pdf_path = await run_in_threadpool(ensure_pdf, bundle, self.motor)
            
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
