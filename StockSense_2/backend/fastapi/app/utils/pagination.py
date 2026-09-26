from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Pagination:
    page: int
    page_size: int

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def end(self) -> int:
        return self.offset + self.page_size - 1


def normalize_pagination(page: int, page_size: int, *, max_page_size: int, default_page_size: int) -> Pagination:
    safe_page = max(1, int(page or 1))
    safe_size = int(page_size or default_page_size)
    safe_size = max(1, min(safe_size, max_page_size))
    return Pagination(safe_page, safe_size)
