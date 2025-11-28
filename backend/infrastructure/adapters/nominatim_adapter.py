import os
import time
import random
import httpx
from typing import Tuple, Optional, Dict
from backend.domain.services.geocoding import GeocodingService
from backend.domain.services.logging import LoggerPort

class NominatimAdapter(GeocodingService):
    """
    Adaptador para o serviço de geocodificação Nominatim (OpenStreetMap).
    Inclui cache simples em memória para evitar rate limiting.
    """
    
    _cache: Dict[str, Optional[Tuple[float, float]]] = {}
    
    def __init__(self, user_agent: str = "projeto-dados-backend/1.0", logger: Optional[LoggerPort] = None):
        self.base_url = "https://nominatim.openstreetmap.org/search"
        self.headers = {"User-Agent": user_agent}
        self.logger = logger
        self.timeout = float(os.getenv("GEOCODING_TIMEOUT_SECS", "10"))
        self.retries = int(os.getenv("GEOCODING_RETRIES", "3"))
        self.backoff_min = int(os.getenv("GEOCODING_BACKOFF_MS_MIN", "300"))
        self.backoff_max = int(os.getenv("GEOCODING_BACKOFF_MS_MAX", "1200"))

    def get_coordinates(self, city: str) -> Optional[Tuple[float, float]]:
        # Normaliza a chave do cache
        cache_key = city.strip().lower()
        
        if cache_key in self._cache:
            return self._cache[cache_key]
            
        query = city
        if "brazil" not in query.lower() and "brasil" not in query.lower():
            query = f"{city}, Brazil"

        params = {"q": query, "format": "json", "limit": 1, "countrycodes": "br"}
        attempt = 0
        start = time.time()
        city_center: Optional[Tuple[float, float]] = None
        try:
            parts = [p.strip() for p in query.split(",")]
            city_part = parts[1] if len(parts) >= 2 else parts[0]
            state_part = parts[2] if len(parts) >= 3 else ""
            c_params = {"city": city_part, "state": state_part, "country": "Brazil", "format": "json", "limit": 1}
            c_resp = httpx.get(self.base_url, params=c_params, headers=self.headers, timeout=self.timeout)
            if c_resp.status_code == 200:
                c_data = c_resp.json()
                if c_data:
                    city_center = (float(c_data[0]["lat"]), float(c_data[0]["lon"]))
                    if city_center:
                        lat, lon = city_center
                        lat_delta = 0.2
                        lon_delta = 0.2
                        viewbox = f"{lon-lon_delta},{lat-lat_delta},{lon+lon_delta},{lat+lat_delta}"
                        params.update({"viewbox": viewbox, "bounded": 1})
        except Exception:
            pass
        while attempt <= self.retries:
            try:
                if self.logger: self.logger.debug("geocode_start", query=query, attempt=attempt)
                response = httpx.get(self.base_url, params=params, headers=self.headers, timeout=self.timeout)
                response.raise_for_status()
                data = response.json()
                if data and len(data) > 0:
                    lat = float(data[0]["lat"])
                    lon = float(data[0]["lon"])
                    result = (lat, lon)
                else:
                    if city_center:
                        result = city_center
                        if self.logger: self.logger.warn("geocode_fallback_city_center", query=query, coords=result)
                    else:
                        result = None
                self._cache[cache_key] = result
                if result is not None:
                    if self.logger: self.logger.info("geocode_ok", query=query, coords=result, elapsed_ms=int((time.time()-start)*1000))
                else:
                    if self.logger: self.logger.warn("geocode_no_result", query=query, elapsed_ms=int((time.time()-start)*1000))
                return result
            except Exception as e:
                if attempt >= self.retries:
                    if self.logger: self.logger.warn("geocode_timeout", query=query, error=str(e), elapsed_ms=int((time.time()-start)*1000))
                    return None
                delay = random.randint(self.backoff_min, self.backoff_max) / 1000.0
                time.sleep(delay)
                attempt += 1
