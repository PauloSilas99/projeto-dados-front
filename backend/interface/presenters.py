"""
Interface Layer - Presenters
Formatação de respostas HTTP e URLs de recursos
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict
from urllib.parse import quote

from fastapi.responses import JSONResponse
from backend.domain.entities import CertificadoBundleEntity


# ============================================================================
# HTTP RESPONSE FORMATTERS
# ============================================================================

def success(data: Any, message: str = "OK", status_code: int = 200) -> JSONResponse:
    """Formata uma resposta de sucesso padronizada."""
    return JSONResponse(
        status_code=status_code,
        content={"message": message, "data": data, "sucesso": True}
    )


def error(message: str, codigo: str | None = None, detalhes: Any | None = None, status_code: int = 400) -> JSONResponse:
    """Formata uma resposta de erro padronizada."""
    payload: Dict[str, Any] = {
        "message": message,
        "error": {"codigo": codigo, "detalhes": detalhes},
        "sucesso": False,
    }
    return JSONResponse(status_code=status_code, content=payload)


# ============================================================================
# RESOURCE URL BUILDERS
# ============================================================================

def build_resource_urls_id(cert_id: str) -> Dict[str, str]:
    """Constrói URLs dos recursos de um certificado."""
    encoded = quote(cert_id, safe="")
    return {
        "pdf": f"/certificados/{encoded}/pdf",
        "planilha": f"/certificados/{encoded}/planilha",
        "detalhes": f"/certificados/{encoded}",
    }


# ============================================================================
# BUNDLE SERIALIZERS
# ============================================================================

def serialize_bundle(bundle: CertificadoBundleEntity) -> Dict[str, Any]:
    """Serializa um CertificadoBundle para dict."""
    return {
        "certificado": bundle.certificado.to_dict(),
        "produtos": [produto.to_dict() for produto in bundle.produtos],
        "metodos": [metodo.to_dict() for metodo in bundle.metodos],
    }


def build_response(bundle: CertificadoBundleEntity, planilha: Path, pdf: Path) -> Dict[str, Any]:
    """Constrói a resposta completa de um certificado com arquivos."""
    cert_data = bundle.certificado.to_dict()
    cert_id = str(cert_data.get("id", ""))
    urls = build_resource_urls_id(cert_id) if cert_id else {}
    
    return {
        **serialize_bundle(bundle),
        "arquivos": {
            "planilha": str(planilha.resolve()),
            "pdf": str(pdf.resolve()),
            "urls": urls,
        },
    }
