from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Protocol


@dataclass
class LogRecord:
    ts: str
    lvl: str
    cmp: str
    msg: str
    ctx: Dict[str, Any]


class LoggerPort(Protocol):
    def debug(self, msg: str, **ctx: Any) -> None: ...
    def info(self, msg: str, **ctx: Any) -> None: ...
    def warn(self, msg: str, **ctx: Any) -> None: ...
    def error(self, msg: str, **ctx: Any) -> None: ...
    def with_component(self, component: str) -> "LoggerPort": ...

