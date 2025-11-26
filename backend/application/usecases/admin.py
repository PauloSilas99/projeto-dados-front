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

        def _parse_date(val: str, is_end: bool = False) -> Optional[datetime]:
            s = val.strip()
            if not s:
                return None
            try:
                # Full ISO
                return datetime.fromisoformat(s)
            except Exception:
                pass
            try:
                # Date-only
                d = datetime.fromisoformat(s + "T00:00:00")
                if is_end:
                    # end of day: add 23:59:59
                    return d.replace(hour=23, minute=59, second=59)
                return d
            except Exception:
                return None

        ts_de = _parse_date(data_de or "") if data_de else None
        ts_ate = _parse_date(data_ate or "", is_end=True) if data_ate else None

        def _match(p: Path) -> bool:
            name = p.name
            if q and q.strip() and q.strip().lower() not in name.lower():
                return False
            # Simplificação: todo arquivo é tratado como documento; ignora filtro doc_type diferente de 'documento'
            if doc_type and doc_type.strip().lower() not in ("", "documento"):
                return False
            mtime = datetime.fromtimestamp(p.stat().st_mtime)
            if ts_de and mtime < ts_de:
                return False
            if ts_ate and mtime > ts_ate:
                return False
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
                "doc_type": "documento",
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
