import pytest
from backend.application.usecases.upload_excel import UploadExcelUseCase, UploadExcelInput
from backend.domain.services.pdf_engine import PdfEngine
from pathlib import Path
from typing import Any, Dict, List, Optional
from backend.domain.exceptions import ValidationError


class _StubEngine(PdfEngine):
    def processar_upload(self, file_path: Path) -> Dict[str, Any]:
        return {"certificado": type("C", (), {"numero_certificado": "001", "to_dict": lambda self: {"id": "1"}})(), "planilha": str(file_path)}

    def listar_certificados(self) -> List[Any]:
        return []

    def get_bundle_by_numero(self, numero_certificado: str) -> Optional[Any]:
        return type("Bundle", (), {"certificado": type("C", (), {"numero_certificado": numero_certificado})()})()

    def get_csv_manager(self):
        return type("CSV", (), {})()

    def get_pdf_generator(self):
        return type("PDFGen", (), {})()

    def get_spreadsheet_generator(self):
        return type("SheetGen", (), {})()

    def criar_certificado_manual(self, dados: Dict[str, Any]) -> Dict[str, Any]:
        return dados


@pytest.mark.asyncio
async def test_upload_excel_rejeita_extensao_invalida():
    engine = _StubEngine()
    uc = UploadExcelUseCase(engine)
    inp = UploadExcelInput(filename="dados.txt", file_bytes=b"abc")
    with pytest.raises(ValidationError):
        await uc.execute(inp)
