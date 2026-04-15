from __future__ import annotations

from src.domain.ports.runt_scraper_port import RuntScraperPort


class DiscardRuntSessionUseCase:
    def __init__(self, scraper: RuntScraperPort):
        self._scraper = scraper

    async def execute(self, session_id: str) -> None:
        await self._scraper.discard_session(session_id)
