from __future__ import annotations

from typing import Optional

from src.infrastructure.circuit_breaker import CircuitBreaker, CircuitBreakerOpenError, create_circuit_breaker
from src.infrastructure.logging import get_logger
from src.domain.ports.runt_scraper_port import RuntScraperPort
from src.scraper.runt_scraper import RuntScraper, get_scraper as get_runt_scraper

logger = get_logger(__name__)


def get_adapter() -> PlaywrightRuntScraperAdapter:
    return PlaywrightRuntScraperAdapter()


class PlaywrightRuntScraperAdapter(RuntScraperPort):
    def __init__(self):
        self._impl: Optional[RuntScraper] = None
        self._breaker: CircuitBreaker = create_circuit_breaker()

    def _get_impl(self) -> RuntScraper:
        if self._impl is None:
            self._impl = get_runt_scraper()
            logger.debug("RuntScraper initialized")
        return self._impl

    def get_impl(self) -> RuntScraper:
        return self._get_impl()
    
    def get_circuit_breaker_status(self) -> dict:
        return self._breaker.get_status()

    async def create_session(self):
        logger.info("Creating RUNT session via adapter")
        
        try:
            impl = self._get_impl()
            result = await self._breaker.call_async(impl.create_session)
            logger.debug("Session created: %s", result.get('sessionId', '')[:8])
            return result
        except CircuitBreakerOpenError as e:
            logger.warning("Circuit breaker prevented session creation: %s", e)
            return {
                'error': True,
                'code': 'CIRCUIT_BREAKER_OPEN',
                'message': f'RUNT temporalmente no disponible. Intente en {e.retry_after:.0f} segundos.',
            }

    async def verify_vehicle(
        self,
        session_id: str,
        plate: str,
        document_type: str,
        document_number: str,
        captcha_text: str,
    ):
        logger.info("Verifying vehicle: plate=%s, session=%s", plate, session_id[:8])
        
        try:
            impl = self._get_impl()
            result = await self._breaker.call_async(
                impl.verify_vehicle,
                session_id=session_id,
                plate=plate,
                document_type=document_type,
                document_number=document_number,
                captcha_text=captcha_text,
            )
            if result.get('error'):
                logger.warning("Vehicle verify failed: %s - %s", result.get('code'), result.get('message'))
            else:
                logger.info("Vehicle verified successfully: %s", plate)
            return result
        except CircuitBreakerOpenError as e:
            logger.warning("Circuit breaker prevented vehicle verify: %s", e)
            return {
                'error': True,
                'code': 'CIRCUIT_BREAKER_OPEN',
                'message': f'RUNT temporalmente no disponible. Intente en {e.retry_after:.0f} segundos.',
            }

    async def discard_session(self, session_id: str) -> None:
        logger.debug("Discarding session: %s", session_id[:8])
        impl = self._get_impl()
        try:
            await impl.discard_session(session_id)
        except Exception as e:
            logger.warning("Error discarding session: %s", e)

    async def captcha_b64_from_session(self, session_id: str) -> Optional[str]:
        logger.debug("Getting captcha from session: %s", session_id[:8])
        impl = self._get_impl()
        try:
            result = await impl.captcha_b64_from_session(session_id)
            logger.debug("Captcha extracted: length=%s", len(result) if result else 0)
            return result
        except Exception as e:
            logger.warning("Error getting captcha from session: %s", e)
            return None
