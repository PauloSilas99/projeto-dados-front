from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

class StructuredFormatter:
    def __init__(self, fmt: str = "text"):
        self.fmt = fmt

    def format(self, lvl: str, cmp: str, msg: str, ctx: Dict[str, Any]) -> str:
        ts = now_iso()
        if self.fmt == "json":
            return json.dumps({"ts": ts, "lvl": lvl, "cmp": cmp, "msg": msg, "ctx": ctx}, ensure_ascii=False)
        parts = [ts, lvl.upper(), cmp, msg]
        if ctx:
            parts.append(" ")
            parts.append(", ".join(f"{k}={repr(v)}" for k, v in ctx.items()))
        return " ".join(str(p) for p in parts)

