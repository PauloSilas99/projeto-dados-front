from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional


class SystemStateService:
    """
    Serviço para gerenciar o estado global da aplicação (ex: status do cache, tempos de inicialização).
    Substitui o uso direto de `request.app.state` para desacoplar do framework web.
    """
    
    def __init__(self):
        self._motor_created_at: Optional[str] = None
        self._cache_last_cleared_at: Optional[str] = None
        
    def set_motor_created_at(self, timestamp: str) -> None:
        self._motor_created_at = timestamp
        
    def get_motor_created_at(self) -> Optional[str]:
        return self._motor_created_at
        
    def set_cache_last_cleared_at(self, timestamp: str) -> None:
        self._cache_last_cleared_at = timestamp
        
    def get_cache_last_cleared_at(self) -> Optional[str]:
        return self._cache_last_cleared_at
        
    def mark_cache_cleared(self) -> str:
        """Marca o cache como limpo agora e retorna o timestamp ISO."""
        now = datetime.now(timezone.utc).isoformat()
        self._cache_last_cleared_at = now
        return now
