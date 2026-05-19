from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Dict, Optional, Tuple

from src.infrastructure.logging import get_logger
from src.scraper.captcha_char_model import CaptchaCharPredictor, default_char_model_dir

logger = get_logger(__name__)


_EARLY_EXIT_CONFIDENCE = 0.95


class CaptchaSolver:
    """Resuelve el CAPTCHA de RUNT usando el modelo entrenado."""

    def __init__(self, model_dir: Optional[Path] = None):
        model_dir = model_dir or default_char_model_dir()
        self._char_predictor = CaptchaCharPredictor.load(model_dir)
        if self._char_predictor is not None:
            logger.info('CaptchaSolver: trained char model enabled')
        else:
            logger.warning('CaptchaSolver: trained char model not available')
            raise RuntimeError('No hay OCR disponible para CAPTCHA')

    def is_ready(self) -> bool:
        """Indica si al menos un solver está disponible."""
        return self._char_predictor is not None

    def solvers_status(self) -> Dict[str, bool]:
        """Estado detallado de cada solver."""
        return {
            'charPredictor': self._char_predictor is not None,
            'paddleOcr': False,
        }

    def solve_with_confidence(self, image_bytes: bytes) -> Tuple[str, float]:
        _t0 = time.perf_counter()
        variants_tried: int = 0

        if self._char_predictor is None:
            logger.warning('Captcha solved: solver=none time_ms=0 variants=0 text_empty=true')
            return '', 0.0

        variants_tried += 1
        text, conf = self._char_predictor.predict(image_bytes)
        elapsed = (time.perf_counter() - _t0) * 1000
        if text:
            early_exit = conf >= _EARLY_EXIT_CONFIDENCE
            logger.info('Captcha solved: solver=char_predictor time_ms=%.0f conf=%.4f variants=%d early_exit=%s', elapsed, conf, variants_tried, str(early_exit).lower())
        else:
            logger.warning('Captcha solved: solver=none time_ms=%.0f variants=%d text_empty=true', elapsed, variants_tried)
        return text, conf
