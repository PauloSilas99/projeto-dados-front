from __future__ import annotations

from pathlib import Path
import asyncio
from typing import Any, Dict

from backend.domain.services.pdf_engine import PdfEngine
from backend.domain.services import pdf_service
from backend.domain.exceptions import DataInconsistencyError
from backend.application.dtos import CertificateCreatedDTO

class CreateManualCertificateUseCase:
    def __init__(self, pdf_engine: PdfEngine):
        self.pdf_engine = pdf_engine

    async def execute(self, payload: Dict[str, Any]) -> CertificateCreatedDTO:
        # Heavy processing in threadpool
        resultado = await asyncio.to_thread(self.pdf_engine.criar_certificado_manual, payload)
        
        certificado = resultado["certificado"]
        planilha_path = Path(resultado["planilha"])
        
        bundle = self.pdf_engine.get_bundle_by_numero(certificado.numero_certificado)
        if not bundle:
            raise DataInconsistencyError("Falha ao recuperar dados persistidos do certificado.")

        # PDF Generation in threadpool
        pdf_path = await asyncio.to_thread(pdf_service.ensure_pdf, bundle, self.pdf_engine)
        
        cert_id = certificado.to_dict().get("id")
        
        return CertificateCreatedDTO(
            id=cert_id,
            numero_certificado=str(certificado.numero_certificado),
            planilha_path=planilha_path,
            pdf_path=pdf_path,
            bundle=bundle
        )
