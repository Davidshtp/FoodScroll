from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict


class RuntLicenseScraperPort(ABC):
    @abstractmethod
    async def create_session(self) -> Dict[str, Any]:
        """Crea una sesión RUNT en la sección de documento."""
        raise NotImplementedError

    @abstractmethod
    async def verify_license(
        self,
        session_id: str,
        document_type: str,
        document_number: str,
        captcha_text: str,
    ) -> Dict[str, Any]:
        """Verifica una licencia de conducción."""
        raise NotImplementedError

    @abstractmethod
    async def discard_session(self, session_id: str) -> None:
        """Descarta una sesión RUNT."""
        raise NotImplementedError

    @abstractmethod
    async def refresh_captcha(self, session_id: str) -> str:
        """Obtiene un nuevo captcha para la sesión existente.

        Devuelve base64 puro (sin prefijo data:image/...;base64,).
        """
        raise NotImplementedError

    @abstractmethod
    async def captcha_b64_from_session(self, session_id: str) -> str:
        """Extrae el captcha actual de una sesión existente.
        Réplica exacta de la extracción de create_session.

        Devuelve base64 puro (sin prefijo). Vacío si falla.
        """
        raise NotImplementedError
