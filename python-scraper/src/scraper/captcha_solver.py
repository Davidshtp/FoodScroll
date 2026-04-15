import io
import os
import re
from typing import Optional, Tuple, Any, List

import numpy as np

from src.infrastructure.logging import get_logger
from src.scraper.captcha_char_model import CaptchaCharPredictor, default_char_model_dir
from src.scraper.captcha_model import CaptchaSeqPredictor, default_model_dir

logger = get_logger(__name__)

try:
    from PIL import Image, ImageEnhance
    HAS_PIL = True
except ImportError:
    Image = None  # type: ignore[assignment]
    ImageEnhance = None  # type: ignore[assignment]
    HAS_PIL = False

try:
    # Keep Paddle fallback opt-in to avoid OCR runtime conflicts.
    _use_paddle_fallback = (os.getenv('ENABLE_CAPTCHA_PADDLE_FALLBACK', 'false') or '').strip().lower() in (
        '1',
        'true',
        'yes',
        'on',
    )
    if _use_paddle_fallback:
        os.environ.setdefault('PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK', 'True')
        os.environ.setdefault('FLAGS_use_onednn', '0')
        os.environ.setdefault('FLAGS_use_mkldnn', '0')
        os.environ.setdefault('FLAGS_enable_new_executor', '0')
        os.environ.setdefault('FLAGS_enable_pir_api', '0')
        from paddleocr import PaddleOCR as _PaddleOCR  # type: ignore
        HAS_PADDLE = True
    else:
        _PaddleOCR = None  # type: ignore[assignment]
        HAS_PADDLE = False
except Exception:
    _PaddleOCR = None  # type: ignore[assignment]
    HAS_PADDLE = False

try:
    import pytesseract
    HAS_TESSERACT = True
except ImportError:
    pytesseract = None  # type: ignore[assignment]
    HAS_TESSERACT = False

class CaptchaSolver:
    """Resuelve el CAPTCHA de RUNT usando OCR + preprocesamiento"""
    
    def __init__(self):
        self.config = '--oem 1 --psm 8 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        self._paddle: Optional[Any] = None
        self._char_model: Optional[CaptchaCharPredictor] = CaptchaCharPredictor.load(default_char_model_dir())
        self._seq_model: Optional[CaptchaSeqPredictor] = CaptchaSeqPredictor.load(default_model_dir())
        
        if self._char_model:
            logger.info("CaptchaChar model loaded (accuracy: ~89%)")
        if self._seq_model:
            logger.info("CaptchaSeq model loaded")
        if HAS_PADDLE and _PaddleOCR is not None:
            try:
                paddle_cls = _PaddleOCR
                self._paddle = paddle_cls(lang='en')
                logger.info("PaddleOCR fallback enabled for captcha")
            except Exception:
                self._paddle = None
        if HAS_TESSERACT:
            logger.info("Tesseract OCR available")
    
    def solve(self, image_bytes: bytes) -> str:
        text, _confidence = self.solve_with_confidence(image_bytes)
        return text

    def solve_with_confidence(self, image_bytes: bytes) -> Tuple[str, float]:
        """Resuelve un CAPTCHA desde bytes de imagen"""
        if not HAS_PIL:
            raise Exception("Requiere Pillow. Instala: pip install Pillow")
        if Image is None:
            raise Exception("Pillow no disponible")
        
        try:
            image = Image.open(io.BytesIO(image_bytes))  # type: ignore[union-attr]
            variants = self._preprocess_variants(image)

            best_text = ''
            best_conf = 0.0

            # 0a) Fast character-segmentation model (preferred when available).
            if self._char_model is not None:
                char_text, char_conf = self._char_model.predict(image_bytes)
                char_text = self._clean_case_sensitive(char_text)
                if char_text:
                    best_text = char_text
                    best_conf = char_conf

            # 0b) Sequence model fallback.
            if self._seq_model is not None and not best_text:
                model_text, model_conf = self._seq_model.predict(image_bytes)
                if model_text:
                    best_text = model_text
                    best_conf = model_conf

            # 1) Prefer PaddleOCR if available.
            if self._paddle is not None and not best_text:
                for processed in variants:
                    text, conf = self._solve_with_paddle(processed)
                    if conf > best_conf:
                        best_text = text
                        best_conf = conf

            # 2) Fallback: Tesseract if installed.
            if HAS_TESSERACT and not best_text:
                tess = pytesseract
                for processed in variants:
                    if tess is None:
                        break
                    try:
                        text = tess.image_to_string(processed, config=self.config)  # type: ignore[union-attr]
                    except Exception:
                        continue
                    text = self._clean_case_sensitive(text)
                    conf = 0.35 if text else 0.0
                    if conf > best_conf:
                        best_text = text
                        best_conf = conf

            if best_text:
                logger.debug("Captcha solved: method=char_model, text=%s, conf=%.4f", best_text, best_conf)
                return best_text, best_conf

            if self._paddle is None and not HAS_TESSERACT:
                raise Exception("No hay OCR disponible para CAPTCHA (PaddleOCR/Tesseract)")

            logger.warning("Captcha not solved, no method available")
            return '', 0.0
        except Exception as e:
            logger.error("Error resolving captcha: %s", e)
            raise Exception(f"Error resolviendo CAPTCHA: {str(e)}")
    
    def _preprocess_variants(self, image) -> List[Any]:
        """Generate multiple preprocessing variants for robust OCR."""
        if ImageEnhance is None:
            return [image]
        gray = image.convert('L')
        w, h = gray.size
        up = gray.resize((w * 2, h * 2))

        variants: List[Any] = []

        enhancer = ImageEnhance.Contrast(up)  # type: ignore[union-attr]
        c1 = enhancer.enhance(1.8)
        c2 = enhancer.enhance(2.3)

        variants.append(c1)
        variants.append(c2)
        variants.append(self._threshold_variant(c1, 128))
        variants.append(self._threshold_variant(c2, 145))

        return variants

    def _threshold_variant(self, image, threshold: int):
        if Image is None:
            return image
        arr = np.array(image.convert('L'))
        bw = np.where(arr < threshold, 0, 255).astype(np.uint8)
        return Image.fromarray(bw)  # type: ignore[union-attr]

    def _clean_case_sensitive(self, text: str) -> str:
        cleaned = re.sub(r'[^A-Za-z0-9]', '', (text or '').strip())
        if not (4 <= len(cleaned) <= 7):
            return ''
        return cleaned

    def _solve_with_paddle(self, processed_image) -> Tuple[str, float]:
        # processed_image is a PIL image in mode '1'
        paddle = self._paddle
        if paddle is None:
            return '', 0.0
        img = processed_image.convert('L')
        arr = np.array(img)
        # PaddleOCR expects 3-channel sometimes; convert to RGB.
        arr_rgb = np.stack([arr, arr, arr], axis=-1)

        result = paddle.ocr(arr_rgb)
        text, conf = self._best_text_from_paddle(result)
        text = self._clean_case_sensitive(text)

        # Typical captcha length; allow 4-7 to avoid dropping valid ones.
        if not text:
            return '', 0.0
        return text, conf

    def _best_text_from_paddle(self, paddle_result) -> Tuple[str, float]:
        if not paddle_result:
            return '', 0.0
        # PaddleOCR 3.x dict format
        if isinstance(paddle_result, list) and paddle_result and isinstance(paddle_result[0], dict):
            d = paddle_result[0]
            texts = d.get('rec_texts') or []
            scores = d.get('rec_scores') or []
            best = ('', 0.0)
            for t, s in zip(texts, scores):
                try:
                    sc = float(s)
                except Exception:
                    sc = 0.0
                if sc > best[1]:
                    best = (str(t or ''), sc)
            return best

        # Older list-of-lines format
        lines = paddle_result[0] if isinstance(paddle_result, list) else paddle_result
        best_text = ''
        best_conf = 0.0
        for line in (lines or []):
            if not line or len(line) < 2:
                continue
            payload = line[1]
            if isinstance(payload, (list, tuple)) and len(payload) >= 2:
                t, c = payload[0], payload[1]
            else:
                t, c = payload, 0.0
            try:
                cf = float(c)
            except Exception:
                cf = 0.0
            if cf > best_conf:
                best_text = str(t or '')
                best_conf = cf
        return best_text, best_conf
    
    def is_available(self) -> bool:
        return HAS_PIL and (self._paddle is not None or HAS_TESSERACT)
