from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional, List
from urllib.parse import quote

from fastapi import HTTPException

from engine_excel_to_pdf.interface import MotorCertificados
from engine_excel_to_pdf.models import CertificadoBundle


def serialize_bundle(bundle: CertificadoBundle) -> Dict[str, Any]:
    return {
        "certificado": bundle.certificado.to_dict(),
        "produtos": [produto.to_dict() for produto in bundle.produtos],
        "metodos": [metodo.to_dict() for metodo in bundle.metodos],
    }



def build_resource_urls_id(cert_id: str) -> Dict[str, str]:
    encoded = quote(cert_id, safe="")
    base = f"/certificados/{encoded}"
    return {
        "pdf": f"/certificados/{encoded}/pdf",
        "planilha": f"/certificados/{encoded}/planilha",
        "detalhes": base,
    }


def find_existing_pdf(bundle: CertificadoBundle, motor: MotorCertificados) -> Optional[Path]:
    certificado = bundle.certificado
    cnpj_digits = certificado.cnpj.replace(".", "").replace("/", "").replace("-", "")
    numero_sanitizado = certificado.numero_certificado.replace("/", "-")
    pattern = f"*{cnpj_digits[:8]}*{numero_sanitizado}*.pdf"
    pdfs = sorted(motor.pdf_generator.output_dir.glob(pattern))
    return pdfs[0] if pdfs else None


def ensure_pdf(bundle: CertificadoBundle, motor: MotorCertificados) -> Path:
    existing_pdf = find_existing_pdf(bundle, motor)
    if existing_pdf:
        return existing_pdf
    return motor.pdf_generator.generate(bundle)


def build_response(bundle: CertificadoBundle, planilha: Path, pdf: Path) -> Dict[str, Any]:
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


def load_cert_by_id(cert_id: str, motor: MotorCertificados):
    certificados = motor.listar_certificados()
    for certificado in certificados:
        data = certificado.to_dict()
        if str(data.get("id", "")) == cert_id:
            return certificado
    raise HTTPException(status_code=404, detail="Certificado não encontrado pelo ID.")


def parse_valor(valor: str | None) -> float | None:
    if not valor:
        return None
    normalizado = (
        valor.replace("R$", "").replace(".", "").replace(" ", "").replace(",", ".")
    )
    try:
        return float(normalizado)
    except ValueError:
        return None