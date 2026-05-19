from __future__ import annotations

from typing import Any, Dict

from src.domain.ports.runt_license_scraper_port import RuntLicenseScraperPort


class VerifyLicenseUseCase:
    def __init__(self, scraper: RuntLicenseScraperPort):
        self._scraper = scraper

    async def execute(
        self,
        session_id: str,
        document_type: str,
        document_number: str,
        captcha_text: str,
    ) -> Dict[str, Any]:
        """Verifica la licencia a partir de la sesión y devuelve los datos de la licencia."""
        return await self._scraper.verify_license(
            session_id=session_id,
            document_type=document_type,
            document_number=document_number,
            captcha_text=captcha_text,
        )

    async def refresh_captcha(self, session_id: str) -> str:
        """Obtiene un nuevo captcha para la sesión existente."""
        return await self._scraper.refresh_captcha(session_id)

    async def captcha_b64_from_session(self, session_id: str) -> str:
        """Extrae el captcha actual de una sesión existente.
        Réplica exacta de la extracción de create_session.
        """
        return await self._scraper.captcha_b64_from_session(session_id)
