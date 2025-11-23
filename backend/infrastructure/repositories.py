from __future__ import annotations

from typing import List, Optional, Any
from pathlib import Path
from urllib.parse import unquote

from backend.domain.services.pdf_engine import PdfEngine
from backend.domain.repositories import CertificadoRepository
from backend.domain.entities import CertificadoEntity
from backend.domain.services import pdf_service

class FileCertificadoRepository(CertificadoRepository):
    def __init__(self, pdf_engine: PdfEngine):
        self.pdf_engine = pdf_engine

    def list(self) -> List[CertificadoEntity]:
        certificados = self.pdf_engine.listar_certificados()
        return [self._to_entity(c) for c in certificados]

    def get_by_id(self, id: str) -> Optional[CertificadoEntity]:
        try:
            cert_obj = pdf_service.load_cert_by_id(unquote(id), self.pdf_engine)
            return self._to_entity(cert_obj)
        except Exception:
            return None

    def get_by_numero(self, numero: str) -> Optional[CertificadoEntity]:
        bundle = self.pdf_engine.get_bundle_by_numero(numero)
        if bundle:
            return self._to_entity(bundle.certificado)
        return None

    def get_pdf_path(self, numero: str) -> Optional[Path]:
        bundle = self.pdf_engine.get_bundle_by_numero(numero)
        if not bundle:
            return None
        return pdf_service.find_existing_pdf(bundle, self.pdf_engine)

    def get_consolidated_spreadsheet_path(self) -> Path:
        return self.pdf_engine.get_spreadsheet_generator().consolidated_path

    def _to_entity(self, engine_cert: Any) -> CertificadoEntity:
        d = engine_cert.to_dict()
        print(f"DEBUG REPO: {d}")
        return CertificadoEntity(
            id=str(d.get("id", "")),
            numero_certificado=str(d.get("numero_certificado", "")),
            razao_social=str(d.get("razao_social", "")),
            cnpj=str(d.get("cnpj", "")),
            endereco=d.get("endereco"),
            bairro=str(d.get("bairro", "")),
            cidade=str(d.get("cidade", "")),
            valor=d.get("valor"),
            pragas_tratadas=d.get("pragas_tratadas"),
            data_execucao=d.get("data_execucao"),
        )
