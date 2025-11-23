from __future__ import annotations

import logging
import tempfile
import zipfile
from pathlib import Path
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from backend.domain.services.pdf_engine import PdfEngine
from backend.domain.services.system_state import SystemStateService

logger = logging.getLogger("cache-admin")


class ClearCacheUseCase:
    def __init__(self, pdf_engine: PdfEngine, system_state: SystemStateService):
        self.pdf_engine = pdf_engine
        self.system_state = system_state

    def execute(self, client_host: str) -> Dict[str, Any]:
        # No explicit container reset; if needed, reinitialize engine here
        cleared_at = self.system_state.mark_cache_cleared()
        logger.info(f"Cache limpo por {client_host} em {cleared_at}")
        return {
            "status": "ok",
            "cache_last_cleared_at": cleared_at,
        }


class GetCacheStatusUseCase:
    def __init__(self, pdf_engine: PdfEngine, system_state: SystemStateService):
        self.pdf_engine = pdf_engine
        self.system_state = system_state

    def execute(self) -> Dict[str, Any]:
        motor_inicializado = self.pdf_engine is not None
        motor_created_at = self.system_state.get_motor_created_at()
        cache_last_cleared_at = self.system_state.get_cache_last_cleared_at()
        return {
            "motor_inicializado": motor_inicializado,
            "motor_created_at": motor_created_at,
            "cache_last_cleared_at": cache_last_cleared_at,
        }


class ListPdfsUseCase:
    def __init__(self, pdf_engine: PdfEngine):
        self.pdf_engine = pdf_engine

    def execute(
        self,
        q: Optional[str] = None,
        doc_type: Optional[str] = None,
        data_de: Optional[str] = None,
        data_ate: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        base = self.pdf_engine.get_pdf_generator().output_dir
        files = sorted(base.glob("**/*.pdf"), key=lambda p: p.stat().st_mtime, reverse=True)

        def _match(p: Path) -> bool:
            name = p.name
            if q and q.strip() and q.strip().lower() not in name.lower():
                return False
            tipo = "certificado" if "cert" in name.lower() or "certificado" in name.lower() else "documento"
            if doc_type and doc_type.strip().lower() != tipo:
                return False
            if data_de:
                try:
                    ts_de = datetime.fromisoformat(data_de)
                    if datetime.fromtimestamp(p.stat().st_mtime) < ts_de:
                        return False
                except Exception:
                    pass
            if data_ate:
                try:
                    ts_ate = datetime.fromisoformat(data_ate)
                    if datetime.fromtimestamp(p.stat().st_mtime) > ts_ate:
                        return False
                except Exception:
                    pass
            return True

        filtrados = [p for p in files if _match(p)]
        page = filtrados[offset : offset + max(0, limit)]

        return [
            {
                "name": p.name,
                "relpath": str(p.relative_to(base)),
                "size_bytes": p.stat().st_size,
                "size_human": self._size_human(p.stat().st_size),
                "modified_at": datetime.fromtimestamp(p.stat().st_mtime, tz=timezone.utc).isoformat(),
                "doc_type": "certificado" if "cert" in p.name.lower() or "certificado" in p.name.lower() else "documento",
                "status": "available",
            }
            for p in page
        ]

    @staticmethod
    def _size_human(n: int) -> str:
        units = ["B", "KB", "MB", "GB", "TB"]
        i = 0
        v = float(n)
        while v >= 1024 and i < len(units) - 1:
            v /= 1024
            i += 1
        return f"{v:.1f} {units[i]}"


class DownloadPdfByNameUseCase:
    def __init__(self, pdf_engine: PdfEngine):
        self.pdf_engine = pdf_engine

    def execute(self, name: str) -> Path:
        base = self.pdf_engine.get_pdf_generator().output_dir
        target = (base / name).resolve()

        if base not in target.parents and target != base:
            raise ValueError("Caminho inválido.")

        if not target.exists():
            raise FileNotFoundError("PDF não encontrado.")

        return target


class DownloadZipUseCase:
    def __init__(self, pdf_engine: PdfEngine):
        self.pdf_engine = pdf_engine

    def execute(self, names: List[str]) -> Path:
        base = self.pdf_engine.get_pdf_generator().output_dir

        with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tmp:
            zip_path = Path(tmp.name)

        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for name in names:
                target = (base / name).resolve()
                if base in target.parents or target.parent == base:
                    if target.exists() and target.suffix.lower() == ".pdf":
                        zf.write(str(target), arcname=target.name)

        return zip_path


class DeletePdfsUseCase:
    def __init__(self, pdf_engine: PdfEngine):
        self.pdf_engine = pdf_engine

    def execute(self, names: List[str]) -> int:
        base = self.pdf_engine.get_pdf_generator().output_dir
        deleted = 0

        for name in names:
            target = (base / name).resolve()
            if (base in target.parents or target.parent == base) and target.exists() and target.suffix.lower() == ".pdf":
                try:
                    target.unlink()
                    deleted += 1
                except Exception:
                    pass

        return deleted
