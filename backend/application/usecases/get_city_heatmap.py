from __future__ import annotations

from typing import Dict, List
import asyncio
from backend.domain.repositories import CertificadoRepository
from backend.domain.services.geocoding import GeocodingService
from backend.application.dtos import CityHeatmapItemDTO, CityHeatmapResponseDTO

class GetCityHeatmapDataUseCase:
    def __init__(self, repository: CertificadoRepository, geocoding_service: GeocodingService):
        self.repository = repository
        self.geocoding_service = geocoding_service

    async def execute(self) -> CityHeatmapResponseDTO:
        # 1. Busca todos os certificados
        certificados = await asyncio.to_thread(self.repository.list)
        
        # 2. Agrega por cidade+bairro (chave única)
        locations: Dict[str, Dict[str, any]] = {}
        for cert in certificados:
            cidade = cert.cidade.strip() if cert.cidade else ""
            bairro = cert.bairro.strip() if cert.bairro else ""
            
            if not cidade:
                continue
                
            # Chave única: cidade + bairro
            key = f"{cidade}|{bairro}"
            
            if key not in locations:
                # Monta endereço completo para geocoding mais preciso
                # Formato: "Bairro, Cidade, Estado, Brasil"
                address_parts = []
                if bairro:
                    address_parts.append(bairro)
                address_parts.append(cidade)
                address_parts.append("Brasil")
                full_address = ", ".join(address_parts)
                
                locations[key] = {
                    "city": cidade,
                    "bairro": bairro,
                    "address": full_address,
                    "count": 0
                }
            
            locations[key]["count"] += 1
            
        # 3. Monta DTOs com geocoding
        items: List[CityHeatmapItemDTO] = []
        for location_data in locations.values():
            # Usa endereço completo para geocoding
            coords = await asyncio.to_thread(
                self.geocoding_service.get_coordinates, 
                location_data["address"]
            )
            
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
            
        return CityHeatmapResponseDTO(data=items)
