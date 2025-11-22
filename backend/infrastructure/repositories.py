from __future__ import annotations

from typing import List, Optional
from pathlib import Path
from urllib.parse import unquote

from engine_excel_to_pdf.interface import MotorCertificados
from backend.domain.repositories import CertificadoRepository
from backend.domain.entities import CertificadoEntity
from backend.utils import load_cert_by_id, find_existing_pdf

class FileCertificadoRepository(CertificadoRepository):
    def __init__(self, motor: MotorCertificados):
        self.motor = motor

    def list(self) -> List[CertificadoEntity]:
        certificados = self.motor.listar_certificados()
        return [self._to_entity(c) for c in certificados]

    def get_by_id(self, id: str) -> Optional[CertificadoEntity]:
        try:
            # load_cert_by_id raises exception if not found, we should catch or handle it
            # For now, assuming it might raise, let's wrap
            cert_obj = load_cert_by_id(unquote(id), self.motor)
            return self._to_entity(cert_obj)
        except Exception:
            return None

    def get_by_numero(self, numero: str) -> Optional[CertificadoEntity]:
        # The engine doesn't have a direct get_by_numero for Certificado object easily exposed without listing or using bundle
        # But we can get the bundle
        bundle = self.motor.csv_manager.get_bundle_by_numero(numero)
        if bundle:
            return self._to_entity(bundle.certificado)
        return None

    def get_pdf_path(self, numero: str) -> Optional[Path]:
        bundle = self.motor.csv_manager.get_bundle_by_numero(numero)
        if not bundle:
            return None
        return find_existing_pdf(bundle, self.motor)

    def get_consolidated_spreadsheet_path(self) -> Path:
        return self.motor.spreadsheet_generator.consolidated_path

    def _to_entity(self, engine_cert: Any) -> CertificadoEntity:
        # engine_cert is engine_excel_to_pdf.models.Certificado
        d = engine_cert.to_dict()
        return CertificadoEntity(
            id=str(d.get("id", "")),
            numero_certificado=str(d.get("numero_certificado", "")),
            razao_social=str(d.get("razao_social", "")),
            bairro=str(d.get("bairro", "")),
            cidade=str(d.get("cidade", "")),
            valor=d.get("valor"), # Keep as is (str or None)
            data_execucao=d.get("data_execucao")
        )
