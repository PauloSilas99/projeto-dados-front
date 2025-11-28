"""
Domain DTOs (Data Transfer Objects)
Contratos de dados entre as camadas da aplicação
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Any, Dict
from dataclasses import dataclass
from pathlib import Path
from pydantic import BaseModel, Field


# ============================================================================
# CERTIFICADO DTOs
# ============================================================================

class CertificadoDTO(BaseModel):
    """DTO para representar um certificado"""
    id: str
    numero_certificado: str
    razao_social: str
    cnpj: str
    endereco: str
    bairro: str
    cidade: str
    valor: Optional[str] = None
    pragas_tratadas: Optional[str] = None
    data_execucao: datetime
    
    class Config:
        from_attributes = True


class ProdutoDTO(BaseModel):
    """DTO para representar um produto"""
    produto: str
    dosagem_concentracao: str
    classe_quimica: Optional[str] = None
    
    class Config:
        from_attributes = True


class MetodoDTO(BaseModel):
    """DTO para representar um método de aplicação"""
    metodo: str
    
    class Config:
        from_attributes = True


class CertificadoCompletoDTO(BaseModel):
    """DTO completo com certificado, produtos e métodos"""
    certificado: CertificadoDTO
    produtos: List[ProdutoDTO]
    metodos: List[MetodoDTO]
    arquivos: Optional[dict] = None


class CertificadoListItemDTO(BaseModel):
    """DTO simplificado para listagem de certificados"""
    id: str
    numero_certificado: str
    razao_social: str
    bairro: Optional[str] = None
    cidade: str
    valor: Optional[str] = None
    data_execucao: datetime
    urls: Optional[dict] = None


# ============================================================================
# DASHBOARD DTOs
# ============================================================================

class TotaisDTO(BaseModel):
    """DTO para totais do dashboard"""
    certificados: int
    produtos: int
    metodos: int


class ItemQuantidadeDTO(BaseModel):
    """DTO genérico para itens com quantidade"""
    quantidade: int


class CertificadoPorMesDTO(ItemQuantidadeDTO):
    """DTO para certificados agrupados por mês"""
    mes: str


class CertificadoPorCidadeDTO(ItemQuantidadeDTO):
    """DTO para certificados agrupados por cidade"""
    cidade: str


class CertificadoPorPragaDTO(ItemQuantidadeDTO):
    """DTO para certificados agrupados por praga"""
    praga: str


class ClasseQuimicaDTO(ItemQuantidadeDTO):
    """DTO para classes químicas"""
    classe: str


class MetodoAplicacaoDTO(ItemQuantidadeDTO):
    """DTO para métodos de aplicação"""
    metodo: str


class ValorFinanceiroDTO(BaseModel):
    """DTO para resumo financeiro"""
    total: float
    media: float


class DashboardOverviewDTO(BaseModel):
    """DTO completo do overview do dashboard"""
    totals: TotaisDTO
    certificadosPorMes: List[CertificadoPorMesDTO]
    certificadosPorCidade: List[CertificadoPorCidadeDTO]
    certificadosPorPraga: List[CertificadoPorPragaDTO]
    classesQuimicas: List[ClasseQuimicaDTO]
    metodosAplicacao: List[MetodoAplicacaoDTO]
    valorFinanceiro: ValorFinanceiroDTO
    produtosPorNome: List[ProdutoPorNomeDTO]


class ProdutoPorNomeDTO(ItemQuantidadeDTO):
    produto: str


class DistribuicaoProdutosDTO(ItemQuantidadeDTO):
    """DTO para distribuição de produtos por classe"""
    classe: str


class DistribuicaoMetodosDTO(ItemQuantidadeDTO):
    """DTO para distribuição de métodos"""
    metodo: str


class CertificadoAnalyticsDTO(BaseModel):
    """DTO para analytics de um certificado específico"""
    certificado: dict
    produtos: List[dict]
    metodos: List[dict]
    distribuicaoProdutos: List[DistribuicaoProdutosDTO]
    distribuicaoMetodos: List[DistribuicaoMetodosDTO]


# ============================================================================
# ADMIN DTOs
# ============================================================================

class PdfInfoDTO(BaseModel):
    """DTO para informações de um PDF"""
    name: str
    relpath: str
    size_bytes: int
    size_human: str
    modified_at: str
    doc_type: str
    status: str


class CacheStatusDTO(BaseModel):
    """DTO para status do cache"""
    motor_inicializado: bool
    motor_created_at: Optional[str] = None
    cache_last_cleared_at: Optional[str] = None


@dataclass
class CertificateCreatedDTO:
    """DTO retornado pelos casos de uso de criação de certificado."""
    id: Optional[str]
    numero_certificado: str
    planilha_path: Path
    pdf_path: Path
    bundle: Any  # Mantendo Any por enquanto pois o bundle vem do engine

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "numero_certificado": self.numero_certificado,
            "planilha": str(self.planilha_path),
            "pdf": str(self.pdf_path),
        }
# ============================================================================
# HEATMAP DTOs
# ============================================================================

class CityHeatmapItemDTO(BaseModel):
    """DTO para item do mapa de calor"""
    city: str
    bairro: str
    address: str  # Endereço completo para melhor geocoding
    count: int
    lat: Optional[float] = None
    long: Optional[float] = None


class CityHeatmapResponseDTO(BaseModel):
    """DTO de resposta do mapa de calor"""
    data: List[CityHeatmapItemDTO]
