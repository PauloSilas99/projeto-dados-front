"""
Domain Service Interface - PDF Engine
Interface abstrata para o motor de geração de PDFs e processamento de certificados.
Esta interface implementa o Dependency Inversion Principle, permitindo que o domínio
não dependa de implementações concretas de bibliotecas externas.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, List, Optional, Dict, Protocol
from backend.domain.entities import CertificadoBundleEntity


class PdfEngine(ABC):
    """
    Interface abstrata para o motor de PDFs.
    Implementações concretas devem estar na camada de infraestrutura.
    """
    
    @abstractmethod
    def processar_upload(self, file_path: Path) -> Dict[str, Any]:
        """
        Processa um arquivo Excel enviado e retorna informações do certificado.
        
        Args:
            file_path: Caminho do arquivo Excel
            
        Returns:
            Dicionário com informações do certificado processado
            
        Raises:
            ValidationError: Se o arquivo não for válido
            FileProcessingError: Se houver erro no processamento
        """
        ...
    
    @abstractmethod
    def listar_certificados(self) -> List[Any]:
        """
        Lista todos os certificados disponíveis.
        
        Returns:
            Lista de objetos de certificado
        """
        ...
    
    @abstractmethod
    def get_bundle_by_numero(self, numero_certificado: str) -> Optional[Any]:
        """
        Obtém o bundle completo de um certificado pelo número.
        
        Args:
            numero_certificado: Número do certificado
            
        Returns:
            Bundle do certificado ou None se não encontrado
        """
        ...

    @abstractmethod
    def get_bundle_entity_by_numero(self, numero_certificado: str) -> Optional[CertificadoBundleEntity]:
        """
        Obtém o bundle como entidade de domínio.
        """
        ...
    
    @abstractmethod
    def get_csv_manager(self) -> "CsvManagerPort":
        """
        Retorna o gerenciador de CSV interno.
        
        Returns:
            Gerenciador de CSV
        """
        ...
    
    @abstractmethod
    def get_pdf_generator(self) -> Any:
        """
        Retorna o gerador de PDF interno.
        
        Returns:
            Gerador de PDF
        """
        ...
    
    @abstractmethod
    def get_spreadsheet_generator(self) -> Any:
        """
        Retorna o gerador de planilhas consolidadas.
        
        Returns:
            Gerador de planilhas
        """
        ...
    
    @abstractmethod
    def criar_certificado_manual(self, dados: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cria um certificado manualmente a partir de dados estruturados.
        
        Args:
            dados: Dados do certificado
            
        Returns:
            Informações do certificado criado
            
        Raises:
            ValidationError: Se os dados forem inválidos
        """
        ...


class CsvManagerPort(Protocol):
    produtos_path: Path
    metodos_path: Path

    def get_bundle_by_numero(self, numero_certificado: str) -> Any:
        ...
