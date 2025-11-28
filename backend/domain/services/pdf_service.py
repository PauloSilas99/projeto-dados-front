"""
Domain Service - Gerenciamento de PDFs
Operações de PDF que fazem parte da lógica de negócio
"""
from pathlib import Path
from typing import Any, Optional
import unicodedata
import shutil

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
        generated = pdf_generator.generate(bundle)
        cert = bundle.certificado if hasattr(bundle, "certificado") else None
        cidade = getattr(cert, "cidade", None) if cert else None
        if cidade:
            prefixed = ensure_city_prefixed_copy(generated, str(cidade), pdf_engine)
            return prefixed or generated
        return generated
    except Exception as e:
        raise PdfGenerationError(
            f"Erro ao gerar PDF para certificado {bundle.certificado.numero_certificado}",
            certificado_numero=bundle.certificado.numero_certificado,
            details=str(e)
        )


def find_existing_pdf_for_cert(cert: Any, pdf_engine: PdfEngine) -> Optional[Path]:
    data = cert.to_dict() if hasattr(cert, "to_dict") else cert
    numero = str(data.get("numero_certificado", ""))
    nome = str(data.get("razao_social", ""))
    cidade = str(data.get("cidade", ""))

    def norm(s: str) -> str:
        s = unicodedata.normalize("NFKD", s)
        s = "".join([c for c in s if not unicodedata.combining(c)])
        return s.lower()

    numero_sanitizado = numero.replace("/", "-")
    name_token_dash = norm(nome).replace(" ", "-")
    name_token_space = norm(nome)
    city_token_dash = norm(cidade).replace(" ", "-")
    city_token_space = norm(cidade)

    pdf_generator = pdf_engine.get_pdf_generator()
    specific = list(pdf_generator.output_dir.glob(f"*{numero_sanitizado}*{city_token_dash}*.pdf"))
    candidates = sorted(specific) or sorted(pdf_generator.output_dir.glob(f"*{numero_sanitizado}*.pdf"))
    for p in candidates:
        fname = norm(p.name)
        if city_token_dash and city_token_dash in fname:
            return p
        if city_token_space and city_token_space in fname:
            return p
        if name_token_dash and name_token_dash in fname:
            return p
        if name_token_space and name_token_space in fname:
            return p
    return candidates[0] if candidates else None


def ensure_city_prefixed_copy(pdf_path: Path, cidade: str, pdf_engine: PdfEngine) -> Path:
    cidade_norm = unicodedata.normalize("NFKD", cidade)
    cidade_norm = "".join([c for c in cidade_norm if not unicodedata.combining(c)])
    cidade_token = cidade_norm.strip().replace(" ", "-").lower()
    base_dir = pdf_engine.get_pdf_generator().output_dir
    fname_norm = unicodedata.normalize("NFKD", pdf_path.name)
    fname_norm = "".join([c for c in fname_norm if not unicodedata.combining(c)]).lower()
    if cidade_token and cidade_token in fname_norm:
        return pdf_path
    target_name = f"{cidade_token}_{pdf_path.name}" if cidade_token else pdf_path.name
    target_path = (base_dir / target_name).resolve()
    if target_path.exists():
        return target_path
    try:
        shutil.copyfile(pdf_path, target_path)
        return target_path
    except Exception:
        return pdf_path


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
