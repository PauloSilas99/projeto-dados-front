from __future__ import annotations

import json
import hashlib
from pathlib import Path
from typing import Any, Dict


class ProcessedFilesIndex:
    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.index_path = (self.base_dir / "uploads_index.jsonl").resolve()
        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.index_path.exists():
            self.index_path.touch()

    @staticmethod
    def sha256_bytes(data: bytes) -> str:
        h = hashlib.sha256()
        h.update(data)
        return h.hexdigest()

    def exists(self, file_hash: str) -> bool:
        try:
            with self.index_path.open("r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        entry = json.loads(line)
                        if entry.get("hash") == file_hash:
                            return True
                    except Exception:
                        continue
        except FileNotFoundError:
            return False
        return False

    def add(self, entry: Dict[str, Any]) -> None:
        payload = {
            "hash": entry.get("hash"),
            "filename": entry.get("filename"),
            "numero_certificado": entry.get("numero_certificado"),
            "cert_id": entry.get("cert_id"),
            "pdf": entry.get("pdf"),
            "planilha": entry.get("planilha"),
            "processed_at": entry.get("processed_at"),
        }
        with self.index_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(payload) + "\n")

