from __future__ import annotations

import asyncio
import base64
import time
from typing import Any, Dict, List, Tuple

from src.infrastructure.logging import get_logger
from src.application.usecases.create_runt_session_usecase import CreateRuntSessionUseCase
from src.application.usecases.parse_license_usecase import ParseLicenseUseCase
from src.application.usecases.verify_vehicle_usecase import VerifyVehicleUseCase
from src.scraper.captcha_solver import CaptchaSolver

logger = get_logger(__name__)


class VerifyFullAutoUseCase:
    def __init__(
        self,
        parse_license_uc: ParseLicenseUseCase,
        create_runt_session_uc: CreateRuntSessionUseCase,
        verify_vehicle_uc: VerifyVehicleUseCase,
        captcha_solver: CaptchaSolver,
        discard_session_uc=None,
    ):
        self._parse_license_uc = parse_license_uc
        self._create_runt_session_uc = create_runt_session_uc
        self._verify_vehicle_uc = verify_vehicle_uc
        self._captcha_solver = captcha_solver
        self._discard_session_uc = discard_session_uc

    async def _discard_session(self, session_id: str) -> None:
        if self._discard_session_uc and session_id:
            try:
                await self._discard_session_uc.execute(session_id)
            except Exception as exc:
                logger.warning('Session discard failed: %s', exc)

    def _mask_session_id(self, session_id: str) -> str:
        sid = (session_id or '').strip()
        if not sid:
            return ''
        if len(sid) <= 8:
            return '***'
        return f'{sid[:4]}***{sid[-4:]}'

    def _is_captcha_error(self, result: Dict[str, Any]) -> bool:
        code = str(result.get('code', '') or '').lower()
        msg = str(result.get('message', '') or '').lower()
        if code in {'runt_captcha_invalid'}:
            return True
        if code == 'runt_auth_error' and 'captcha' in msg:
            return True
        if 'captcha' in msg and any(k in msg for k in ('invalid', 'invalido', 'incorrect', 'incorrecto', 'erroneo')):
            return True
        return False

    def _has_low_confidence(self, ocr: Dict[str, Any]) -> bool:
        plate_conf = float(ocr.get('confidence', {}).get('plate', 0) or 0)
        doc_conf = float(ocr.get('confidence', {}).get('documentNumber', 0) or 0)
        return plate_conf < 0.7 or doc_conf < 0.7

    async def execute(
        self,
        image_bytes: bytes,
        max_attempts: int = 5,
        retry_delay_ms: int = 800,
        debug: bool = False,
        plate_override: str = '',
        document_type_override: str = '',
        document_number_override: str = '',
    ) -> Tuple[Dict[str, Any], int]:
        has_overrides = bool(plate_override and document_type_override and document_number_override)

        if has_overrides:
            ocr = {
                'plate': plate_override.strip().upper(),
                'ownerDocumentType': document_type_override.strip().upper(),
                'ownerDocumentNumber': document_number_override.strip(),
            }
        else:
            ocr = self._parse_license_uc.execute(image_bytes)

        plate = (plate_override or ocr.get('plate') or '').strip().upper()
        document_type = (document_type_override or ocr.get('ownerDocumentType') or 'CC').strip().upper()
        document_number = (document_number_override or ocr.get('ownerDocumentNumber') or '').strip()

        logger.info("Starting full-auto verify, plate=%s, attempts=%d", plate or 'unknown', max_attempts)

        if has_overrides:
            ocr = {
                **ocr,
                'overrideUsed': True,
                'plate': plate,
                'ownerDocumentType': document_type,
                'ownerDocumentNumber': document_number,
            }

        if not plate or not document_number:
            return (
                {
                    'error': True,
                    'code': 'OCR_FAILED',
                    'message': 'No se pudo extraer placa/documento de la imagen',
                    'ocr': ocr,
                    'needsManualInput': True,
                    'manualStep': 'license_data',
                    'prefill': {
                        'plate': plate,
                        'documentType': document_type,
                        'documentNumber': document_number,
                    },
                },
                422,
            )

        if self._has_low_confidence(ocr) and not (plate_override or document_type_override or document_number_override):
            logger.warning("OCR low confidence for plate=%s, doc=%s", plate, document_number)
            return (
                {
                    'error': True,
                    'code': 'OCR_LOW_CONFIDENCE',
                    'message': 'OCR con baja confianza, ingrese datos manualmente',
                    'ocr': ocr,
                    'needsManualInput': True,
                    'manualStep': 'license_data',
                    'prefill': {
                        'plate': plate,
                        'documentType': document_type,
                        'documentNumber': document_number,
                    },
                },
                422,
            )

        attempt_traces: List[Dict[str, Any]] = []
        failed_attempts = 0
        last_error: Dict[str, Any] | None = None
        last_captcha_b64: str = ''
        last_session_id: str = ''
        session_id: str = ''
        captcha_b64: str = ''

        for attempt in range(1, max_attempts + 1):
            trace: Dict[str, Any] = {'attempt': attempt}

            if not session_id:
                # Solo crear sesión si no hay una activa (reutilizable en retry captcha)
                try:
                    session_result = await self._create_runt_session_uc.execute()
                except Exception as exc:
                    failed_attempts += 1
                    logger.warning("Attempt %d: session creation failed: %s", attempt, exc)
                    last_error = {
                        'error': True,
                        'code': 'RUNT_SESSION_ERROR',
                        'message': f'Error creando sesion: {str(exc)}',
                    }
                    trace['error'] = 'session_creation_failed'
                    if debug:
                        attempt_traces.append(trace)
                    if attempt < max_attempts:
                        await asyncio.sleep(max(retry_delay_ms, 0) / 1000)
                    continue

                session_id = (session_result.get('sessionId') or '').strip()
                captcha_b64 = (session_result.get('captchaPngBase64') or '').strip()
                last_captcha_b64 = captcha_b64
                last_session_id = session_id
                trace['sessionIdMasked'] = self._mask_session_id(session_id)

                if not session_id or not captcha_b64:
                    failed_attempts += 1
                    last_error = {
                        'error': True,
                        'code': 'RUNT_SESSION_ERROR',
                        'message': 'Sesion RUNT no retorno captcha valido',
                    }
                    trace['error'] = 'empty_session_or_captcha'
                    if debug:
                        attempt_traces.append(trace)
                    if session_id:
                        await self._discard_session(session_id)
                        session_id = ''
                    if attempt < max_attempts:
                        await asyncio.sleep(max(retry_delay_ms, 0) / 1000)
                    continue
            else:
                trace['sessionIdMasked'] = self._mask_session_id(session_id)

            try:
                captcha_png = base64.b64decode(captcha_b64)
                captcha_text, captcha_conf = self._captcha_solver.solve_with_confidence(captcha_png)
            except Exception as exc:
                failed_attempts += 1
                logger.warning("Attempt %d: captcha solving failed: %s", attempt, exc)
                last_error = {
                    'error': True,
                    'code': 'CAPTCHA_OCR_ERROR',
                    'message': f'Error resolviendo captcha: {str(exc)}',
                }
                trace['error'] = 'captcha_ocr_failed'
                if debug:
                    attempt_traces.append(trace)
                if session_id:
                    await self._discard_session(session_id)
                    session_id = ''
                if attempt < max_attempts:
                    await asyncio.sleep(max(retry_delay_ms, 0) / 1000)
                continue

            trace['captchaConfidence'] = round(float(captcha_conf), 4)
            trace['captchaLength'] = len(captcha_text or '')

            if not captcha_text:
                failed_attempts += 1
                last_error = {
                    'error': True,
                    'code': 'CAPTCHA_OCR_EMPTY',
                    'message': 'OCR no pudo extraer texto de captcha',
                }
                trace['error'] = 'captcha_text_empty'
                if debug:
                    attempt_traces.append(trace)
                if session_id:
                    await self._discard_session(session_id)
                    session_id = ''
                if attempt < max_attempts:
                    await asyncio.sleep(max(retry_delay_ms, 0) / 1000)
                continue

            verify_result = await self._verify_vehicle_uc.execute(
                session_id=session_id,
                plate=plate,
                document_type=document_type,
                document_number=document_number,
                captcha_text=captcha_text,
            )

            if isinstance(verify_result, dict) and verify_result.get('error'):
                last_error = verify_result
                trace['verifyCode'] = verify_result.get('code')
                if self._is_captcha_error(verify_result):
                    failed_attempts += 1
                    trace['error'] = 'captcha_invalid'
                    if debug:
                        attempt_traces.append(trace)
                    # Refrescar el captcha de la misma sesión (sin crear página nueva)
                    refresh_start = time.perf_counter()
                    try:
                        new_captcha_b64 = await self._verify_vehicle_uc.captcha_b64_from_session(session_id)
                        if new_captcha_b64:
                            captcha_b64 = new_captcha_b64
                            last_captcha_b64 = new_captcha_b64
                            logger.debug('Attempt %d: captcha refreshed for session %s', attempt, self._mask_session_id(session_id))
                        else:
                            logger.warning('Attempt %d: refresh captcha returned empty', attempt)
                    except Exception as exc:
                        logger.warning('Attempt %d: refresh captcha failed: %s', attempt, exc)
                        new_captcha_b64 = ''
                    if debug:
                        trace['refreshCaptchaMs'] = round((time.perf_counter() - refresh_start) * 1000, 2)
                    if not new_captcha_b64:
                        # No se pudo obtener captcha fresco → descartar sesión y continuar con nueva
                        if session_id:
                            await self._discard_session(session_id)
                            session_id = ''
                        if attempt < max_attempts:
                            await asyncio.sleep(max(retry_delay_ms, 0) / 1000)
                        continue
                    if attempt < max_attempts:
                        await asyncio.sleep(max(retry_delay_ms, 0) / 1000)
                    continue

                if session_id:
                    await self._discard_session(session_id)
                    session_id = ''
                if debug:
                    attempt_traces.append(trace)
                return (
                    {
                        'error': True,
                        'code': verify_result.get('code', 'RUNT_VERIFY_ERROR'),
                        'message': verify_result.get('message', 'Error en verificacion RUNT'),
                        'ocr': ocr,
                        'attemptsUsed': attempt,
                        'captcha': {
                            'solvedAutomatically': True,
                            'confidence': round(float(captcha_conf), 4),
                            'failedAttempts': failed_attempts,
                        },
                        'verification': verify_result,
                        **({'trace': attempt_traces + [trace]} if debug else {}),
                    },
                    422,
                )

            if session_id:
                await self._discard_session(session_id)
                session_id = ''
            if debug:
                trace['result'] = 'success'
                attempt_traces.append(trace)

            logger.info("Verify successful: plate=%s, attempts=%d", plate, attempt)
            return (
                {
                    'ocr': ocr,
                    'verification': verify_result,
                    'attemptsUsed': attempt,
                    'captcha': {
                        'solvedAutomatically': True,
                        'confidence': round(float(captcha_conf), 4),
                        'failedAttempts': failed_attempts,
                    },
                    'warnings': ocr.get('warnings', []),
                    **({'trace': attempt_traces} if debug else {}),
                },
                200,
            )

        if session_id:
            await self._discard_session(session_id)
            session_id = ''

        logger.warning("Verify exhausted retries: plate=%s, attempts=%d", plate, max_attempts)

        try:
            rescue_session = await self._create_runt_session_uc.execute()
            rescue_session_id = (rescue_session.get('sessionId') or '').strip()
            rescue_captcha_b64 = (rescue_session.get('captchaPngBase64') or '').strip()
        except Exception as exc:
            logger.warning("Rescue session creation failed: %s", exc)
            rescue_session_id = last_session_id
            rescue_captcha_b64 = last_captcha_b64

        return (
            {
                'error': True,
                'code': 'CAPTCHA_RETRIES_EXHAUSTED',
                'message': f'No se pudo resolver captcha tras {max_attempts} intentos. Ingreselo manualmente.',
                'ocr': ocr,
                'attemptsUsed': max_attempts,
                'needsManualInput': True,
                'manualStep': 'captcha',
                'prefill': {
                    'plate': plate,
                    'documentType': document_type,
                    'documentNumber': document_number,
                },
                'sessionId': rescue_session_id,
                'captchaPngBase64': rescue_captcha_b64,
                'lastError': last_error,
                **({'trace': attempt_traces} if debug else {}),
            },
            422,
        )
