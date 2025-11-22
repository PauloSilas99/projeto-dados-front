from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse

from engine_excel_to_pdf.interface import MotorCertificados
from backend.deps import get_motor, get_certificado_repository
from backend.response import success, error
from backend.domain.repositories import CertificadoRepository

# Use Cases
from backend.usecases.upload_excel import UploadExcelUseCase
from backend.usecases.create_manual import CreateManualCertificateUseCase
from backend.usecases.list_certificates import ListCertificatesUseCase
from backend.usecases.get_certificate import GetCertificateUseCase, DownloadPdfUseCase, DownloadSpreadsheetUseCase

router = APIRouter(prefix="/certificados", tags=["certificados"])

@router.post("")
async def criar_certificado_manual(
    payload: Dict[str, Any],
    motor: MotorCertificados = Depends(get_motor),
) -> Dict[str, Any]:
    try:
        use_case = CreateManualCertificateUseCase(motor)
        result = await use_case.execute(payload)
        return success(result, message="Certificado criado com sucesso")
    except Exception as e:
        return error(str(e), codigo="MANUAL_CREATION_ERROR", status_code=500)

@router.get("")
async def listar_certificados(
    id: str | None = None,
    bairro: str | None = None,
    cidade: str | None = None,
    min_valor: float | None = None,
    max_valor: float | None = None,
    limit: int = 100,
    offset: int = 0,
    repo: CertificadoRepository = Depends(get_certificado_repository),
) -> List[Dict[str, Any]]:
    try:
        use_case = ListCertificatesUseCase(repo)
        result = await use_case.execute(
            id=id,
            bairro=bairro,
            cidade=cidade,
            min_valor=min_valor,
            max_valor=max_valor,
            limit=limit,
            offset=offset
        )
        return success(result, message="Lista de certificados")
    except Exception as e:
        return error(str(e), codigo="LIST_ERROR", status_code=500)

@router.post("/upload-excel")
async def upload_excel(
    arquivo: UploadFile = File(...),
    motor: MotorCertificados = Depends(get_motor),
) -> Dict[str, Any]:
    try:
        use_case = UploadExcelUseCase(motor)
        result = await use_case.execute(arquivo)
        return success(result, message="Upload processado com sucesso")
    except ValueError as e:
        return error(str(e), codigo="INVALID_FORMAT", status_code=400)
    except Exception as e:
        return error(str(e), codigo="UPLOAD_ERROR", status_code=500)

@router.get("/{id}")
async def obter_por_id(
    id: str,
    motor: MotorCertificados = Depends(get_motor),
    repo: CertificadoRepository = Depends(get_certificado_repository),
) -> Dict[str, Any]:
    try:
        use_case = GetCertificateUseCase(repo, motor)
        result = await use_case.execute(id)
        return success(result, message="Certificado recuperado com sucesso")
    except RuntimeError as e:
        return error(str(e), codigo="NOT_FOUND", status_code=404)
    except Exception as e:
        return error(str(e), codigo="GET_ERROR", status_code=500)

@router.get("/{id}/pdf")
async def baixar_pdf_por_id(
    id: str,
    motor: MotorCertificados = Depends(get_motor),
    repo: CertificadoRepository = Depends(get_certificado_repository),
) -> FileResponse:
    try:
        use_case = DownloadPdfUseCase(repo, motor)
        pdf_path = await use_case.execute(id)
        return FileResponse(path=pdf_path, filename=pdf_path.name, media_type="application/pdf")
    except FileNotFoundError as e:
        return error(str(e), codigo="PDF_NOT_FOUND", status_code=404)
    except RuntimeError as e:
        return error(str(e), codigo="NOT_FOUND", status_code=404)
    except Exception as e:
        return error(str(e), codigo="DOWNLOAD_ERROR", status_code=500)

@router.get("/{id}/planilha")
async def baixar_planilha_por_id(
    id: str,
    repo: CertificadoRepository = Depends(get_certificado_repository),
) -> FileResponse:
    try:
        use_case = DownloadSpreadsheetUseCase(repo)
        planilha_path = await use_case.execute(id)
        return FileResponse(
            path=planilha_path,
            filename=planilha_path.name,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    except FileNotFoundError as e:
        return error(str(e), codigo="SPREADSHEET_NOT_READY", status_code=404)
    except Exception as e:
        return error(str(e), codigo="DOWNLOAD_ERROR", status_code=500)
