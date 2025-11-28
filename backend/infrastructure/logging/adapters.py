from __future__ import annotations

from typing import Any, Dict, Optional
import sys
import os
import time
import json
import httpx

from backend.domain.services.logging import LoggerPort
from backend.infrastructure.logging.formatters import StructuredFormatter


class BaseLogger(LoggerPort):
    def __init__(self, formatter: StructuredFormatter, component: str = "app", level: str = "INFO"):
        self.formatter = formatter
        self.component = component
        self.level = level.upper()

    def _should(self, lvl: str) -> bool:
        order = ["DEBUG", "INFO", "WARN", "ERROR"]
        return order.index(lvl) >= order.index(self.level)

    def with_component(self, component: str) -> "LoggerPort":
        return self.__class__(self.formatter, component, self.level)

    def debug(self, msg: str, **ctx: Any) -> None:
        if self._should("DEBUG"): self._emit("DEBUG", msg, ctx)

    def info(self, msg: str, **ctx: Any) -> None:
        if self._should("INFO"): self._emit("INFO", msg, ctx)

    def warn(self, msg: str, **ctx: Any) -> None:
        if self._should("WARN"): self._emit("WARN", msg, ctx)

    def error(self, msg: str, **ctx: Any) -> None:
        if self._should("ERROR"): self._emit("ERROR", msg, ctx)

    def _emit(self, lvl: str, msg: str, ctx: Dict[str, Any]) -> None:
        raise NotImplementedError


class ConsoleLoggerAdapter(BaseLogger):
    def _emit(self, lvl: str, msg: str, ctx: Dict[str, Any]) -> None:
        line = self.formatter.format(lvl, self.component, msg, ctx)
        stream = sys.stderr if lvl in ("WARN", "ERROR") else sys.stdout
        print(line, file=stream)


class FileLoggerAdapter(BaseLogger):
    def __init__(self, formatter: StructuredFormatter, component: str = "app", level: str = "INFO", path: Optional[str] = None):
        super().__init__(formatter, component, level)
        self.path = path or "/app/outputs/logs/app.log"
        os.makedirs(os.path.dirname(self.path), exist_ok=True)

    def _emit(self, lvl: str, msg: str, ctx: Dict[str, Any]) -> None:
        line = self.formatter.format(lvl, self.component, msg, ctx)
        with open(self.path, "a", encoding="utf-8") as f:
            f.write(line + "\n")


class ExternalLoggerAdapter(BaseLogger):
    def __init__(self, formatter: StructuredFormatter, component: str = "app", level: str = "INFO", url: Optional[str] = None, token: Optional[str] = None):
        super().__init__(formatter, component, level)
        self.url = url
        self.token = token

    def _emit(self, lvl: str, msg: str, ctx: Dict[str, Any]) -> None:
        if not self.url:
            return
        payload = {
            "level": lvl,
            "component": self.component,
            "message": msg,
            "context": ctx,
            "timestamp": time.time(),
        }
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        try:
            httpx.post(self.url, headers=headers, data=json.dumps(payload), timeout=2.0)
        except Exception:
            # fail silently to avoid breaking app flow
            pass

