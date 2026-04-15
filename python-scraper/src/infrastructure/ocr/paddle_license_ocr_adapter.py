from __future__ import annotations

from src.domain.ports.license_ocr_port import LicenseOcrPort
from src.scraper.license_ocr import LicenseOCR


class PaddleLicenseOcrAdapter(LicenseOcrPort):
    def __init__(self):
        self._impl = LicenseOCR()

    def parse(self, image):
        return self._impl.parse(image)
