from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List, Optional, Protocol
from pathlib import Path

from backend.domain.entities import CertificadoEntity

class CertificadoRepository(ABC):
    @abstractmethod
    def list(self) -> List[CertificadoEntity]:
        """Lista todos os certificados disponíveis."""
        ...

    @abstractmethod
    def get_by_id(self, id: str) -> Optional[CertificadoEntity]:
        """Busca um certificado pelo ID único."""
        ...

    @abstractmethod
    def get_by_numero(self, numero: str) -> Optional[CertificadoEntity]:
        """Busca um certificado pelo número do certificado (chave de negócio)."""
        ...

    @abstractmethod
    def get_pdf_path(self, numero: str) -> Optional[Path]:
        """Retorna o caminho do PDF se existir."""
        ...
    
    @abstractmethod
    def get_consolidated_spreadsheet_path(self) -> Path:
        """Retorna o caminho da planilha consolidada."""
        ...
