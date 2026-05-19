from __future__ import annotations

from src.domain.ports.runt_license_scraper_port import RuntLicenseScraperPort


class DiscardRuntSessionUseCase:
    def __init__(self, scraper: RuntLicenseScraperPort):
        self._scraper = scraper

    async def execute(self, session_id: str) -> None:
        await self._scraper.discard_session(session_id)
