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
from backend.domain.services.processed_files_index import ProcessedFilesIndex
from datetime import datetime, timezone

ALLOWED_EXTENSIONS = {".xlsx", ".xls"}

class UploadExcelInput:
    filename: str
    file_bytes: bytes

    def __init__(self, filename: str, file_bytes: bytes):
        self.filename = filename
        self.file_bytes = file_bytes


class UploadExcelUseCase:
    def __init__(self, pdf_engine: PdfEngine, logger=None):
        self.pdf_engine = pdf_engine
        self._index = ProcessedFilesIndex(self.pdf_engine.get_pdf_generator().output_dir)
        self.logger = logger

    async def execute(self, inp: UploadExcelInput) -> CertificateCreatedDTO:
        file_hash = await asyncio.to_thread(ProcessedFilesIndex.sha256_bytes, inp.file_bytes)
        if self.logger: self.logger.info("upload_excel_received", filename=inp.filename, size=len(inp.file_bytes))
        if self._index.exists(file_hash):
            if self.logger: self.logger.warn("upload_excel_duplicate_file")
            raise ValidationError("Arquivo já processado.", errors=[{"field": "arquivo", "message": "DUPLICATE_FILE"}])
        suffix = Path(inp.filename or "").suffix.lower()
        if suffix not in ALLOWED_EXTENSIONS:
            if self.logger: self.logger.warn("upload_excel_invalid_extension", suffix=suffix)
            raise ValidationError("Formato de arquivo inválido. Use .xlsx ou .xls.")

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_handle:
            temp_path = Path(tmp_handle.name)

        try:
            with temp_path.open("wb") as destino:
                destino.write(inp.file_bytes)
            if self.logger: self.logger.debug("upload_temp_written", path=str(temp_path))

            try:
                if self.logger: self.logger.info("engine_process_upload", path=str(temp_path))
                resultado = await asyncio.to_thread(self.pdf_engine.processar_upload, temp_path)
            except Exception:
                safe_path = await asyncio.to_thread(sanitize_excel_for_engine, temp_path)
                if self.logger: self.logger.warn("sanitize_applied", original=str(temp_path), safe=str(safe_path))
                resultado = await asyncio.to_thread(self.pdf_engine.processar_upload, safe_path)

            certificado = resultado["certificado"]
            planilha_path = Path(resultado["planilha"])

            bundle = self.pdf_engine.get_bundle_by_numero(certificado.numero_certificado)
            if not bundle:
                if self.logger: self.logger.error("bundle_missing", numero=str(certificado.numero_certificado))
                raise DataInconsistencyError("Falha ao recuperar dados persistidos do certificado.")

            pdf_path = await asyncio.to_thread(pdf_service.ensure_pdf, bundle, self.pdf_engine)
            if self.logger: self.logger.info("pdf_ready", output=str(pdf_path))

            cert_id = certificado.to_dict().get("id")
            # Registra arquivo processado
            try:
                self._index.add({
                    "hash": file_hash,
                    "filename": inp.filename,
                    "numero_certificado": str(certificado.numero_certificado),
                    "cert_id": cert_id,
                    "pdf": str(pdf_path.resolve()),
                    "planilha": str(planilha_path.resolve()),
                    "processed_at": datetime.now(timezone.utc).isoformat(),
                })
            except Exception:
                if self.logger: self.logger.warn("index_add_failed")
                pass

            return CertificateCreatedDTO(
                id=cert_id,
                numero_certificado=str(certificado.numero_certificado),
                planilha_path=planilha_path,
                pdf_path=pdf_path,
                bundle=bundle,
            )

        finally:
            try:
                temp_path.unlink(missing_ok=True)
                if self.logger: self.logger.debug("upload_temp_unlink", path=str(temp_path))
            except PermissionError:
                pass
