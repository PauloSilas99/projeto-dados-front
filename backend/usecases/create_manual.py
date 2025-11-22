from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

from fastapi.concurrency import run_in_threadpool
from engine_excel_to_pdf.interface import MotorCertificados
from backend.utils import build_response, ensure_pdf, build_resource_urls_id

class CreateManualCertificateUseCase:
    def __init__(self, motor: MotorCertificados):
        self.motor = motor

    async def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        # Heavy processing in threadpool
        resultado = await run_in_threadpool(self.motor.criar_manual, payload)
        
        certificado = resultado["certificado"]
        planilha_path = Path(resultado["planilha"])
        
        bundle = self.motor.csv_manager.get_bundle_by_numero(certificado.numero_certificado)
        if not bundle:
            raise RuntimeError("Falha ao recuperar dados persistidos do certificado.")

        # PDF Generation in threadpool
        pdf_path = await run_in_threadpool(ensure_pdf, bundle, self.motor)
        
        response_payload = build_response(bundle, planilha_path, pdf_path)
        cert_id = certificado.to_dict().get("id")
        if cert_id:
            response_payload["certificado"]["id"] = cert_id
            response_payload["arquivos"]["urls"] = build_resource_urls_id(cert_id)
            
        return response_payload
