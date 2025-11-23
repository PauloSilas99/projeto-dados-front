import os
from pathlib import Path

from engine_excel_to_pdf.config import EngineConfig


def make_engine_config() -> EngineConfig:
    base_dir = Path(__file__).resolve().parents[2]

    default_output_dir = base_dir / "outputs"

    config_kwargs = {
        "output_dir": default_output_dir,
    }

    env_output = os.getenv("ENGINE_OUTPUT_DIR")
    env_assets = os.getenv("ENGINE_ASSETS_DIR")
    env_logo = os.getenv("ENGINE_LOGO_PATH")

    if env_output:
        config_kwargs["output_dir"] = Path(env_output)
    if env_assets:
        assets_path = Path(env_assets)
        config_kwargs["assets_dir"] = assets_path
    if env_logo:
        lp = Path(env_logo)
        if not lp.is_absolute():
            lp = base_dir / lp
        config_kwargs["logo_path"] = lp

    return EngineConfig(**config_kwargs)
