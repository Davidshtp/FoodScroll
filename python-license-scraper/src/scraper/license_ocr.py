from __future__ import annotations

import os
import re
from typing import Any, Dict, List, Tuple, Union

import cv2
import numpy as np

# Debe setearse antes de importar paddleocr para que aplique.
os.environ.setdefault('PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK', 'True')

PADDLE_IMPORT_ERROR = None
try:
    from paddleocr import PaddleOCR
    HAS_PADDLE = True
except Exception as _exc:
    PaddleOCR = None  # type: ignore[assignment]
    HAS_PADDLE = False
    PADDLE_IMPORT_ERROR = _exc

from src.infrastructure.logging import get_logger

logger = get_logger(__name__)

_ocr_instance = None


def get_ocr():
    global _ocr_instance
    if _ocr_instance is None:
        if not HAS_PADDLE or PaddleOCR is None:
            if PADDLE_IMPORT_ERROR is not None:
                logger.warning('PaddleOCR import failed: %s', PADDLE_IMPORT_ERROR)
            else:
                logger.warning('PaddleOCR check failed: HAS_PADDLE=%s, PaddleOCR is None=%s', HAS_PADDLE, PaddleOCR is None)
            raise RuntimeError('PaddleOCR no está disponible en este entorno')
        logger.info('Initializing PaddleOCR (lang=es)...')
        _ocr_instance = PaddleOCR(lang='es')
        logger.info('PaddleOCR initialized OK')
    return _ocr_instance


class LicenseOCR:
    DOC_TYPE_PATTERNS = {
        'CC': r'\bCC\b|\bC\.?C\.?\b|cedula|cedulación|identificación',
        'CE': r'\bCE\b|cédula\s*de\s*extranjería|extranjeria',
        'TI': r'\bti\b|tarjeta\s*de\s*identidad',
        'RC': r'\brc\b|registro\s*civil',
        'NIT': r'\bnit\b',
        'PAS': r'\bpas\b|pasaporte',
    }

    DOCUMENT_NUMBER_PATTERN = r'\b\d{6,12}\b'

    def __init__(self):
        self._ocr = None

    def parse(self, image: Union[bytes, bytearray, str]) -> Dict[str, Any]:
        if self._ocr is None:
            try:
                self._ocr = get_ocr()
            except Exception as exc:
                logger.warning('PaddleOCR not available: %s', exc)
                return {
                    'ownerDocumentType': 'CC',
                    'ownerDocumentNumber': '',
                    'confidence': {'documentNumber': 0.0},
                    'warnings': ['PaddleOCR no está disponible en este entorno'],
                }
        if isinstance(image, str):
            image = image.encode()

        if isinstance(image, (bytes, bytearray)):
            nparr = np.frombuffer(bytes(image), np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        else:
            img = image

        if img is None:
            return {
                'ownerDocumentType': 'CC',
                'ownerDocumentNumber': '',
                'confidence': {'documentNumber': 0.0},
                'warnings': ['No se pudo decodificar la imagen'],
            }

        if img is None:
            return {
                'ownerDocumentType': 'CC',
                'ownerDocumentNumber': '',
                'confidence': {'documentNumber': 0.0},
                'warnings': ['No se pudo decodificar la imagen'],
            }

        try:
            result = self._ocr.ocr(img)
        except Exception as e:
            logger.warning('PaddleOCR failed: %s', e)
            return {
                'ownerDocumentType': 'CC',
                'ownerDocumentNumber': '',
                'confidence': {'documentNumber': 0.0},
                'warnings': [f'OCR error: {str(e)}'],
            }

        text_items = self._normalize_ocr_result(result)
        if not text_items:
            return {
                'ownerDocumentType': 'CC',
                'ownerDocumentNumber': '',
                'confidence': {'documentNumber': 0.0},
                'warnings': ['No se detectó texto en la imagen'],
            }

        full_text = ' '.join(t for t, _ in text_items).upper()

        doc_type = self._extract_document_type(full_text)
        doc_number, number_conf = self._extract_document_number(text_items)

        warnings = []
        if not doc_number:
            warnings.append('No se encontró número de documento')

        return {
            'ownerDocumentType': doc_type,
            'ownerDocumentNumber': doc_number,
            'confidence': {'documentNumber': round(number_conf, 4)},
            'warnings': warnings,
            'rawText': full_text,
        }

    def _normalize_ocr_result(self, result: Any) -> List[Tuple[str, float]]:
        """Convierte el output de PaddleOCR (2.x o 3.x) a [(text, score), ...]."""

        items: List[Tuple[str, float]] = []
        if not result:
            return items

        # PaddleOCR 3.x: list[dict] con keys `rec_texts` y `rec_scores`
        if isinstance(result, list) and result and isinstance(result[0], dict):
            for page in result:
                texts = page.get('rec_texts') or []
                scores = page.get('rec_scores') or []
                for i, t in enumerate(texts):
                    if not t:
                        continue
                    try:
                        s = float(scores[i]) if i < len(scores) else 0.0
                    except Exception:
                        s = 0.0
                    items.append((str(t), s))
            return items

        # PaddleOCR 2.x: list[list[ [box, (text, score)], ... ]]
        if isinstance(result, list) and result and isinstance(result[0], list):
            for line in result[0]:
                try:
                    text = line[1][0]
                    score = float(line[1][1])
                except Exception:
                    continue
                if text:
                    items.append((str(text), score))
            return items

        return items

    def _extract_document_type(self, text: str) -> str:
        text = text.upper()
        for doc_type, pattern in self.DOC_TYPE_PATTERNS.items():
            if re.search(pattern, text, re.IGNORECASE):
                return doc_type
        return 'CC'

    def _extract_document_number(self, text_items: List[Tuple[str, float]]):
        # Palabras clave asociadas al número de documento
        keywords = [
            'CEDULA', 'CÉDULA', 'DOCUMENTO', 'CC', 'No', 'NÚMERO', 'IDENTIDAD', 'CIUDADAN', 'NUMERO'
        ]
        context_candidates = []
        backup_candidates = []

        def clean_ocr_digit(s: str) -> str:
            """
            Corrige errores comunes en OCR para dígitos.
            Solo aplica cuando estamos seguros que es documento, NO a todo.
            """
            # 1 puede ser confundido con I/l/|
            s = s.replace('I', '1').replace('l', '1').replace('|', '1')
            # 0 puede ser confundido con O, o con D en algunos OCR
            s = re.sub(r'[OQD]', '0', s)
            s = s.replace('B', '8')  # B puede ser 8
            return s

        # Buscamos primero el índice (posición) en el array de texto de una palabra clave
        for idx, (text, conf) in enumerate(text_items):
            s_up = str(text).upper()
            # Ejemplo: texto: "CÉDULA DE CIUDADANÍA", siguiente linea: "123456789"
            if any(kw in s_up for kw in keywords):
                # Buscar en las siguientes líneas/cajas, el primer match numérico razonable
                for look_ahead in range(1, 3):
                    if idx + look_ahead < len(text_items):
                        neigh, neigh_conf = text_items[idx + look_ahead]
                        neigh_txt = clean_ocr_digit(str(neigh))
                        # regex: 6 a 12 digitos
                        match = re.search(r'\d{6,12}', neigh_txt)
                        if match:
                            context_candidates.append((match.group(0), float(neigh_conf)))
                        else:
                            # Por si OCR mete ruido (ej: 3 4 0 1 2 9 7)
                            digits = re.sub(r'[^\d]', '', neigh_txt)
                            if 6 <= len(digits) <= 12:
                                context_candidates.append((digits, float(neigh_conf)))
        
        # Si se halló match contextual, devolver el de mayor score/longitud
        if context_candidates:
            context_candidates.sort(key=lambda x: (x[1], len(x[0])), reverse=True)
            return context_candidates[0][0], float(context_candidates[0][1])

        # Si el contexto falló, fallback al método antiguo pero corrigiendo OCR
        for text, conf in text_items:
            s = clean_ocr_digit(str(text))
            for m in re.finditer(self.DOCUMENT_NUMBER_PATTERN, s):
                backup_candidates.append((m.group(0), float(conf)))
            s_clean = re.sub(r'[^\d]', '', s)
            if 6 <= len(s_clean) <= 12:
                backup_candidates.append((s_clean, float(conf)))

        if backup_candidates:
            backup_candidates.sort(key=lambda x: (x[1], len(x[0])), reverse=True)
            return backup_candidates[0][0], float(backup_candidates[0][1])

        return '', 0.0

