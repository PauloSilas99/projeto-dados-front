from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Request, Query
from fastapi.responses import FileResponse

from backend.deps import get_motor, init_motor


logger = logging.getLogger("cache-admin")

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/clear-cache")
async def clear_cache(request: Request, _=Depends(get_motor)) -> Dict[str, Any]:
    from backend.response import success
    
    remote = request.client.host if request.client else "unknown"

    request.app.state.motor = init_motor()
    request.app.state.motor_created_at = datetime.now(timezone.utc).isoformat()
    request.app.state.cache_last_cleared_at = request.app.state.motor_created_at

    logger.info(f"Cache limpo por {remote} em {request.app.state.cache_last_cleared_at}")

    return success(
        {"status": "ok", "cache_last_cleared_at": request.app.state.cache_last_cleared_at},
        message="Cache limpo com sucesso"
    )


@router.get("/cache-status")
async def cache_status(request: Request) -> Dict[str, Any]:
    from backend.response import success
    
    return success(
        {
            "motor_inicializado": hasattr(request.app.state, "motor") and request.app.state.motor is not None,
            "motor_created_at": getattr(request.app.state, "motor_created_at", None),
            "cache_last_cleared_at": getattr(request.app.state, "cache_last_cleared_at", None),
        },
        message="Status do cache"
    )


def _size_human(n: int) -> str:
    units = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    v = float(n)
    while v >= 1024 and i < len(units) - 1:
        v /= 1024
        i += 1
    return f"{v:.1f} {units[i]}"


@router.get("/pdfs")
async def listar_pdfs(
    request: Request,
    q: Optional[str] = Query(default=None),
    doc_type: Optional[str] = Query(default=None),
    data_de: Optional[str] = Query(default=None),
    data_ate: Optional[str] = Query(default=None),
    limit: int = 50,
    offset: int = 0,
    _=Depends(get_motor),
) -> Dict[str, Any]:
    from backend.response import success

    motor = request.app.state.motor
    base = motor.pdf_generator.output_dir
    files = sorted(base.glob("**/*.pdf"), key=lambda p: p.stat().st_mtime, reverse=True)

    def _match(p):
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
    data = [
        {
            "name": p.name,
            "relpath": str(p.relative_to(base)),
            "size_bytes": p.stat().st_size,
            "size_human": _size_human(p.stat().st_size),
            "modified_at": datetime.fromtimestamp(p.stat().st_mtime, tz=timezone.utc).isoformat(),
            "doc_type": "certificado" if "cert" in p.name.lower() or "certificado" in p.name.lower() else "documento",
            "status": "available",
        }
        for p in page
    ]
    return success(data, message="Lista de PDFs")


@router.get("/pdfs/preview")
async def preview_pdf(request: Request, name: str) -> FileResponse:
    motor = request.app.state.motor
    base = motor.pdf_generator.output_dir
    target = (base / name).resolve()
    if base not in target.parents and target != base:
        from backend.response import error

        return error("Caminho inválido.", codigo="INVALID_PATH", status_code=400)  # type: ignore
    if not target.exists():
        from backend.response import error

        return error("PDF não encontrado.", codigo="PDF_NOT_FOUND", status_code=404)  # type: ignore
    return FileResponse(path=target, media_type="application/pdf")


@router.get("/pdfs/download")
async def download_pdf(request: Request, name: str) -> FileResponse:
    motor = request.app.state.motor
    base = motor.pdf_generator.output_dir
    target = (base / name).resolve()
    if base not in target.parents and target != base:
        from backend.response import error

        return error("Caminho inválido.", codigo="INVALID_PATH", status_code=400)  # type: ignore
    if not target.exists():
        from backend.response import error

        return error("PDF não encontrado.", codigo="PDF_NOT_FOUND", status_code=404)  # type: ignore
    return FileResponse(path=target, filename=target.name, media_type="application/pdf")


@router.post("/pdfs/download-zip")
async def download_zip(request: Request, body: Dict[str, Any]) -> FileResponse:
    motor = request.app.state.motor
    base = motor.pdf_generator.output_dir
    names: List[str] = body.get("names", [])
    if not isinstance(names, list) or not names:
        from backend.response import error

        return error("Lista de arquivos vazia.", codigo="EMPTY_LIST", status_code=400)  # type: ignore
    import tempfile, zipfile

    with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tmp:
        zip_path = tmp.name
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for name in names:
            target = (base / name).resolve()
            if base in target.parents or target.parent == base:
                if target.exists() and target.suffix.lower() == ".pdf":
                    zf.write(str(target), arcname=target.name)
    return FileResponse(path=zip_path, filename="documentos.zip", media_type="application/zip")


@router.delete("/pdfs")
async def delete_pdfs(request: Request, body: Dict[str, Any]) -> Dict[str, Any]:
    from backend.response import success, error

    motor = request.app.state.motor
    base = motor.pdf_generator.output_dir
    names: List[str] = body.get("names", [])
    if not isinstance(names, list) or not names:
        return error("Lista de arquivos vazia.", codigo="EMPTY_LIST", status_code=400)
    deleted = 0
    for name in names:
        target = (base / name).resolve()
        if (base in target.parents or target.parent == base) and target.exists() and target.suffix.lower() == ".pdf":
            try:
                target.unlink()
                deleted += 1
            except Exception:
                pass
    return success({"deleted": deleted}, message="Arquivos removidos")