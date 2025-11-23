from abc import ABC, abstractmethod
from typing import Tuple, Optional

class GeocodingService(ABC):
    """Interface para serviço de geocodificação (Domain Service)"""
    
    @abstractmethod
    def get_coordinates(self, city: str) -> Optional[Tuple[float, float]]:
        """
        Retorna (latitude, longitude) para uma cidade.
        Retorna None se não encontrar.
        """
        pass
