from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi.concurrency import run_in_threadpool
from backend.domain.repositories import CertificadoRepository
from backend.utils import parse_valor, build_resource_urls_id

class ListCertificatesUseCase:
    def __init__(self, repository: CertificadoRepository):
        self.repository = repository

    async def execute(
        self,
        id: Optional[str] = None,
        bairro: Optional[str] = None,
        cidade: Optional[str] = None,
        min_valor: Optional[float] = None,
        max_valor: Optional[float] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        # Listing might involve reading many files, so we offload it
        # The repository implementation should handle the "how"
        certificados = await run_in_threadpool(self.repository.list)
        
        filtrados: List[Dict[str, Any]] = []
        for c in certificados:
            data = c.to_dict()
            if id and str(data.get("id", "")) != id:
                continue
            if bairro and str(data.get("bairro", "")).strip().lower() != bairro.strip().lower():
                continue
            if cidade and str(data.get("cidade", "")).strip().lower() != cidade.strip().lower():
                continue
            v = parse_valor(data.get("valor"))
            if min_valor is not None and (v is None or v < min_valor):
                continue
            if max_valor is not None and (v is None or v > max_valor):
                continue
            filtrados.append(data)
            
        respostas: List[Dict[str, Any]] = []
        # Pagination happens in memory for now
        page_items = filtrados[offset : offset + max(0, limit)]
        
        for data in page_items:
            numero = str(data.get("numero_certificado", ""))
            
            # Check for existing PDF (disk I/O) via repository
            pdf_path = await run_in_threadpool(self.repository.get_pdf_path, numero)
            
            respostas.append(
                {
                    "certificado": data,
                    "urls": build_resource_urls_id(str(data.get("id", ""))),
                    "arquivos": {
                        "pdf": str(pdf_path.resolve()) if pdf_path else None,
                        "planilha": str(self.repository.get_consolidated_spreadsheet_path().resolve()),
                    },
                }
            )
            
        return respostas
