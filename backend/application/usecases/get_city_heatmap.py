from __future__ import annotations

from typing import Dict, List
import logging
import asyncio
from backend.domain.repositories import CertificadoRepository
from backend.domain.services.geocoding import GeocodingService
from backend.application.dtos import CityHeatmapItemDTO, CityHeatmapResponseDTO

class GetCityHeatmapDataUseCase:
    def __init__(self, repository: CertificadoRepository, geocoding_service: GeocodingService, logger=None, cache_path: str | None = None, ttl_seconds: int = 43200):
        self.repository = repository
        self.geocoding_service = geocoding_service
        self._logger = logger or logging.getLogger("heatmap")
        self._cache_path = cache_path
        self._ttl = ttl_seconds

    async def execute(self) -> CityHeatmapResponseDTO:
        # Cache simples em arquivo (JSON)
        import json, os, time
        try:
            if self._cache_path and os.path.exists(self._cache_path):
                stat = os.stat(self._cache_path)
                age = time.time() - stat.st_mtime
                if age <= self._ttl:
                    with open(self._cache_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        self._logger.info("heatmap_cache_hit", path=self._cache_path, age=int(age))
                        return CityHeatmapResponseDTO(data=[CityHeatmapItemDTO(**item) for item in data.get("data", [])])
        except Exception:
            pass
        # 1. Busca todos os certificados
        certificados = await asyncio.to_thread(self.repository.list)
        self._logger.info(f"heatmap: total certificados={len(certificados)}")
        
        # 2. Agrega por cidade+bairro (chave única)
        locations: Dict[str, Dict[str, any]] = {}
        for cert in certificados:
            cidade_raw = cert.cidade.strip() if cert.cidade else ""
            bairro = cert.bairro.strip() if cert.bairro else ""
            # Normaliza cidade "IMPERATRIZ-MA" -> "Imperatriz, MA"
            def _norm_bairro(name: str) -> str:
                return name.replace("Ç", "C").replace("Ê", "E").replace("É", "E").replace("Á", "A").replace("Ã", "A").replace("Ô", "O").replace("Ó", "O").upper()

            bairro = _norm_bairro(bairro)
            if "-" in cidade_raw:
                parts = cidade_raw.split("-")
                cidade_base = parts[0].title()
                uf = parts[1].upper()
                cidade_fmt = f"{cidade_base}, {uf}"
            else:
                cidade_base = cidade_raw.title()
                cidade_fmt = cidade_base
            if not cidade_fmt or not bairro:
                self._logger.debug(f"heatmap: missing fields id={getattr(cert, 'id', '')} cidade='{cidade_fmt}' bairro='{bairro}'")
            
            if not cidade_fmt:
                continue
                
            # Chave única: cidade_fmt + bairro
            key = f"{cidade_fmt}|{bairro}"
            
            if key not in locations:
                endereco_completo = getattr(cert, "endereco", None)
                if endereco_completo:
                    full_address = f"{endereco_completo}, {cidade_fmt}, Brasil"
                else:
                    address_parts = []
                    if bairro:
                        address_parts.append(bairro)
                    if cidade_fmt:
                        address_parts.append(cidade_fmt)
                    address_parts.append("Brasil")
                    full_address = ", ".join(address_parts)
                self._logger.debug(f"heatmap: address='{full_address}'")
                location_data = {
                    "city": cidade_fmt,
                    "bairro": bairro,
                    "address": full_address,
                    "count": 0,
                }
                locations[key] = location_data
            
            locations[key]["count"] += 1
            
        # 3. Monta DTOs com geocoding
        items: List[CityHeatmapItemDTO] = []
        for location_data in locations.values():
            # Usa endereço completo para geocoding
            coords = await asyncio.to_thread(
                self.geocoding_service.get_coordinates, 
                location_data["address"]
            )
            self._logger.debug(f"heatmap: geocode address='{location_data['address']}' -> {coords}")
            
            lat = coords[0] if coords else None
            lon = coords[1] if coords else None
            
            items.append(CityHeatmapItemDTO(
                city=location_data["city"],
                bairro=location_data["bairro"],
                address=location_data["address"],
                count=location_data["count"],
                lat=lat,
                long=lon
            ))
            
        response = CityHeatmapResponseDTO(data=items)
        # Persistir cache
        try:
            if self._cache_path:
                os.makedirs(os.path.dirname(self._cache_path), exist_ok=True)
                with open(self._cache_path, "w", encoding="utf-8") as f:
                    json.dump(response.model_dump(), f, ensure_ascii=False)
                self._logger.info("heatmap_cache_write", path=self._cache_path, count=len(items))
        except Exception:
            pass
        return response
