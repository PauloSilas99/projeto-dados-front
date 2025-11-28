"""
Admin Handlers - Framework-agnostic business logic
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from pathlib import Path

from backend.domain.services.pdf_engine import PdfEngine
from backend.domain.services.system_state import SystemStateService
from backend.interface.presenters import success, error
from backend.application.usecases.admin import (
    ClearCacheUseCase,
    GetCacheStatusUseCase,
    ListPdfsUseCase,
    DownloadPdfByNameUseCase,
    DownloadZipUseCase,
    DeletePdfsUseCase,
)


class AdminController:
    """Controllers para endpoints administrativos"""
    
    def __init__(self, pdf_engine: PdfEngine, system_state: SystemStateService, logger=None):
        """
        Injeta dependências via construtor.
        
        Args:
            pdf_engine: Interface do motor de PDF
            system_state: Serviço de estado do sistema
        """
        self.pdf_engine = pdf_engine
        self.system_state = system_state
        self.logger = logger
    
    async def clear_cache(self, client_host: str) -> Dict[str, Any]:
        """Handler para limpar cache"""
        usecase = ClearCacheUseCase(self.pdf_engine, self.system_state)
        result = usecase.execute(client_host)
        return success(result, message="Cache limpo com sucesso")
    
    async def cache_status(self) -> Dict[str, Any]:
        """Handler para status do cache"""
        usecase = GetCacheStatusUseCase(self.pdf_engine, self.system_state)
        return success(usecase.execute(), message="Status do cache")
    
    async def listar_pdfs(
        self,
        q: Optional[str] = None,
        doc_type: Optional[str] = None,
        data_de: Optional[str] = None,
        data_ate: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """Handler para listar PDFs"""
        if self.logger: self.logger.info("admin_list_pdfs_start", q=q, doc_type=doc_type, data_de=data_de, data_ate=data_ate, limit=limit, offset=offset)
        usecase = ListPdfsUseCase(self.pdf_engine)
        data = usecase.execute(q, doc_type, data_de, data_ate, limit, offset)
        if self.logger: self.logger.info("admin_list_pdfs_done", count=len(data or []))
        return success(data, message="Lista de PDFs")
    
    async def preview_pdf(self, name: str) -> Path | Dict[str, Any]:
        """Handler para preview de PDF"""
        if self.logger: self.logger.info("admin_preview_pdf_start", name=name)
        usecase = DownloadPdfByNameUseCase(self.pdf_engine)
        try:
            path = usecase.execute(name)
            if self.logger: self.logger.info("admin_preview_pdf_done", name=name, exists=bool(path))
            return path  # Path será tratado no router
        except ValueError:
            if self.logger: self.logger.warn("admin_preview_pdf_invalid_path", name=name)
            return error("Caminho inválido.", codigo="INVALID_PATH", status_code=400)
        except FileNotFoundError:
            if self.logger: self.logger.error("admin_preview_pdf_not_found", name=name)
            return error("PDF não encontrado.", codigo="PDF_NOT_FOUND", status_code=404)
    
    async def download_pdf(self, name: str) -> Path | Dict[str, Any]:
        """Handler para download de PDF"""
        if self.logger: self.logger.info("admin_download_pdf_start", name=name)
        usecase = DownloadPdfByNameUseCase(self.pdf_engine)
        try:
            path = usecase.execute(name)
            if self.logger: self.logger.info("admin_download_pdf_done", name=name, exists=bool(path))
            return path  # Path será tratado no router
        except ValueError:
            if self.logger: self.logger.warn("admin_download_pdf_invalid_path", name=name)
            return error("Caminho inválido.", codigo="INVALID_PATH", status_code=400)
        except FileNotFoundError:
            if self.logger: self.logger.error("admin_download_pdf_not_found", name=name)
            return error("PDF não encontrado.", codigo="PDF_NOT_FOUND", status_code=404)
    
    async def download_zip(self, names: List[str]) -> Path | Dict[str, Any]:
        """Handler para download de ZIP"""
        if not isinstance(names, list) or not names:
            return error("Lista de arquivos vazia.", codigo="EMPTY_LIST", status_code=400)
        
        if self.logger: self.logger.info("admin_download_zip_start", names_count=len(names or []))
        usecase = DownloadZipUseCase(self.pdf_engine)
        zip_path = usecase.execute(names)
        if self.logger: self.logger.info("admin_download_zip_done", path=str(zip_path))
        return zip_path  # Path será tratado no router
    
    async def delete_pdfs(self, names: List[str]) -> Dict[str, Any]:
        """Handler para deletar PDFs"""
        if not isinstance(names, list) or not names:
            return error("Lista de arquivos vazia.", codigo="EMPTY_LIST", status_code=400)
        
        usecase = DeletePdfsUseCase(self.pdf_engine)
        deleted = usecase.execute(names)
        return success({"deleted": deleted}, message="Arquivos removidos")
