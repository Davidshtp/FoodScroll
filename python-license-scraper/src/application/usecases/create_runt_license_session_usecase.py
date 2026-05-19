from __future__ import annotations

from typing import Any, Dict

from src.domain.ports.runt_license_scraper_port import RuntLicenseScraperPort


class CreateRuntLicenseSessionUseCase:
    def __init__(self, scraper: RuntLicenseScraperPort):
        self._scraper = scraper

    async def execute(self) -> Dict[str, Any]:
        """Crea una sesión RUNT en la sección de documento y devuelve {'sessionId', 'captchaPngBase64'}"""
        return await self._scraper.create_session()
