from __future__ import annotations

import shutil
import tempfile
from pathlib import Path
from typing import Any, Dict

import asyncio

from backend.domain.services.pdf_engine import PdfEngine
from backend.domain.services.excel_sanitizer import sanitize_excel_for_engine
from backend.domain.exceptions import ValidationError, DataInconsistencyError
from backend.domain.services import pdf_service
from backend.application.dtos import CertificateCreatedDTO

ALLOWED_EXTENSIONS = {".xlsx", ".xls"}

class UploadExcelInput:
    filename: str
    file_bytes: bytes

    def __init__(self, filename: str, file_bytes: bytes):
        self.filename = filename
        self.file_bytes = file_bytes


class UploadExcelUseCase:
    def __init__(self, pdf_engine: PdfEngine):
        self.pdf_engine = pdf_engine

    async def execute(self, inp: UploadExcelInput) -> CertificateCreatedDTO:
        suffix = Path(inp.filename or "").suffix.lower()
        if suffix not in ALLOWED_EXTENSIONS:
            raise ValidationError("Formato de arquivo inválido. Use .xlsx ou .xls.")

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_handle:
            temp_path = Path(tmp_handle.name)

        try:
            with temp_path.open("wb") as destino:
                destino.write(inp.file_bytes)

            try:
                resultado = await asyncio.to_thread(self.pdf_engine.processar_upload, temp_path)
            except Exception:
                safe_path = await asyncio.to_thread(sanitize_excel_for_engine, temp_path)
                resultado = await asyncio.to_thread(self.pdf_engine.processar_upload, safe_path)

            certificado = resultado["certificado"]
            planilha_path = Path(resultado["planilha"])

            bundle = self.pdf_engine.get_bundle_by_numero(certificado.numero_certificado)
            if not bundle:
                raise DataInconsistencyError("Falha ao recuperar dados persistidos do certificado.")

            pdf_path = await asyncio.to_thread(pdf_service.ensure_pdf, bundle, self.pdf_engine)

            return CertificateCreatedDTO(
                id=certificado.to_dict().get("id"),
                numero_certificado=str(certificado.numero_certificado),
                planilha_path=planilha_path,
                pdf_path=pdf_path,
                bundle=bundle
            )

        finally:
            try:
                temp_path.unlink(missing_ok=True)
            except PermissionError:
                pass
