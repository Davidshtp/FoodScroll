from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict


class LicenseOcrPort(ABC):
    @abstractmethod
    def parse(self, image: Any) -> Dict[str, Any]:
        """Extract plate and owner document from a transit license image."""
        raise NotImplementedError
