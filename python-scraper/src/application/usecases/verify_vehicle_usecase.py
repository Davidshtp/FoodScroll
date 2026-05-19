from __future__ import annotations

from typing import Any, Dict, Optional

from src.domain.ports.runt_scraper_port import RuntScraperPort


class VerifyVehicleUseCase:
    def __init__(self, scraper: RuntScraperPort):
        self._scraper = scraper

    async def execute(
        self,
        session_id: str,
        plate: str,
        document_type: str,
        document_number: str,
        captcha_text: str,
    ) -> Dict[str, Any]:
        return await self._scraper.verify_vehicle(
            session_id=session_id,
            plate=plate,
            document_type=document_type,
            document_number=document_number,
            captcha_text=captcha_text,
        )

    async def captcha_b64_from_session(self, session_id: str) -> Optional[str]:
        return await self._scraper.captcha_b64_from_session(session_id)
