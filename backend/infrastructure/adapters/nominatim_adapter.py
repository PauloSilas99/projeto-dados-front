import httpx
from typing import Tuple, Optional, Dict
from backend.domain.services.geocoding import GeocodingService

class NominatimAdapter(GeocodingService):
    """
    Adaptador para o serviço de geocodificação Nominatim (OpenStreetMap).
    Inclui cache simples em memória para evitar rate limiting.
    """
    
    _cache: Dict[str, Optional[Tuple[float, float]]] = {}
    
    def __init__(self, user_agent: str = "projeto-dados-backend/1.0"):
        self.base_url = "https://nominatim.openstreetmap.org/search"
        self.headers = {"User-Agent": user_agent}

    def get_coordinates(self, city: str) -> Optional[Tuple[float, float]]:
        # Normaliza a chave do cache
        cache_key = city.strip().lower()
        
        if cache_key in self._cache:
            return self._cache[cache_key]
            
        try:
            # Adiciona 'Brazil' para melhorar precisão se não tiver
            query = city
            if "brazil" not in query.lower() and "brasil" not in query.lower():
                query = f"{city}, Brazil"
                
            params = {
                "q": query,
                "format": "json",
                "limit": 1
            }
            
            # Chamada síncrona usando httpx (pode ser otimizado para async se necessário,
            # mas o contrato do domain service é agnóstico)
            response = httpx.get(self.base_url, params=params, headers=self.headers, timeout=5.0)
            response.raise_for_status()
            
            data = response.json()
            
            if data and len(data) > 0:
                lat = float(data[0]["lat"])
                lon = float(data[0]["lon"])
                result = (lat, lon)
            else:
                result = None
                
            self._cache[cache_key] = result
            return result
            
        except Exception as e:
            print(f"Erro no geocoding para {city}: {e}")
            return None
