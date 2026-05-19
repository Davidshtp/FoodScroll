from __future__ import annotations
from typing import Optional
from src.infrastructure.circuit_breaker import (
    CircuitBreaker,
    CircuitBreakerOpenError,
    create_circuit_breaker,
)
from src.infrastructure.logging import get_logger
from src.domain.ports.runt_license_scraper_port import RuntLicenseScraperPort
from src.scraper.runt_license_scraper import RuntLicenseScraper, get_scraper as get_runt_license_scraper

logger = get_logger(__name__)


def get_scraper() -> "PlaywrightRuntLicenseScraperAdapter":
    return PlaywrightRuntLicenseScraperAdapter()


class PlaywrightRuntLicenseScraperAdapter(RuntLicenseScraperPort):
    def __init__(self):
        self._impl: Optional[RuntLicenseScraper] = None
        self._breaker: CircuitBreaker = create_circuit_breaker()

    def _get_impl(self) -> RuntLicenseScraper:
        if self._impl is None:
            self._impl = get_runt_license_scraper()
            logger.debug('RuntLicenseScraper initialized')
        return self._impl

    def get_impl(self) -> RuntLicenseScraper:
        return self._get_impl()

    async def create_session(self):
        logger.debug('Creating RUNT document session via adapter')
        try:
            impl = self._get_impl()
            result = await self._breaker.call_async(impl.create_session)
            logger.debug('Session created (doc): %s', result.get('sessionId', '')[:8])
            return result
        except CircuitBreakerOpenError as e:
            logger.warning('Circuit breaker prevented doc session creation: %s', e)
            return {
                'error': True,
                'code': 'CIRCUIT_BREAKER_OPEN',
                'message': f'RUNT temporalmente no disponible. Intente en {e.retry_after:.0f} segundos.',
            }

    async def verify_license(
        self,
        session_id: str,
        document_type: str,
        document_number: str,
        captcha_text: str,
    ):
        logger.debug(
            'Verifying licence: doc=%s, session=%s',
            document_number,
            session_id[:8] if session_id else 'None',
        )
        try:
            impl = self._get_impl()
            result = await self._breaker.call_async(
                impl.verify_license,
                session_id=session_id,
                document_type=document_type,
                document_number=document_number,
                captcha_text=captcha_text,
            )
            if isinstance(result, dict) and result.get('error'):
                logger.warning('Licence verify failed: %s - %s', result.get('code'), result.get('message'))
            else:
                logger.debug('Licence verified successfully for doc %s', document_number)
            return result
        except CircuitBreakerOpenError as e:
            logger.warning('Circuit breaker prevented licence verify: %s', e)
            return {
                'error': True,
                'code': 'CIRCUIT_BREAKER_OPEN',
                'message': f'RUNT temporalmente no disponible. Intente en {e.retry_after:.0f} segundos.',
            }

    async def discard_session(self, session_id: str) -> None:
        logger.debug('Discarding RUNT document session: %s', session_id[:8] if session_id else '')
        impl = self._get_impl()
        try:
            await impl.discard_session(session_id)
        except Exception as e:
            logger.warning('Error discarding session: %s', e)

    async def refresh_captcha(self, session_id: str) -> str:
        logger.debug('Refreshing captcha: session=%s', session_id[:8] if session_id else 'None')
        impl = self._get_impl()
        try:
            # Not protected by breaker: this is a UI/session action.
            return await impl.refresh_captcha(session_id)
        except Exception as e:
            logger.warning('Error refreshing captcha: %s', e)
            raise

    async def captcha_b64_from_session(self, session_id: str) -> str:
        logger.debug('Extracting captcha from session: %s', session_id[:8] if session_id else 'None')
        impl = self._get_impl()
        try:
            return await impl.captcha_b64_from_session(session_id)
        except Exception as e:
            logger.warning('Error extracting captcha from session: %s', e)
            return ''
