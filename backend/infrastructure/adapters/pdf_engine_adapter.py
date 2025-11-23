"""
Infrastructure Adapter - PDF Engine
Implementação concreta da interface PdfEngine usando a biblioteca engine-excel-to-pdf
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional

from engine_excel_to_pdf.interface import MotorCertificados
from engine_excel_to_pdf.config import EngineConfig
from engine_excel_to_pdf.validators import ValidationError as EngineValidationError

from backend.domain.services.pdf_engine import PdfEngine
from backend.domain.entities import (
    CertificadoEntity,
    ProdutoEntity,
    MetodoEntity,
    CertificadoBundleEntity,
)
from backend.domain.exceptions import ValidationError, FileProcessingError


class EnginePdfAdapter(PdfEngine):
    """
    Adapter que implementa PdfEngine usando MotorCertificados.
    Esta classe adapta a biblioteca externa para nossa interface de domínio.
    """
    
    def __init__(self, config: Optional[EngineConfig] = None):
        """
        Inicializa o adapter com configuração.
        
        Args:
            config: Configuração do engine (opcional)
        """
        self._motor = MotorCertificados(config=config or EngineConfig())
    
    def processar_upload(self, file_path: Path) -> Dict[str, Any]:
        """
        Processa um arquivo Excel enviado.
        
        Args:
            file_path: Caminho do arquivo Excel
            
        Returns:
            Dicionário com informações do certificado processado
            
        Raises:
            ValidationError: Se o arquivo não for válido
            FileProcessingError: Se houver erro no processamento
        """
        try:
            return self._motor.processar_upload(file_path)
        except EngineValidationError as e:
            raise ValidationError(
                message="Erro de validação no arquivo",
                errors=e.errors if hasattr(e, 'errors') else [{"error": str(e)}]
            )
        except Exception as e:
            raise FileProcessingError(
                message=f"Erro ao processar arquivo: {str(e)}",
                file_path=str(file_path),
                details=str(e)
            )
    
    def listar_certificados(self) -> List[Any]:
        """
        Lista todos os certificados disponíveis.
        
        Returns:
            Lista de objetos de certificado
        """
        return self._motor.listar_certificados()
    
    def get_bundle_by_numero(self, numero_certificado: str) -> Optional[Any]:
        """
        Obtém o bundle completo de um certificado pelo número.
        
        Args:
            numero_certificado: Número do certificado
            
        Returns:
            Bundle do certificado ou None se não encontrado
        """
        return self._motor.csv_manager.get_bundle_by_numero(numero_certificado)

    def get_bundle_entity_by_numero(self, numero_certificado: str) -> Optional[CertificadoBundleEntity]:
        bundle = self._motor.csv_manager.get_bundle_by_numero(numero_certificado)
        if not bundle:
            return None
        certificado = self._to_certificado_entity(bundle.certificado)
        produtos = [self._to_produto_entity(p) for p in getattr(bundle, "produtos", [])]
        metodos = [self._to_metodo_entity(m) for m in getattr(bundle, "metodos", [])]
        return CertificadoBundleEntity(certificado=certificado, produtos=produtos, metodos=metodos)
    
    def get_csv_manager(self) -> Any:
        """
        Retorna o gerenciador de CSV interno.
        
        Returns:
            Gerenciador de CSV
        """
        return self._motor.csv_manager
    
    def get_pdf_generator(self) -> Any:
        """
        Retorna o gerador de PDF interno.
        
        Returns:
            Gerador de PDF
        """
        return self._motor.pdf_generator
    
    def get_spreadsheet_generator(self) -> Any:
        """
        Retorna o gerador de planilhas consolidadas.
        
        Returns:
            Gerador de planilhas
        """
        return self._motor.spreadsheet_generator
    
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
        try:
            return self._motor.criar_certificado_manual(dados)
        except EngineValidationError as e:
            raise ValidationError(
                message="Erro de validação nos dados do certificado",
                errors=e.errors if hasattr(e, 'errors') else [{"error": str(e)}]
            )
        except Exception as e:
            raise FileProcessingError(
                message=f"Erro ao criar certificado manual: {str(e)}",
                details=str(e)
            )
    
    def reset_cache(self, config: Optional[EngineConfig] = None) -> None:
        """
        Reseta o cache do motor (útil para testes e limpeza).
        
        Args:
            config: Nova configuração (opcional)
        """
        self._motor = MotorCertificados(config=config or EngineConfig())
    
    @property
    def motor(self) -> MotorCertificados:
        """Acesso direto ao motor (use com cautela, apenas quando necessário)"""
        return self._motor

    def _to_certificado_entity(self, engine_cert: Any) -> CertificadoEntity:
        d: Dict[str, Any] = engine_cert.to_dict() if hasattr(engine_cert, "to_dict") else {}
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

    def _to_produto_entity(self, engine_prod: Any) -> ProdutoEntity:
        return ProdutoEntity(
            produto=getattr(engine_prod, "produto", ""),
            dosagem_concentracao=getattr(engine_prod, "dosagem_concentracao", ""),
            classe_quimica=getattr(engine_prod, "classe_quimica", None),
        )

    def _to_metodo_entity(self, engine_met: Any) -> MetodoEntity:
        return MetodoEntity(metodo=getattr(engine_met, "metodo", ""))
