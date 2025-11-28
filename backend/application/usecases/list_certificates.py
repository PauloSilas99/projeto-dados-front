from __future__ import annotations

from typing import Any, Dict, List, Optional
import asyncio
from backend.domain.repositories import CertificadoRepository
from backend.application.dtos import CertificadoListItemDTO

class ListCertificatesUseCase:
    def __init__(self, repository: CertificadoRepository, logger=None):
        self.repository = repository
        self.logger = logger

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
        if self.logger: self.logger.info("list_certs_filters", id=id, bairro=bairro, cidade=cidade, min_valor=min_valor, max_valor=max_valor, limit=limit, offset=offset)
        certificados = await asyncio.to_thread(self.repository.list)
        
        filtrados: List[Dict[str, Any]] = []
        def _norm(s: Any) -> str:
            try:
                return str(s).strip().lower()
            except Exception:
                return ""

        for c in certificados:
            data = c.to_dict()
            if id and _norm(data.get("id", "")) != _norm(id):
                continue
            if bairro and _norm(data.get("bairro", "")) != _norm(bairro):
                continue
            # cidade: permitir startswith e contains para maior flexibilidade
            if cidade:
                dc = _norm(data.get("cidade", ""))
                qc = _norm(cidade)
                if not (dc == qc or dc.startswith(qc) or qc in dc):
                    continue
            v_raw = data.get("valor")
            def _to_float(val: Any) -> float | None:
                if val is None:
                    return None
                s = str(val).strip()
                if not s:
                    return None
                s = s.replace("R$", "").replace(" ", "")
                # Trata formatos brasileiros com separador de milhar
                if "," in s and "." in s:
                    s = s.replace(".", "").replace(",", ".")
                elif "," in s and s.count(",") == 1 and s.rfind(",") > s.rfind("."):
                    s = s.replace(",", ".")
                try:
                    return float(s)
                except Exception:
                    return None

            v = _to_float(v_raw)
            if min_valor is not None and (v is None or v < min_valor):
                continue
            if max_valor is not None and (v is None or v > max_valor):
                continue
            filtrados.append(data)
            
        respostas: List[CertificadoListItemDTO] = []
        page_items = filtrados[offset : offset + max(0, limit)]
        if self.logger: self.logger.debug("list_certs_counts", total=len(certificados), filtrados=len(filtrados), page=len(page_items))
        
        for data in page_items:
            numero = str(data.get("numero_certificado", ""))
            pdf_path = await asyncio.to_thread(self.repository.get_pdf_path, numero)
            respostas.append(
                CertificadoListItemDTO(
                    id=str(data.get("id", "")),
                    numero_certificado=numero,
                    razao_social=str(data.get("razao_social", "")),
                    bairro=str(data.get("bairro", "")),
                    cidade=str(data.get("cidade", "")),
                    valor=data.get("valor"),
                    data_execucao=data.get("data_execucao"),
                    urls=None,
                )
            )
            
        return respostas
