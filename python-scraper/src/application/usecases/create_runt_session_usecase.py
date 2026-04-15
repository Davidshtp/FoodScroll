from __future__ import annotations

from typing import Any, Dict

from src.domain.ports.runt_scraper_port import RuntScraperPort


class CreateRuntSessionUseCase:
    def __init__(self, scraper: RuntScraperPort):
        self._scraper = scraper

    async def execute(self) -> Dict[str, Any]:
        return await self._scraper.create_session()
