import io
import json
import re
import os
import sys
import tempfile
import subprocess
import unicodedata
from typing import List, Tuple, Optional, Any

import cv2
import numpy as np
from PIL import Image

try:
    os.environ.setdefault('PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK', 'True')
    os.environ.setdefault('FLAGS_use_onednn', '0')
    os.environ.setdefault('FLAGS_use_mkldnn', '0')
    os.environ.setdefault('FLAGS_enable_new_executor', '0')
    os.environ.setdefault('FLAGS_enable_pir_api', '0')

    from paddleocr import PaddleOCR as _PaddleOCR
    PADDLE_AVAILABLE = True
    PADDLE_IMPORT_ERROR = ''
except Exception:
    _PaddleOCR = None  # type: ignore[assignment]
    PADDLE_AVAILABLE = False
    PADDLE_IMPORT_ERROR = 'paddleocr import failed'

try:
    if not PADDLE_AVAILABLE:
        import importlib
        import traceback
        try:
            importlib.import_module('paddleocr')
        except Exception as _exc:
            PADDLE_IMPORT_ERROR = f'paddleocr import failed: {_exc}'
except Exception:
    pass

_ocr_instance: Optional[Any] = None


def _get_ocr() -> Optional[Any]:
    global _ocr_instance
    if _ocr_instance is not None:
        return _ocr_instance
    if not PADDLE_AVAILABLE:
        return None
    try:
        import paddle
        try:
            paddle.set_flags({'FLAGS_use_onednn': False, 'FLAGS_use_mkldnn': False})
        except Exception:
            pass

        # PaddleOCR language availability changes between versions.
        # Try a small set of compatible configurations.
        for kwargs in (
            {'use_angle_cls': True, 'lang': 'es'},
            {'use_angle_cls': True, 'lang': 'latin'},
            {'use_angle_cls': True, 'lang': 'en'},
            {'use_angle_cls': False, 'lang': 'latin'},
            {'use_angle_cls': False, 'lang': 'en'},
        ):
            try:
                paddle_cls = _PaddleOCR
                if paddle_cls is None:
                    continue
                _ocr_instance = paddle_cls(**kwargs)  # type: ignore[operator]
                return _ocr_instance
            except Exception:
                continue

        return None
    except Exception:
        return None


class LicenseOCR:
    def __init__(self):
        self._ocr = None
        self._initialized = False
        self._init_attempts = 0
        self._last_init_error = ''

    def _ensure_ocr(self):
        # Retry initialization when OCR is unavailable (startup races may happen).
        if (not self._initialized) or (self._ocr is None and self._init_attempts < 3):
            self._ocr = _get_ocr()
            self._initialized = True
            self._init_attempts += 1
            if self._ocr is None:
                self._last_init_error = PADDLE_IMPORT_ERROR or 'paddleocr init returned None'

    def _preprocess(self, img_rgb: np.ndarray, scale: float = 2.0) -> np.ndarray:
        h, w = img_rgb.shape[:2]
        resized = cv2.resize(img_rgb, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)

        gray = cv2.cvtColor(resized, cv2.COLOR_RGB2GRAY)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(4, 4))
        enhanced = clahe.apply(gray)

        thr = cv2.adaptiveThreshold(
            enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 5
        )
        return cv2.cvtColor(thr, cv2.COLOR_GRAY2RGB)

    def _rotate(self, img_rgb: np.ndarray, angle: int) -> np.ndarray:
        if angle == 0:
            return img_rgb
        if angle == 90:
            return cv2.rotate(img_rgb, cv2.ROTATE_90_CLOCKWISE)
        if angle == 180:
            return cv2.rotate(img_rgb, cv2.ROTATE_180)
        if angle == 270:
            return cv2.rotate(img_rgb, cv2.ROTATE_90_COUNTERCLOCKWISE)
        return img_rgb

    def _parse_paddle_result(self, paddle_result) -> List[dict]:
        """Normalize PaddleOCR output to a list of {bbox, text, conf}."""
        items: List[dict] = []
        if not paddle_result:
            return items

        # PaddleOCR 3.x (paddlex pipeline) returns: [ {rec_texts, rec_scores, rec_polys, ...} ]
        if isinstance(paddle_result, list) and paddle_result and isinstance(paddle_result[0], dict):
            d = paddle_result[0]
            texts = d.get('rec_texts') or []
            scores = d.get('rec_scores') or []
            polys = d.get('rec_polys') or d.get('dt_polys') or []
            n = min(len(texts), len(scores), len(polys))
            for i in range(n):
                items.append({
                    'bbox': polys[i].tolist() if hasattr(polys[i], 'tolist') else polys[i],
                    'text': str(texts[i]) if texts[i] is not None else '',
                    'conf': float(scores[i]) if scores[i] is not None else 0.0,
                })
            return items

        # Older return format: [ [ [bbox, (text, conf)], ... ] ]
        lines = paddle_result[0] if isinstance(paddle_result, list) else paddle_result
        if not lines:
            return items
        for line in lines:
            if not line or len(line) < 2:
                continue
            bbox = line[0]
            payload = line[1]
            if isinstance(payload, (list, tuple)) and len(payload) >= 2:
                text, conf = payload[0], payload[1]
            else:
                # Some variants return only text; treat as low confidence.
                text, conf = payload, 0.0
            if text is None:
                continue
            items.append({
                'bbox': bbox,
                'text': str(text),
                'conf': float(conf) if conf is not None else 0.0,
            })
        return items

    def _norm_text(self, s: str) -> str:
        if not s:
            return ''
        s = unicodedata.normalize('NFKD', s)
        s = s.encode('ascii', 'ignore').decode('ascii', errors='ignore')
        return s.upper()

    def _bbox_center(self, bbox) -> Tuple[float, float]:
        xs = [p[0] for p in bbox]
        ys = [p[1] for p in bbox]
        return (sum(xs) / len(xs), sum(ys) / len(ys))

    def _find_anchor(self, items: List[dict], keywords: List[str]) -> dict:
        for it in items:
            t = self._norm_text(it['text'])
            if any(k in t for k in keywords):
                return it
        return {}

    def _find_below_same_column(self, items: List[dict], anchor: dict, max_dx: float = 120.0, max_dy: float = 400.0) -> List[dict]:
        if not anchor:
            return []
        ax, ay = self._bbox_center(anchor['bbox'])
        # Anchor bottom y
        anchor_y_bottom = max(p[1] for p in anchor['bbox'])
        candidates = []
        for it in items:
            if it is anchor:
                continue
            bx, by = self._bbox_center(it['bbox'])
            y_top = min(p[1] for p in it['bbox'])
            if y_top <= anchor_y_bottom:
                continue
            if abs(bx - ax) > max_dx:
                continue
            dy = y_top - anchor_y_bottom
            if dy > max_dy:
                continue
            candidates.append((dy, it))
        candidates.sort(key=lambda x: x[0])
        return [it for _, it in candidates]


    def _clean_plate(self, s: str) -> str:
        s = re.sub(r'[^A-Z0-9]', '', s.upper())
        if len(s) < 6:
            return ''
        # slide window to find a valid 6-char plate
        for i in range(0, len(s) - 5):
            c = s[i:i + 6]
            if re.match(r'^[A-Z]{3}\d{3}$', c) or re.match(r'^[A-Z]{3}\d{2}[A-Z]$', c):
                return c
        return ''

    def _clean_doc(self, s: str) -> str:
        s = re.sub(r'[^0-9]', '', s)
        if not (7 <= len(s) <= 10):
            return ''
        try:
            if int(s) >= 1500000000:
                return ''
        except Exception:
            return ''
        return s


    def parse(self, image_bytes) -> dict:
        self._ensure_ocr()
        if not self._ocr:
            if os.getenv('OCR_WORKER_MODE', '0') != '1':
                try:
                    return self._parse_in_subprocess(image_bytes)
                except Exception:
                    pass
            return {
                'error': 'PaddleOCR not available',
                'needsManualInput': True,
                'debug': self._last_init_error,
            }

        try:
            if isinstance(image_bytes, (bytes, bytearray)):
                image = Image.open(io.BytesIO(image_bytes))
            else:
                image = Image.open(image_bytes)
            if image.mode != 'RGB':
                image = image.convert('RGB')
            img_rgb = np.array(image)

            result = self._ocr.ocr(img_rgb)
            items = self._parse_paddle_result(result)
            extracted = self._extract_by_anchors(items)

            if extracted.get('needsManualInput'):
                for angle, scale in [(90, 2.0), (270, 2.0)]:
                    img = self._rotate(img_rgb, angle)
                    img = self._preprocess(img, scale)
                    retry_result = self._ocr.ocr(img)
                    retry_items = self._parse_paddle_result(retry_result)
                    items.extend(retry_items)
                extracted = self._extract_by_anchors(items)

            return extracted
        except Exception as e:
            return {'error': str(e), 'needsManualInput': True}

    def _extract_by_anchors(self, items: List[dict]) -> dict:
        plate = ''
        doc_number = ''
        doc_type = 'CC'

        # Claves y extracción robusta para la placa
        placa_anchor = self._find_anchor(items, [
            'PLACA'
        ])
        placa_below = self._find_below_same_column(items, placa_anchor, max_dx=100, max_dy=140)
        # Buscar sólo el bloque más inmediato debajo
        for it in placa_below[:1]:
            candidate_plate = self._clean_plate(it['text'])
            if candidate_plate:
                plate = candidate_plate
                break
        # Si no, buscar placa solo en todo el texto de los items
        if not plate:
            for it in items:
                candidate_plate = self._clean_plate(it['text'])
                if candidate_plate:
                    plate = candidate_plate
                    break

        # Claves robustas para documento
        doc_anchor = self._find_anchor(items, [
            'IDENTIFICACION', 'CEDULA', 'CC', 'DOCUMENTO', 'C.C'
        ])
        if doc_anchor and not doc_number:
            doc_number = self._clean_doc(doc_anchor.get('text', ''))
        # Buscar debajo en max 3 bloques, inmediato
        doc_below = self._find_below_same_column(items, doc_anchor, max_dx=120, max_dy=320)
        for it in doc_below[:3]:
            candidate_doc = self._clean_doc(it['text'])
            if candidate_doc:
                doc_number = candidate_doc
                break

        # Fallback global de placa
        if not plate:
            text_all = ''.join([self._norm_text(it['text']).replace(' ', '') for it in items])
            match = re.search(r'([A-Z]{3}\d{3}|[A-Z]{3}\d{2}[A-Z])', text_all)
            if match:
                plate = self._clean_plate(match.group(1))
        # Si no se encontró, buscar en esquina inferior derecha (truco para layouts que pones el doc ahí)
        if not doc_number and items:
            edge_candidates = []
            # Buscamos todos los bloques que tengan texto numérico tipo documento
            for it in items:
                cleaned = self._clean_doc(it['text'])
                if cleaned:
                    # Usamos la suma de X+Y del centro del bbox para calcular qué tan abajo a la derecha está
                    cx, cy = self._bbox_center(it['bbox'])
                    edge_candidates.append((cx + cy, cleaned))
            if edge_candidates:
                # Tomamos el más abajo/derecha
                edge_candidates.sort(reverse=True)
                doc_number = edge_candidates[0][1]

        # Fallback global de documento
        if not doc_number:
            text_all = ' '.join([self._norm_text(it['text']) for it in items])
            nums = re.findall(r'\d{7,10}', text_all.replace(' ', ''))
            for n in nums:
                candidate_doc = self._clean_doc(n)
                if candidate_doc:
                    doc_number = candidate_doc
                    break


        if not doc_number:
            text_all = ' '.join([self._norm_text(it['text']) for it in items])
            nums = re.findall(r'\d{7,10}', text_all.replace(' ', ''))
            for n in nums:
                doc_number = self._clean_doc(n)
                if doc_number:
                    break

        warnings = []
        if not plate:
            warnings.append('PLATE_NOT_FOUND')
        if not doc_number:
            warnings.append('DOCUMENT_NOT_FOUND')

        return {
            'plate': plate,
            'ownerDocumentType': doc_type,
            'ownerDocumentNumber': doc_number,
            'confidence': {
                'plate': 0.9 if plate else 0.0,
                'documentNumber': 0.85 if doc_number else 0.0,
                'documentType': 0.7,
            },
            'candidates': {
                'plate': [plate] if plate else [],
                'documentNumber': [doc_number] if doc_number else [],
            },
            'warnings': warnings,
            'needsManualInput': len(warnings) > 0,
            'rawText': ' '.join([it['text'] for it in items])[:500],
            'detectionCount': len(items),
        }

    def _parse_in_subprocess(self, image_bytes) -> dict:
        if not isinstance(image_bytes, (bytes, bytearray)):
            raise RuntimeError('image_bytes must be bytes for subprocess OCR')

        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        with tempfile.NamedTemporaryFile(delete=False, suffix='.bin') as tmp:
            tmp.write(bytes(image_bytes))
            tmp_path = tmp.name

        try:
            env = dict(os.environ)
            env['OCR_WORKER_MODE'] = '1'
            proc = subprocess.run(
                [
                    sys.executable,
                    '-m',
                    'src.scripts.license_ocr_worker',
                    tmp_path,
                ],
                cwd=repo_root,
                env=env,
                capture_output=True,
                text=True,
                timeout=120,
            )
            if proc.returncode != 0:
                raise RuntimeError(proc.stderr.strip() or proc.stdout.strip() or 'worker failed')
            return json.loads(proc.stdout)
        finally:
            try:
                os.remove(tmp_path)
            except Exception:
                pass
