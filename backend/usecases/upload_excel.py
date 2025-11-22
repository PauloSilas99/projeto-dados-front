from __future__ import annotations

import shutil
import tempfile
from pathlib import Path
from typing import Any, Dict

from fastapi import UploadFile
from fastapi.concurrency import run_in_threadpool

from engine_excel_to_pdf.interface import MotorCertificados
from backend.sanitize_excel import sanitize_excel_for_engine
from backend.utils import build_response, ensure_pdf, build_resource_urls_id
from backend.response import error, success

ALLOWED_EXTENSIONS = {".xlsx", ".xls"}

class UploadExcelUseCase:
    def __init__(self, motor: MotorCertificados):
        self.motor = motor

    async def execute(self, arquivo: UploadFile) -> Dict[str, Any]:
        suffix = Path(arquivo.filename or "").suffix.lower()
        if suffix not in ALLOWED_EXTENSIONS:
            raise ValueError("Formato de arquivo inválido. Use .xlsx ou .xls.")

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_handle:
            temp_path = Path(tmp_handle.name)
        
        try:
            # I/O operation: saving uploaded file
            arquivo.file.seek(0)
            with temp_path.open("wb") as destino:
                shutil.copyfileobj(arquivo.file, destino)
            
            # Heavy processing in threadpool
            try:
                resultado = await run_in_threadpool(self.motor.processar_upload, temp_path)
            except Exception:
                # Retry with sanitization
                safe_path = await run_in_threadpool(sanitize_excel_for_engine, temp_path)
                resultado = await run_in_threadpool(self.motor.processar_upload, safe_path)

            certificado = resultado["certificado"]
            planilha_path = Path(resultado["planilha"])
            
            # Persistence check
            bundle = self.motor.csv_manager.get_bundle_by_numero(certificado.numero_certificado)
            if not bundle:
                raise RuntimeError("Falha ao recuperar dados persistidos do certificado.")

            # PDF Generation in threadpool
            pdf_path = await run_in_threadpool(ensure_pdf, bundle, self.motor)
            
            payload = build_response(bundle, planilha_path, pdf_path)
            cert_id = certificado.to_dict().get("id")
            if cert_id:
                payload["certificado"]["id"] = cert_id
                payload["arquivos"]["urls"] = build_resource_urls_id(cert_id)
            
            return payload

        finally:
            try:
                temp_path.unlink(missing_ok=True)
            except PermissionError:
                pass
