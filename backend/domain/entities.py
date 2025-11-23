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
    cnpj: str
    endereco: str | None
    bairro: str
    cidade: str
    valor: str | None
    pragas_tratadas: str | None
    data_execucao: Any  # datetime ou str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "numero_certificado": self.numero_certificado,
            "razao_social": self.razao_social,
            "cnpj": self.cnpj,
            "endereco": self.endereco,
            "bairro": self.bairro,
            "cidade": self.cidade,
            "valor": self.valor,
            "pragas_tratadas": self.pragas_tratadas,
            "data_execucao": self.data_execucao,
        }


@dataclass
class ProdutoEntity:
    produto: str
    dosagem_concentracao: str
    classe_quimica: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "produto": self.produto,
            "dosagem_concentracao": self.dosagem_concentracao,
            "classe_quimica": self.classe_quimica,
        }


@dataclass
class MetodoEntity:
    metodo: str

    def to_dict(self) -> Dict[str, Any]:
        return {"metodo": self.metodo}


@dataclass
class CertificadoBundleEntity:
    certificado: CertificadoEntity
    produtos: List[ProdutoEntity]
    metodos: List[MetodoEntity]
