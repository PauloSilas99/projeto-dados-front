from __future__ import annotations

from typing import Any, Dict, List, Optional
import asyncio
from backend.domain.repositories import CertificadoRepository
from backend.application.dtos import CertificadoListItemDTO

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
    ) -> List[CertificadoListItemDTO]:
        certificados = await asyncio.to_thread(self.repository.list)
        
        filtrados: List[Dict[str, Any]] = []
        for c in certificados:
            data = c.to_dict()
            if id and str(data.get("id", "")) != id:
                continue
            if bairro and str(data.get("bairro", "")).strip().lower() != bairro.strip().lower():
                continue
            if cidade and str(data.get("cidade", "")).strip().lower() != cidade.strip().lower():
                continue
            v_raw = data.get("valor")
            try:
                v = float(str(v_raw).replace(",", ".")) if v_raw is not None and str(v_raw).strip() != "" else None
            except Exception:
                v = None
            if min_valor is not None and (v is None or v < min_valor):
                continue
            if max_valor is not None and (v is None or v > max_valor):
                continue
            filtrados.append(data)
            
        respostas: List[CertificadoListItemDTO] = []
        page_items = filtrados[offset : offset + max(0, limit)]
        
        for data in page_items:
            numero = str(data.get("numero_certificado", ""))
            pdf_path = await asyncio.to_thread(self.repository.get_pdf_path, numero)
            respostas.append(
                CertificadoListItemDTO(
                    id=str(data.get("id", "")),
                    numero_certificado=numero,
                    razao_social=str(data.get("razao_social", "")),
                    cidade=str(data.get("cidade", "")),
                    valor=data.get("valor"),
                    data_execucao=data.get("data_execucao"),
                    urls=None,
                )
            )
            
        return respostas
