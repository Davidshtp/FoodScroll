from __future__ import annotations

import asyncio
import base64
import os
import time
from typing import Any, Dict, List, Tuple

from src.infrastructure.logging import get_logger
from src.application.usecases.create_runt_license_session_usecase import CreateRuntLicenseSessionUseCase
from src.application.usecases.parse_license_usecase import ParseLicenseUseCase
from src.application.usecases.verify_license_usecase import VerifyLicenseUseCase
from src.application.usecases.discard_runt_session_usecase import DiscardRuntSessionUseCase
from src.scraper.captcha_solver import CaptchaSolver

logger = get_logger(__name__)

class VerifyFullAutoLicenseUseCase:
    def __init__(
        self,
        parse_license_uc: ParseLicenseUseCase,
        create_runt_session_uc: CreateRuntLicenseSessionUseCase,
        verify_license_uc: VerifyLicenseUseCase,
        captcha_solver: CaptchaSolver,
        discard_session_uc: DiscardRuntSessionUseCase | None = None,
    ):
        self._parse_license_uc = parse_license_uc
        self._create_runt_session_uc = create_runt_session_uc
        self._verify_license_uc = verify_license_uc
        self._captcha_solver = captcha_solver
        self._discard_session_uc = discard_session_uc

    async def _discard_session(self, session_id: str) -> None:
        if self._discard_session_uc and session_id:
            try:
                await self._discard_session_uc.execute(session_id)
            except Exception as e:
                logger.error('Failed to discard session %s: %s', self._mask_session_id(session_id), e)
                raise

    def _backoff_delay(self, attempt: int, base_ms: int) -> float:
        return 0.0

    def _mask_session_id(self, session_id: str) -> str:
        sid = (session_id or '').strip()
        if not sid:
            return ''
        if len(sid) <= 8:
            return '***'
        return f"{sid[:4]}***{sid[-4:]}"

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

    def _is_retryable_error(self, result: Dict[str, Any]) -> bool:
        code = str(result.get('code', '') or '').lower()
        if code in {'runt_response_timeout', 'circuit_breaker_open', 'runt_verify_error'}:
            return True
        return False

    def _has_low_confidence(self, ocr: Dict[str, Any]) -> bool:
        doc_conf = float(ocr.get('confidence', {}).get('documentNumber') or 0)
        return doc_conf < 0.7

    async def execute(
        self,
        image_bytes: bytes,
        max_attempts: int = 2,
        retry_delay_ms: int = 200,
        debug: bool = False,
        document_type_override: str = '',
        document_number_override: str = '',
    ) -> Tuple[Dict[str, Any], int]:
        start_ts = time.perf_counter()
        ocr_ms: float | None = None
        # -----------------------------------
        # OCR (cÃ©dula) â€“ puede ser sobrescrita por overrides
        # -----------------------------------
        if document_type_override and document_number_override:
            ocr = {
                'ownerDocumentType': document_type_override.strip().upper(),
                'ownerDocumentNumber': document_number_override.strip(),
            }
        else:
            ocr = self._parse_license_uc.execute(image_bytes)

        if debug:
            ocr_ms = round((time.perf_counter() - start_ts) * 1000, 2)

        document_type = (document_type_override or ocr.get('ownerDocumentType') or 'CC').strip().upper()
        document_number = (document_number_override or ocr.get('ownerDocumentNumber') or '').strip()

        logger.debug('Starting fullâ€‘auto licence verify, doc=%s, attempts=%d', document_number or 'unknown', max_attempts)

        if not document_number:
            return (
                {
                    'error': True,
                    'code': 'OCR_FAILED',
                    'message': 'No se pudo extraer nÃºmero de documento de la imagen',
                    'ocr': ocr,
                    'needsManualInput': True,
                    'manualStep': 'document_data',
                    'prefill': {'documentType': document_type, 'documentNumber': document_number},
                },
                422,
            )

        if self._has_low_confidence(ocr) and not (document_type_override or document_number_override):
            logger.warning('OCR low confidence for document=%s', document_number)
            return (
                {
                    'error': True,
                    'code': 'OCR_LOW_CONFIDENCE',
                    'message': 'OCR con baja confianza, ingrese datos manualmente',
                    'ocr': ocr,
                    'needsManualInput': True,
                    'manualStep': 'document_data',
                    'prefill': {'documentType': document_type, 'documentNumber': document_number},
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
        captcha_text: str = ''
        captcha_conf: float = 0.0

        last_verify_error: Dict[str, Any] | None = None
        def _log_timing() -> None:
            if not debug:
                return
            total_ms = round((time.perf_counter() - start_ts) * 1000, 2)
            attempt_timings = [
                {
                    'attempt': t.get('attempt'),
                    'sessionCreateMs': t.get('sessionCreateMs'),
                    'captchaSolveMs': t.get('captchaSolveMs'),
                    'verifyMs': t.get('verifyMs'),
                    'refreshCaptchaMs': t.get('refreshCaptchaMs'),
                    'attemptMs': t.get('attemptMs'),
                    'error': t.get('error'),
                }
                for t in attempt_traces
            ]
            logger.info('Timing summary: total_ms=%.2f ocr_ms=%s attempts=%s', total_ms, ocr_ms, attempt_timings)
        session_id = None
        existing_sessions = set()  # Track existing sessions to avoid duplicates
        try:
            for attempt in range(1, max_attempts + 1):
                trace: Dict[str, Any] = {'attempt': attempt}
                attempt_start = time.perf_counter()
                # ---- crear o reutilizar sesiÃ³n ----
                if not session_id:
                    # crear una nueva sesiÃ³n si no existe
                    session_start = time.perf_counter()
                    try:
                        session_result = await self._create_runt_session_uc.execute()
                    except Exception as exc:
                        failed_attempts += 1
                        logger.warning('Attempt %d: session creation failed: %s', attempt, exc)
                        last_error = {'error': True, 'code': 'RUNT_SESSION_ERROR', 'message': f'Error creando sesion: {str(exc)}'}
                        trace['error'] = 'session_creation_failed'
                        if debug:
                            trace['sessionCreateMs'] = round((time.perf_counter() - session_start) * 1000, 2)
                        if debug:
                            attempt_traces.append(trace)
                        if attempt < max_attempts:
                            await asyncio.sleep(self._backoff_delay(attempt, retry_delay_ms))
                        continue
    
                    session_id = (session_result.get('sessionId') or '').strip()
                    captcha_b64 = (session_result.get('captchaPngBase64') or '').strip()
                    last_captcha_b64 = captcha_b64
                    last_session_id = session_id
                    trace['sessionIdMasked'] = self._mask_session_id(session_id)
                    if debug:
                        trace['sessionCreateMs'] = round((time.perf_counter() - session_start) * 1000, 2)
    
                    if not session_id or not captcha_b64:
                        failed_attempts += 1
                        last_error = {'error': True, 'code': 'RUNT_SESSION_ERROR', 'message': 'Sesion RUNT no retorno captcha valido'}
                        trace['error'] = 'empty_session_or_captcha'
                        if debug:
                            attempt_traces.append(trace)
                        break
    
                # ---- resolver captcha ----
                try:
                    captcha_png = base64.b64decode(captcha_b64)
                    solve_start = time.perf_counter()
                    captcha_text, captcha_conf = self._captcha_solver.solve_with_confidence(captcha_png)
                    logger.debug('Captcha solved: text="%s" confidence=%.4f', captcha_text, captcha_conf)
                    if debug:
                        trace['captchaSolveMs'] = round((time.perf_counter() - solve_start) * 1000, 2)
                except Exception as exc:
                    failed_attempts += 1
                    logger.warning('Attempt %d: captcha solving failed: %s', attempt, exc)
                    last_error = {'error': True, 'code': 'CAPTCHA_OCR_ERROR', 'message': f'Error resolviendo captcha: {str(exc)}'}
                    trace['error'] = 'captcha_ocr_failed'
                    if debug:
                        trace['captchaSolveMs'] = round((time.perf_counter() - solve_start) * 1000, 2) if 'solve_start' in locals() else 0.0
                    if debug:
                        attempt_traces.append(trace)
                    if attempt < max_attempts:
                        await asyncio.sleep(self._backoff_delay(attempt, retry_delay_ms))
                    continue
    
                trace['captchaConfidence'] = round(float(captcha_conf), 4)
                trace['captchaLength'] = len(captcha_text or '')
    
                if not captcha_text:
                    failed_attempts += 1
                    last_error = {'error': True, 'code': 'CAPTCHA_OCR_EMPTY', 'message': 'OCR no pudo extraer texto de captcha'}
                    trace['error'] = 'captcha_text_empty'
                    if debug:
                        attempt_traces.append(trace)
                    if attempt < max_attempts:
                        await asyncio.sleep(self._backoff_delay(attempt, retry_delay_ms))
                    continue
    
                # ---- verificar licencia ----
                try:
                    verify_start = time.perf_counter()
                    verify_result = await self._verify_license_uc.execute(
                        session_id=session_id,
                        document_type=document_type,
                        document_number=document_number,
                        captcha_text=captcha_text,
                    )
                    if debug:
                        trace['verifyMs'] = round((time.perf_counter() - verify_start) * 1000, 2)
                except Exception as exc:
                    failed_attempts += 1
                    last_error = {
                        'error': True,
                        'code': 'RUNT_VERIFY_ERROR',
                        'message': f'Error en verificacion RUNT: {str(exc)}',
                    }
                    last_verify_error = last_error
                    trace['error'] = 'verify_exception'
                    if debug:
                        trace['verifyMs'] = round((time.perf_counter() - verify_start) * 1000, 2) if 'verify_start' in locals() else 0.0
                    if debug:
                        attempt_traces.append(trace)
                    refresh_start = time.perf_counter()
                    refreshed = await self._verify_license_uc.captcha_b64_from_session(session_id)
                    if refreshed:
                        captcha_b64 = refreshed
                        last_captcha_b64 = refreshed
                    else:
                        pass
                    if debug:
                        trace['refreshCaptchaMs'] = round((time.perf_counter() - refresh_start) * 1000, 2)
                    if attempt < max_attempts:
                        await asyncio.sleep(self._backoff_delay(attempt, retry_delay_ms))
                        # Obtener nuevo captcha antes de reintentar
                        refresh_start = time.perf_counter()
                        try:
                            new_captcha_b64 = await self._verify_license_uc.captcha_b64_from_session(session_id)
                            if new_captcha_b64:
                                captcha_b64 = new_captcha_b64
                                last_captcha_b64 = new_captcha_b64
                                logger.debug('Attempt %d: captcha refreshed for session %s', attempt, self._mask_session_id(session_id))
                            else:
                                logger.warning('Attempt %d: refresh captcha returned empty', attempt)
                        except Exception as exc:
                            logger.warning('Attempt %d: refresh captcha failed: %s', attempt, exc)
                        if debug:
                            trace['refreshCaptchaMs'] = round((time.perf_counter() - refresh_start) * 1000, 2)
                    continue
                    break
    
                if isinstance(verify_result, dict) and verify_result.get('error'):
                    last_error = verify_result
                    trace['verifyCode'] = verify_result.get('code')
                    if self._is_captcha_error(verify_result):
                        failed_attempts += 1
                        trace['error'] = 'captcha_invalid'
                        if debug:
                            attempt_traces.append(trace)
                        refresh_start = time.perf_counter()
                        try:
                            new_captcha_b64 = await self._verify_license_uc.captcha_b64_from_session(session_id)
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
                            last_verify_error = verify_result
                            break
                        if attempt < max_attempts:
                            await asyncio.sleep(self._backoff_delay(attempt, retry_delay_ms))
                        continue
                    if self._is_retryable_error(verify_result):
                        failed_attempts += 1
                        last_verify_error = verify_result
                        trace['error'] = 'verify_retryable'
                        if debug:
                            attempt_traces.append(trace)
                        refresh_start = time.perf_counter()
                        refreshed = await self._verify_license_uc.captcha_b64_from_session(session_id)
                        if refreshed:
                            captcha_b64 = refreshed
                            last_captcha_b64 = refreshed
                        else:
                            pass
                        if debug:
                            trace['refreshCaptchaMs'] = round((time.perf_counter() - refresh_start) * 1000, 2)
                        if attempt < max_attempts:
                            await asyncio.sleep(self._backoff_delay(attempt, retry_delay_ms))
                            continue
                        break
                    # Error no relacionado a captcha -> devolvemos inmediato
                    if debug:
                        attempt_traces.append(trace)
                    await self._discard_session(session_id)
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
    
                # ---- Ã©xito ----
                if debug:
                    trace['attemptMs'] = round((time.perf_counter() - attempt_start) * 1000, 2)
                    trace['result'] = 'success'
                    attempt_traces.append(trace)
                logger.debug('Licence verify successful: doc=%s, attempts=%d', document_number, attempt)
    
                # Respuesta simplificada
                license_info = {}
                if isinstance(verify_result, dict):
                    license_info = verify_result.get('licenseInfo') or {}
    
                status = str(license_info.get('status') or '').strip()
                is_active = status.upper() == 'ACTIVA'
                msg = 'La licencia esta activa' if is_active else 'No tiene licencia de transito activa'
    
                await self._discard_session(session_id)
                _log_timing()
                return (
                    {
                        'licenseNumber': license_info.get('licenseNumber', ''),
                        'solvedOnAttempt': attempt,
                        'issuingOffice': license_info.get('issuingOffice', ''),
                        'issueDate': license_info.get('issueDate', ''),
                        'status': status,
                        'active': is_active,
                        'message': msg,
                        **({'timingMs': {'total': round((time.perf_counter() - start_ts) * 1000, 2), 'ocr': ocr_ms}, 'trace': attempt_traces} if debug else {}),
                    },
                    200,
                )

        finally:
            if session_id:
                try:
                    await self._discard_session(session_id)
                except Exception as e:
                    logger.error('Failed to discard session %s: %s', self._mask_session_id(session_id), e)
        # ------- agotados los intentos --------
        logger.warning('Licence verify exhausted retries: doc=%s, attempts=%d', document_number, max_attempts)
        rescue_session_id = session_id or last_session_id
        rescue_captcha_b64 = captcha_b64 or last_captcha_b64
        if not rescue_captcha_b64 and rescue_session_id:
            try:
                refreshed = await self._verify_license_uc.captcha_b64_from_session(rescue_session_id)
                if refreshed:
                    rescue_captcha_b64 = refreshed
            except Exception:
                pass

        if last_verify_error is not None:
            _log_timing()
            await self._discard_session(session_id or last_session_id)
            return (
                {
                    'error': True,
                    'code': last_verify_error.get('code', 'RUNT_VERIFY_ERROR'),
                    'message': last_verify_error.get('message', 'Error en verificacion RUNT'),
                    'ocr': ocr,
                    'attemptsUsed': max_attempts,
                    'captcha': {
                        'solvedAutomatically': True,
                        'confidence': round(float(captcha_conf), 4) if 'captcha_conf' in locals() else 0.0,
                        'failedAttempts': failed_attempts,
                    },
                    'captchaSolved': captcha_text,
                    'verification': last_verify_error,
                    **({'trace': attempt_traces, 'timingMs': {'total': round((time.perf_counter() - start_ts) * 1000, 2), 'ocr': ocr_ms}} if debug else {}),
                },
                422,
            )

        _log_timing()
        await self._discard_session(session_id or last_session_id)
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
                    'documentType': document_type,
                    'documentNumber': document_number,
                },
                'lastError': last_error,
                **({'trace': attempt_traces, 'timingMs': {'total': round((time.perf_counter() - start_ts) * 1000, 2), 'ocr': ocr_ms}} if debug else {}),
            },
            422,
        )
