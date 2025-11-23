"""
Certificados Handlers - Framework-agnostic business logic
Recebe dependências via construtor (DI manual estilo Go/Node)
"""
from __future__ import annotations

from typing import Any, Dict, List
import asyncio

from pathlib import Path

from backend.domain.services.pdf_engine import PdfEngine
from backend.domain.repositories import CertificadoRepository
from backend.domain.exceptions import (
    CertificadoNotFoundError,
    ValidationError,
    FileProcessingError,
    DataInconsistencyError
)
from backend.interface.presenters import success, error, build_response, build_resource_urls_id
from backend.application.usecases.upload_excel import UploadExcelUseCase, UploadExcelInput
from backend.application.usecases.create_manual import CreateManualCertificateUseCase
from backend.application.usecases.list_certificates import ListCertificatesUseCase
from backend.application.usecases.get_certificate import (
    GetCertificateUseCase,
    DownloadPdfUseCase,
    DownloadSpreadsheetUseCase
)


class CertificadosController:
    """
    Controllers para endpoints de certificados.
    Desacoplado do FastAPI - recebe dependências no construtor.
    """
    
    def __init__(self, pdf_engine: PdfEngine, repository: CertificadoRepository):
        """
        Injeta dependências via construtor (DI manual).
        
        Args:
            pdf_engine: Interface do motor de PDF
            repository: Interface do repositório
        """
        self.pdf_engine = pdf_engine
        self.repository = repository
    
    async def criar_manual(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Controller para criação manual de certificado"""
        try:
            use_case = CreateManualCertificateUseCase(self.pdf_engine)
            dto = await use_case.execute(payload)
            # Adapta DTO para resposta HTTP
            response_payload = build_response(dto.bundle, dto.planilha_path, dto.pdf_path)
            if dto.id:
                response_payload["certificado"]["id"] = dto.id
                response_payload["arquivos"]["urls"] = build_resource_urls_id(dto.id)
            return success(response_payload, message="Certificado criado com sucesso")
        except ValidationError as e:
            return error(e.message, codigo="VALIDATION_ERROR", detalhes=e.errors, status_code=400)
        except Exception as e:
            return error(str(e), codigo="MANUAL_CREATION_ERROR", status_code=500)
    
    async def listar(
        self,
        id: str | None = None,
        bairro: str | None = None,
        cidade: str | None = None,
        min_valor: float | None = None,
        max_valor: float | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """Controller para listagem de certificados"""
        try:
            use_case = ListCertificatesUseCase(self.repository)
            result = await use_case.execute(
                id=id,
                bairro=bairro,
                cidade=cidade,
                min_valor=min_valor,
                max_valor=max_valor,
                limit=limit,
                offset=offset
            )
            # Monta URLs e arquivos na camada de interface
            resposta = []
            planilha = str(self.repository.get_consolidated_spreadsheet_path().resolve())
            for item in result:
                data = item.model_dump()
                # Serializa datetime para string ISO
                if data.get("data_execucao"):
                    data["data_execucao"] = data["data_execucao"].isoformat()
                    
                data["urls"] = build_resource_urls_id(str(data.get("id", "")))
                numero = data.get("numero_certificado", "")
                pdf_path = await asyncio.to_thread(self.repository.get_pdf_path, numero)
                    
                # Reshape para compatibilidade com frontend (Dashboard.tsx espera row.certificado.campo)
                reshaped_data = {
                    "certificado": {
                        "id": data["id"],
                        "numero_certificado": data["numero_certificado"],
                        "razao_social": data["razao_social"],
                        "cidade": data["cidade"],
                        "valor": data["valor"],
                        "data_execucao": data["data_execucao"],
                    },
                    "urls": build_resource_urls_id(str(data.get("id", ""))),
                    "arquivos": {
                        "pdf": str(pdf_path.resolve()) if pdf_path else None,
                        "planilha": planilha,
                    }
                }
                resposta.append(reshaped_data)
            return success(resposta, message="Lista de certificados")
        except Exception as e:
            import traceback
            traceback.print_exc()
            return error(str(e), codigo="LIST_ERROR", status_code=500)
    
    async def upload_excel(self, arquivo) -> Dict[str, Any]:
        """Controller para upload de Excel"""
        try:
            use_case = UploadExcelUseCase(self.pdf_engine)
            bytes_data = await arquivo.read()
            dto = await use_case.execute(UploadExcelInput(filename=arquivo.filename or "", file_bytes=bytes_data))
            
            # Adapta DTO para resposta HTTP (mantendo compatibilidade com frontend)
            result = {
                "numero_certificado": dto.numero_certificado,
                "planilha": str(dto.planilha_path.resolve()),
                "pdf": str(dto.pdf_path.resolve()),
                "cert_id": dto.id,
                "urls": build_resource_urls_id(dto.id) if dto.id else {}
            }
            return success(result, message="Upload processado com sucesso")
        except ValidationError as e:
            return error(e.message, codigo="VALIDATION_ERROR", detalhes=e.errors, status_code=400)
        except ValidationError as e:
            return error(e.message, codigo="VALIDATION_ERROR", detalhes=e.errors, status_code=400)
        except FileProcessingError as e:
            return error(e.message, codigo="FILE_PROCESSING_ERROR", detalhes=e.details, status_code=500)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return error(str(e), codigo="UPLOAD_ERROR", status_code=500)
    
    async def obter_por_id(self, id: str) -> Dict[str, Any]:
        """Handler para obter certificado por ID"""
        try:
            use_case = GetCertificateUseCase(self.repository, self.pdf_engine)
            result = await use_case.execute(id)
            numero = result["numero_certificado"]
            bundle = self.pdf_engine.get_bundle_entity_by_numero(numero)
            payload = build_response(bundle, result["planilha"], result["pdf"]) if bundle else {
                "certificado": {},
                "produtos": [],
                "metodos": [],
                "arquivos": {
                    "planilha": str(result["planilha"]),
                    "pdf": str(result["pdf"]),
                    "urls": {},
                },
            }
            payload["certificado"]["id"] = result["cert_id"]
            payload["arquivos"]["urls"] = build_resource_urls_id(result["cert_id"]) if result["cert_id"] else {}
            return success(payload, message="Certificado recuperado com sucesso")
        except CertificadoNotFoundError as e:
            return error(e.message, codigo="NOT_FOUND", status_code=404)
        except DataInconsistencyError as e:
            return error(e.message, codigo="DATA_INCONSISTENCY", status_code=500)
        except Exception as e:
            return error(str(e), codigo="GET_ERROR", status_code=500)
    
    async def baixar_pdf(self, id: str) -> Path | Dict[str, Any]:
        """
        Handler para baixar PDF.
        Retorna Path se sucesso, Dict com erro se falhar.
        """
        try:
            use_case = DownloadPdfUseCase(self.repository, self.pdf_engine)
            pdf_path = await use_case.execute(id)
            return pdf_path  # Path será tratado no router
        except CertificadoNotFoundError as e:
            return error(e.message, codigo="NOT_FOUND", status_code=404)
        except FileNotFoundError as e:
            return error(str(e), codigo="PDF_NOT_FOUND", status_code=404)
        except Exception as e:
            return error(str(e), codigo="DOWNLOAD_ERROR", status_code=500)
    
    async def baixar_planilha(self, id: str) -> Path | Dict[str, Any]:
        """
        Handler para baixar planilha.
        Retorna Path se sucesso, Dict com erro se falhar.
        """
        try:
            use_case = DownloadSpreadsheetUseCase(self.repository)
            planilha_path = await use_case.execute(id)
            return planilha_path  # Path será tratado no router
        except FileNotFoundError as e:
            return error(str(e), codigo="SPREADSHEET_NOT_READY", status_code=404)
        except Exception as e:
            return error(str(e), codigo="DOWNLOAD_ERROR", status_code=500)
