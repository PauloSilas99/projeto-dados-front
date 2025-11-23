"""
Domain Service - Gerenciamento de PDFs
Operações de PDF que fazem parte da lógica de negócio
"""
from pathlib import Path
from typing import Any, Optional

from backend.domain.services.pdf_engine import PdfEngine
from backend.domain.exceptions import CertificadoNotFoundError, PdfGenerationError


# ============================================================================
# PDF MANAGEMENT
# ============================================================================

def find_existing_pdf(bundle: Any, pdf_engine: PdfEngine) -> Optional[Path]:
    """
    Procura por PDF existente de um certificado.
    
    Args:
        bundle: Bundle do certificado (objeto da engine)
        pdf_engine: Motor de PDF
        
    Returns:
        Path do PDF se encontrado, None caso contrário
    """
    certificado = bundle.certificado
    cnpj_digits = certificado.cnpj.replace(".", "").replace("/", "").replace("-", "")
    numero_sanitizado = certificado.numero_certificado.replace("/", "-")
    pattern = f"*{cnpj_digits[:8]}*{numero_sanitizado}*.pdf"
    
    pdf_generator = pdf_engine.get_pdf_generator()
    pdfs = sorted(pdf_generator.output_dir.glob(pattern))
    return pdfs[0] if pdfs else None


def ensure_pdf(bundle: Any, pdf_engine: PdfEngine) -> Path:
    """
    Garante que o PDF existe, gerando se necessário.
    
    Args:
        bundle: Bundle do certificado
        pdf_engine: Motor de PDF
        
    Returns:
        Path do PDF gerado ou encontrado
        
    Raises:
        PdfGenerationError: Se houver erro na geração
    """
    existing_pdf = find_existing_pdf(bundle, pdf_engine)
    if existing_pdf:
        return existing_pdf
    
    try:
        pdf_generator = pdf_engine.get_pdf_generator()
        return pdf_generator.generate(bundle)
    except Exception as e:
        raise PdfGenerationError(
            f"Erro ao gerar PDF para certificado {bundle.certificado.numero_certificado}",
            certificado_numero=bundle.certificado.numero_certificado,
            details=str(e)
        )


def load_cert_by_id(cert_id: str, pdf_engine: PdfEngine) -> Any:
    """
    Carrega um certificado pelo ID.
    
    Args:
        cert_id: ID do certificado
        pdf_engine: Motor de PDF
        
    Returns:
        Objeto do certificado
        
    Raises:
        CertificadoNotFoundError: Se o certificado não for encontrado
    """
    certificados = pdf_engine.listar_certificados()
    for certificado in certificados:
        data = certificado.to_dict()
        if str(data.get("id", "")) == cert_id:
            return certificado
    
    raise CertificadoNotFoundError(
        identifier=cert_id,
        details="Certificado não encontrado pelo ID"
    )
