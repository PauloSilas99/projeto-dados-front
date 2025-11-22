from __future__ import annotations

import os
from pathlib import Path

from fastapi import Depends, Request

from engine_excel_to_pdf.interface import MotorCertificados
from engine_excel_to_pdf.config import EngineConfig

from .analytics_service import AnalyticsService


def init_motor() -> MotorCertificados:
    output_dir = os.getenv("ENGINE_OUTPUT_DIR")
    assets_dir = os.getenv("ENGINE_ASSETS_DIR")
    logo_path = os.getenv("ENGINE_LOGO_PATH")

    config_kwargs = {}
    if output_dir:
        config_kwargs["output_dir"] = Path(output_dir)
    if assets_dir:
        assets_path = Path(assets_dir)
        if assets_path.name == "templates":
            assets_path = assets_path.parent
        config_kwargs["assets_dir"] = assets_path
    if logo_path:
        config_kwargs["logo_path"] = Path(logo_path)

    config = EngineConfig(**config_kwargs) if config_kwargs else EngineConfig()
    return MotorCertificados(config=config)


def get_motor(request: Request) -> MotorCertificados:
    motor = getattr(request.app.state, "motor", None)
    if motor is None:
        motor = init_motor()
        request.app.state.motor = motor
    return motor



def get_analytics_service(motor: MotorCertificados = Depends(get_motor)) -> AnalyticsService:
    return AnalyticsService(motor)

from backend.infrastructure.repositories import FileCertificadoRepository
from backend.domain.repositories import CertificadoRepository

def get_certificado_repository(motor: MotorCertificados = Depends(get_motor)) -> CertificadoRepository:
    return FileCertificadoRepository(motor)