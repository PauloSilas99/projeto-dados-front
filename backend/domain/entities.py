from __future__ import annotations

from typing import Any, Dict, List, Optional
from dataclasses import dataclass

# In a strict clean arch, we would define our own entities here.
# For pragmatism, we will define the shapes we need.

@dataclass
class CertificadoEntity:
    id: str
    numero_certificado: str
    razao_social: str
    bairro: str
    cidade: str
    valor: str | None
    data_execucao: Any # datetime or str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "numero_certificado": self.numero_certificado,
            "razao_social": self.razao_social,
            "bairro": self.bairro,
            "cidade": self.cidade,
            "valor": self.valor,
            "data_execucao": self.data_execucao
        }
