from __future__ import annotations

from typing import Any, Dict, Union

from src.domain.ports.license_ocr_port import LicenseOcrPort


class ParseLicenseUseCase:
    def __init__(self, ocr: LicenseOcrPort):
        self._ocr = ocr

    def execute(self, image: Union[bytes, bytearray, str]) -> Dict[str, Any]:
        return self._ocr.parse(image)
