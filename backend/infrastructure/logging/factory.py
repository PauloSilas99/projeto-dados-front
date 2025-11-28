from __future__ import annotations

import os
from typing import List

from backend.infrastructure.logging.formatters import StructuredFormatter
from backend.infrastructure.logging.adapters import ConsoleLoggerAdapter, FileLoggerAdapter, ExternalLoggerAdapter
from backend.infrastructure.logging.composite import CompositeLogger
from backend.domain.services.logging import LoggerPort


class LoggerFactory:
    @staticmethod
    def from_env(component: str = "app") -> LoggerPort:
        level = os.getenv("BACKEND_LOG_LEVEL", "INFO").upper()
        dests = [d.strip() for d in os.getenv("BACKEND_LOG_DESTS", "console").split(",") if d.strip()]
        fmt = os.getenv("BACKEND_LOG_FORMAT", "text").lower()
        file_path = os.getenv("BACKEND_LOG_FILE_PATH", "/app/outputs/logs/app.log")
        ext_url = os.getenv("BACKEND_LOG_EXTERNAL_URL")
        ext_token = os.getenv("BACKEND_LOG_EXTERNAL_TOKEN")

        formatter = StructuredFormatter(fmt)
        loggers: List[LoggerPort] = []

        for d in dests:
            if d == "console":
                loggers.append(ConsoleLoggerAdapter(formatter, component, level))
            elif d == "file":
                loggers.append(FileLoggerAdapter(formatter, component, level, path=file_path))
            elif d == "external":
                loggers.append(ExternalLoggerAdapter(formatter, component, level, url=ext_url, token=ext_token))

        if not loggers:
            loggers.append(ConsoleLoggerAdapter(formatter, component, level))

        return CompositeLogger(loggers)

