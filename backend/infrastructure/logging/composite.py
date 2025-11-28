from __future__ import annotations

from typing import Any, Dict, List

from backend.domain.services.logging import LoggerPort


class CompositeLogger(LoggerPort):
    def __init__(self, loggers: List[LoggerPort]):
        self._loggers = loggers

    def with_component(self, component: str) -> "LoggerPort":
        return CompositeLogger([l.with_component(component) for l in self._loggers])

    def debug(self, msg: str, **ctx: Any) -> None:
        for l in self._loggers: l.debug(msg, **ctx)

    def info(self, msg: str, **ctx: Any) -> None:
        for l in self._loggers: l.info(msg, **ctx)

    def warn(self, msg: str, **ctx: Any) -> None:
        for l in self._loggers: l.warn(msg, **ctx)

    def error(self, msg: str, **ctx: Any) -> None:
        for l in self._loggers: l.error(msg, **ctx)

