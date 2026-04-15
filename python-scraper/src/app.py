from __future__ import annotations
import os
import asyncio
from contextlib import asynccontextmanager
from typing import Any, Dict
from fastapi import Depends, FastAPI, File, Form, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from src.infrastructure.logging import setup_logging
from src.application.usecases.create_runt_session_usecase import CreateRuntSessionUseCase
from src.application.usecases.discard_runt_session_usecase import DiscardRuntSessionUseCase
from src.application.usecases.parse_license_usecase import ParseLicenseUseCase
from src.application.usecases.verify_full_auto_usecase import VerifyFullAutoUseCase
from src.application.usecases.verify_vehicle_usecase import VerifyVehicleUseCase
from src.infrastructure.ocr.paddle_license_ocr_adapter import PaddleLicenseOcrAdapter
from src.infrastructure.scraping.playwright_runt_scraper_adapter import get_scraper
from src.infrastructure.security.internal_auth import verify_internal_request
from src.scraper.captcha_solver import CaptchaSolver

setup_logging(os.getenv('LOG_LEVEL', 'INFO'))


class VerifyRequest(BaseModel):
    sessionId: str
    plate: str
    documentType: str
    documentNumber: str
    captchaText: str


async def _session_cleanup_loop(scraper_impl) -> None:
    while True:
        try:
            await scraper_impl.cleanup_expired_sessions(ttl_seconds=180)
        except Exception:
            pass
        await asyncio.sleep(30)


@asynccontextmanager
async def lifespan(app: FastAPI):
    scraper_adapter = get_scraper()
    ocr_adapter = PaddleLicenseOcrAdapter()

    app.state.parse_license_uc = ParseLicenseUseCase(ocr_adapter)
    app.state.create_runt_session_uc = CreateRuntSessionUseCase(scraper_adapter)
    app.state.discard_runt_session_uc = DiscardRuntSessionUseCase(scraper_adapter)
    app.state.verify_vehicle_uc = VerifyVehicleUseCase(scraper_adapter)
    app.state.verify_full_auto_uc = VerifyFullAutoUseCase(
        parse_license_uc=app.state.parse_license_uc,
        create_runt_session_uc=app.state.create_runt_session_uc,
        verify_vehicle_uc=app.state.verify_vehicle_uc,
        captcha_solver=CaptchaSolver(),
        discard_session_uc=app.state.discard_runt_session_uc,
    )

    # Warm OCR once to avoid lazy-init race/availability issues on first request.
    try:
        app.state.parse_license_uc.execute(b'')
    except Exception:
        pass

    cleanup_task = asyncio.create_task(_session_cleanup_loop(scraper_adapter.get_impl()))
    try:
        yield
    finally:
        cleanup_task.cancel()
        try:
            await cleanup_task
        except BaseException:
            pass
        try:
            await scraper_adapter.get_impl().close()
        except Exception:
            pass


app = FastAPI(lifespan=lifespan)


@app.get('/health')
async def health() -> Dict[str, str]:
    return {'status': 'ok', 'service': 'runt-scraper'}


class VerifyFullAutoRequest(BaseModel):
    image: str = ''
    maxAttempts: int = 5
    retryDelayMs: int = 500
    debug: bool = False
    plate: str = ''
    documentType: str = ''
    documentNumber: str = ''
    
    class Config:
        extra = 'allow'


@app.post('/runt/verify-full-auto')
async def verify_full_auto(
    payload: VerifyFullAutoRequest,
    _jwt_payload: Dict[str, Any] = Depends(verify_internal_request),
):
    has_overrides = bool(payload.plate and payload.documentType and payload.documentNumber)
    has_image = bool(payload.image and payload.image.strip())
    if not has_image and not has_overrides:
        return JSONResponse(
            {
                'error': True,
                'code': 'INVALID_INPUT',
                'message': 'Imagen o datos (plate+documentType+documentNumber) requeridos',
            },
            status_code=400,
        )

    max_attempts = max(1, min(int(payload.maxAttempts), 10))
    retry_delay = max(0, int(payload.retryDelayMs))

    try:
        import base64
        image_bytes = base64.b64decode(payload.image) if has_image else b''
        result, status_code = await app.state.verify_full_auto_uc.execute(
            image_bytes=image_bytes,
            max_attempts=max_attempts,
            retry_delay_ms=retry_delay,
            debug=bool(payload.debug),
            plate_override=payload.plate,
            document_type_override=payload.documentType,
            document_number_override=payload.documentNumber,
        )
        return JSONResponse(result, status_code=status_code)
    except Exception as exc:
        return JSONResponse(
            {
                'error': True,
                'code': 'FULL_VERIFY_ERROR',
                'message': str(exc),
            },
            status_code=500,
        )


class ManualVerifyRequest(BaseModel):
    sessionId: str
    plate: str
    documentType: str
    documentNumber: str
    captchaText: str


@app.post('/runt/verify-manual')
async def verify_manual(
    payload: ManualVerifyRequest,
    _jwt_payload: Dict[str, Any] = Depends(verify_internal_request),
):
    try:
        return await app.state.verify_vehicle_uc.execute(
            session_id=payload.sessionId,
            plate=payload.plate,
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
