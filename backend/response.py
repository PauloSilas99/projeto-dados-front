from __future__ import annotations

from typing import Any, Dict, Optional
from fastapi.responses import JSONResponse


def success(data: Any, message: str = "OK", status_code: int = 200) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"message": message, "data": data, "sucesso": True})


def error(message: str, codigo: Optional[str] = None, detalhes: Optional[Any] = None, status_code: int = 400) -> JSONResponse:
    payload: Dict[str, Any] = {
        "message": message,
        "error": {"codigo": codigo, "detalhes": detalhes},
        "sucesso": False,
    }
    return JSONResponse(status_code=status_code, content=payload)