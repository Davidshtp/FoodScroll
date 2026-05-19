from __future__ import annotations
from contextlib import asynccontextmanager
from typing import Any, Dict
from fastapi import Depends, FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from src.infrastructure.logging import get_logger, setup_logging
logger = get_logger(__name__)
from src.infrastructure.security.internal_auth import verify_internal_request
from src.application.usecases.parse_license_usecase import ParseLicenseUseCase
# Use‑cases y adaptadores específicos de este micro‑servicio
from src.application.usecases.create_runt_license_session_usecase import CreateRuntLicenseSessionUseCase
from src.application.usecases.verify_license_usecase import VerifyLicenseUseCase
from src.application.usecases.verify_full_auto_license_usecase import VerifyFullAutoLicenseUseCase
from src.application.usecases.discard_runt_session_usecase import DiscardRuntSessionUseCase
from src.infrastructure.ocr.paddle_license_ocr_adapter import PaddleLicenseOcrAdapter
from src.infrastructure.scraping.playwright_runt_license_adapter import get_scraper as get_license_scraper
from src.scraper.runt_license_scraper import get_page_pool
from src.scraper.captcha_solver import CaptchaSolver

# Configuración basada en variables de entorno

setup_logging('INFO')

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Instanciamos adaptador y OCR
    scraper_adapter = get_license_scraper()
    ocr_adapter = PaddleLicenseOcrAdapter()

    # Registro de dependencias en el state de FastAPI
    app.state.parse_license_uc = ParseLicenseUseCase(ocr_adapter)
    app.state.create_runt_license_session_uc = CreateRuntLicenseSessionUseCase(scraper_adapter)
    app.state.verify_license_uc = VerifyLicenseUseCase(scraper_adapter)
    app.state.discard_runt_session_uc = DiscardRuntSessionUseCase(scraper_adapter)
    app.state.verify_full_auto_license_uc = VerifyFullAutoLicenseUseCase(
        parse_license_uc=app.state.parse_license_uc,
        create_runt_session_uc=app.state.create_runt_license_session_uc,
        verify_license_uc=app.state.verify_license_uc,
        captcha_solver=CaptchaSolver(),
        discard_session_uc=app.state.discard_runt_session_uc,
    )

    # Warm‑up OCR (como en el proyecto original)
    try:
        app.state.parse_license_uc.execute(b'')
    except Exception:
        pass

    # Warm‑up captcha solver (carga el modelo CNN o PaddleOCR en memoria)
    try:
        captcha_solver = app.state.verify_full_auto_license_uc._captcha_solver
        captcha_solver.solve_with_confidence(b'\x00')
    except Exception:
        pass

    # Iniciar Page Pool con tamaño fijo
    pool = get_page_pool()
    try:
        await pool.start()
    except Exception as e:
        logger.error('PagePool start failed: %s', e)
        raise

    try:
        yield
    
    finally:
        # Cerrar sesiones del scraper
        try:
            await scraper_adapter.get_impl().close()
        except Exception:
            pass
        # Cerrar Page Pool
        try:
            await pool.close()
        except Exception:
            pass

app = FastAPI(lifespan=lifespan)

@app.get('/health')
async def health() -> Dict[str, Any]:
    scraper_adapter = app.state.verify_license_uc._scraper

    pool = get_page_pool()
    pool_stats = pool.stats

    circuit_state = 'unknown'
    try:
        circuit_state = scraper_adapter._breaker.state.value
    except Exception:
        pass

    captcha_status = {'charPredictor': False, 'paddleOcr': False}
    captcha_ready = False
    try:
        captcha_solver = app.state.verify_full_auto_license_uc._captcha_solver
        captcha_status = captcha_solver.solvers_status()
        captcha_ready = captcha_solver.is_ready()
    except Exception:
        pass

    all_ok = pool_stats['available'] > 0 and captcha_ready

    return {
        'status': 'ok' if all_ok else 'degraded',
        'service': 'runt-license-scraper',
        'pagePool': pool_stats,
        'circuitBreaker': circuit_state,
        'captchaSolver': captcha_status,
    }

@app.post('/runt/verify-full-auto-licencia')
async def verify_full_auto_licencia(
    image: UploadFile = File(None),
    documentType: str = Form(''),
    documentNumber: str = Form(''),
    maxAttempts: int = Form(5),
    retryDelayMs: int = Form(200),
    debug: bool = Form(False),
    _jwt_payload: Dict[str, Any] = Depends(verify_internal_request),
):
    has_image = image is not None
    has_manual_data = bool(documentType.strip() and documentNumber.strip())

    if not has_image and not has_manual_data:
        return JSONResponse(
            {
                'error': True,
                'code': 'INVALID_INPUT',
                'message': 'Debe subir una imagen o proporcionar documentType y documentNumber',
            },
            status_code=400,
        )

    max_attempts = max(1, min(int(maxAttempts), 10))
    retry_delay = max(0, int(retryDelayMs))

    if has_image:
        image_bytes = await image.read()
        if not image_bytes:
            return JSONResponse(
                {
                    'error': True,
                    'code': 'INVALID_INPUT',
                    'message': 'Imagen vacía',
                },
                status_code=400,
            )
        document_type_override = ''
        document_number_override = ''
    else:
        image_bytes = b''
        document_type_override = documentType.strip()
        document_number_override = documentNumber.strip()

    result, status_code = await app.state.verify_full_auto_license_uc.execute(
        image_bytes=image_bytes,
        max_attempts=max_attempts,
        retry_delay_ms=retry_delay,
        debug=bool(debug),
        document_type_override=document_type_override,
        document_number_override=document_number_override,
    )
    return JSONResponse(result, status_code=status_code)

# Endpoint manual (opcional) – similar al de vehículo
class ManualVerifyLicenseRequest(BaseModel):
    sessionId: str
    documentType: str
    documentNumber: str
    captchaText: str

@app.post('/runt/verify-licencia')
async def verify_licencia(
    payload: ManualVerifyLicenseRequest,
    _jwt_payload: Dict[str, Any] = Depends(verify_internal_request),
):
    try:
        return await app.state.verify_license_uc.execute(
            session_id=payload.sessionId,
            document_type=payload.documentType,
            document_number=payload.documentNumber,
            captcha_text=payload.captchaText,
        )
    except Exception as exc:
        return JSONResponse(
            {
                'error': True,
                'code': 'RUNT_VERIFY_ERROR',
                'message': str(exc),
            },
            status_code=500,
        )
