"""
Domain Exceptions
Exceções de negócio que não dependem de frameworks externos
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional


class DomainException(Exception):
    """Exceção base para erros de domínio"""
    
    def __init__(self, message: str, details: Optional[Any] = None):
        self.message = message
        self.details = details
        super().__init__(self.message)


class CertificadoNotFoundError(DomainException):
    """Levantada quando um certificado não é encontrado"""
    
    def __init__(self, identifier: str, details: Optional[Any] = None):
        message = f"Certificado não encontrado: {identifier}"
        super().__init__(message, details)
        self.identifier = identifier


class ValidationError(DomainException):
    """Levantada quando há erro de validação de dados de negócio"""
    
    def __init__(self, message: str, errors: Optional[List[Dict[str, Any]]] = None):
        super().__init__(message, errors)
        self.errors = errors or []


class FileProcessingError(DomainException):
    """Levantada quando há erro no processamento de arquivos"""
    
    def __init__(self, message: str, file_path: Optional[str] = None, details: Optional[Any] = None):
        super().__init__(message, details)
        self.file_path = file_path


class PdfGenerationError(DomainException):
    """Levantada quando há erro na geração de PDF"""
    
    def __init__(self, message: str, certificado_numero: Optional[str] = None, details: Optional[Any] = None):
        super().__init__(message, details)
        self.certificado_numero = certificado_numero


class DataInconsistencyError(DomainException):
    """Levantada quando há inconsistência nos dados"""
    
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message, details)
