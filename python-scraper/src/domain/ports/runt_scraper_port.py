from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class RuntScraperPort(ABC):
    @abstractmethod
    async def create_session(self) -> Dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    async def verify_vehicle(
        self,
        session_id: str,
        plate: str,
        document_type: str,
        document_number: str,
        captcha_text: str,
    ) -> Dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    async def discard_session(self, session_id: str) -> None:
        raise NotImplementedError

    @abstractmethod
    async def captcha_b64_from_session(self, session_id: str) -> Optional[str]:
        raise NotImplementedError
