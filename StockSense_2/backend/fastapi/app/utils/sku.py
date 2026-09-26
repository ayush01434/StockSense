from __future__ import annotations

import re
import secrets


def normalize_sku(value: str) -> str:
    value = re.sub(r"[^A-Za-z0-9_-]+", "-", value.strip()).strip("-")
    if not value:
        raise ValueError("SKU cannot be empty")
    return value.upper()


def generate_sku(prefix: str = "SKU") -> str:
    return f"{normalize_sku(prefix)}-{secrets.token_hex(4).upper()}"
