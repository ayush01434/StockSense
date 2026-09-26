from __future__ import annotations


def search_pattern(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    if not value:
        return None
    # Escape PostgREST wildcard characters so a normal search string cannot change the pattern.
    value = value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{value}%"
