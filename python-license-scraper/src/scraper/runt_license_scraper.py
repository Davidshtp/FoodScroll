"""Scraper especializado para la sección "Licencia(s) de conducción" del portal RUNT.

Re‑usa gran parte de la lógica de RuntScraper (gestión global de navegador,
pool de páginas, captura de captcha, circuito breaker, limpieza de sesiones),
pero implementa un método `verify_license` que
* llena sólo los campos de documento y captcha
* extrae la tabla de licencias y devuelve únicamente los campos solicitados.
"""

from __future__ import annotations

import base64
import os
import re
import uuid
import unicodedata
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import asyncio
from playwright.async_api import async_playwright, Browser, Page, Playwright

from src.infrastructure.logging import get_logger
from src.scraper.doc_selectors import (
    RUNT_DOC_URL,
    DOC_FORM_SELECTORS,
    LICENSE_TABLE_SELECTOR,
)

logger = get_logger(__name__)

_RUNT_GOTO_TIMEOUT = 30000
_RUNT_CAPTCHA_REFRESH_TIMEOUT = 10000
_RUNT_AUTH_RESPONSE_TIMEOUT = 30000
_RUNT_LICENSE_API_TIMEOUT = 30000
_RUNT_API_BASE = 'https://runtproapi.runt.gov.co/CYRConsultaCiudadanoMS'
_RUNT_AUTH_URL = f"{_RUNT_API_BASE}/auth"
_RUNT_LICENSE_URL = f"{_RUNT_API_BASE}/consulta-ciudadano/licencias"
_BLOCK_RESOURCE_TYPES = {'font', 'stylesheet', 'media', 'image'}
_BLOCK_IMAGES = True  # Image blocking enabled to reduce memory

# Global singleton scraper (same pattern que RuntScraper)
_scraper_instance: Optional['RuntLicenseScraper'] = None


def get_scraper() -> 'RuntLicenseScraper':
    global _scraper_instance
    if _scraper_instance is None:
        _scraper_instance = RuntLicenseScraper()
    return _scraper_instance

# Store de sesiones (id → {'page': Page, 'created_at': datetime})
_sessions_store: Dict[str, dict] = {}

# Page Pool singleton
_page_pool_instance: Optional['RuntPagePool'] = None


def get_page_pool() -> 'RuntPagePool':
    global _page_pool_instance
    if _page_pool_instance is None:
        # Leer variables de entorno aquí (lazy loading)
        page_pool_min = int(os.getenv('PAGE_POOL_MIN', '5'))
        page_pool_max = page_pool_min
        page_pool_acquire_timeout = 5000
        _page_pool_instance = RuntPagePool(
            min_size=page_pool_min,
            max_size=page_pool_max,
            acquire_timeout=page_pool_acquire_timeout,
        )
    return _page_pool_instance


class RuntPagePool:
    """Pool de páginas Playwright pre-navegadas al formulario RUNT."""

    def __init__(self, min_size: int = 10, max_size: int = 30, acquire_timeout: int = 5000):
        self._min = min_size
        self._max = max_size
        self._acquire_timeout_s = max(acquire_timeout, 0) / 1000.0
        self._queue: asyncio.Queue[Page] = asyncio.Queue(maxsize=max_size)
        self._browser: Optional[Browser] = None
        self._playwright: Optional[Playwright] = None
        self._lock = asyncio.Lock()
        self._closed = False
        self._total_created = 0
        self._total_acquired = 0
        self._refill_task: Optional[asyncio.Task] = None

    async def start(self) -> None:
        await self._ensure_browser()
        # Attempt to warm up the pool up to min size, but tolerate failures per page
        warmed_pages: list[Page] = []
        for _ in range(self._min):
            try:
                page = await self._create_hot_page()
                warmed_pages.append(page)
            except Exception as e:
                logger.warning('Failed to create warm page during start: %s', e)
        for page in warmed_pages:
            await self._queue.put(page)
        self._refill_task = asyncio.create_task(self._refill_loop())
        logger.info('PagePool started: %d pages warm (successful)', len(warmed_pages))

    async def _ensure_browser(self) -> Browser:
        if self._browser and self._browser.is_connected():
            return self._browser
        self._playwright = await async_playwright().start()
        launch_kwargs: Dict[str, Any] = {
            'headless': _is_headless(),
            'args': [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--disable-software-rasterizer',
                '--js-flags=--max-old-space-size=1024',
                '--disable-crash-reporter',
            ],
        }
        self._browser = await self._playwright.chromium.launch(**launch_kwargs)
        return self._browser

    async def _create_hot_page(self) -> Page:
        browser = await self._ensure_browser()
        page = await browser.new_page()
        await _configure_page(page)
        await _install_modal_autoclose(page)
        await page.goto(RUNT_DOC_URL, wait_until='domcontentloaded', timeout=_RUNT_GOTO_TIMEOUT)
        await _install_modal_autoclose(page)
        # Optionally wait for a known form element; ignore any timeout during warm‑up
        try:
            selector = DOC_FORM_SELECTORS.get('document_input') or ''
            if selector:
                await page.wait_for_selector(selector, timeout=3500)
        except Exception:
            pass
        self._total_created += 1
        return page

    async def acquire(self) -> Page:
        if self._closed:
            raise RuntimeError('PagePool is closed')
        try:
            page = await asyncio.wait_for(self._queue.get(), timeout=self._acquire_timeout_s)
            self._total_acquired += 1
            return page
        except asyncio.TimeoutError:
            page = await self._create_hot_page()
            self._total_acquired += 1
            return page

    def release(self, page: Page) -> None:
        async def _requeue():
            if self._closed:
                # If pool is closed, close the page to free resources
                await self._close_page(page)
                return
            try:
                # Return the page back to the pool for reuse
                await self._queue.put(page)
            except Exception:
                # If requeue fails, close the page to avoid leaks
                await self._close_page(page)
        asyncio.ensure_future(_requeue())

    async def _close_page(self, page: Page) -> None:
        try:
            await page.close()
        except Exception:
            pass

    async def _refill_loop(self) -> None:
        while not self._closed:
            try:
                await asyncio.sleep(1)
                if self._closed:
                    break
                current = self._queue.qsize()
                if current < self._min:
                    needed = min(self._min - current, self._max - self._queue.qsize())
                    if needed <= 0:
                        continue
                    tasks = [self._create_hot_page() for _ in range(needed)]
                    pages = await asyncio.gather(*tasks)
                    for page in pages:
                        if self._closed:
                            await self._close_page(page)
                        else:
                            await self._queue.put(page)
            except Exception:
                pass

    async def warm_one(self) -> None:
        if self._closed:
            return
        try:
            current = self._queue.qsize()
        except Exception:
            current = 0
        if current >= self._min:
            return
        if current >= self._max:
            return
        try:
            page = await self._create_hot_page()
        except Exception as exc:
            logger.warning('PagePool warm_one failed: %s', exc)
            return
        if self._closed:
            await self._close_page(page)
            return
        try:
            await self._queue.put(page)
        except Exception:
            await self._close_page(page)

    async def close(self) -> None:
        self._closed = True
        if self._refill_task:
            self._refill_task.cancel()
            try:
                await self._refill_task
            except Exception:
                pass
        while not self._queue.empty():
            try:
                page = self._queue.get_nowait()
                await self._close_page(page)
            except Exception:
                pass
        if self._browser:
            try:
                await self._browser.close()
            except Exception:
                pass
            self._browser = None
        if self._playwright:
            try:
                await self._playwright.stop()
            except Exception:
                pass
            self._playwright = None

    @property
    def stats(self) -> Dict[str, Any]:
        return {
            'available': self._queue.qsize(),
            'minSize': self._min,
            'maxSize': self._max,
            'acquireTimeoutMs': int(self._acquire_timeout_s * 1000),
            'totalCreated': self._total_created,
            'totalAcquired': self._total_acquired,
            'closed': self._closed,
        }


def _is_headless() -> bool:
    raw = (os.getenv('PLAYWRIGHT_HEADLESS', 'true') or '').strip().lower()
    return raw in ('1', 'true', 'yes', 'on')


def _norm(s: str) -> str:
    s = (s or '').strip().lower()
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(ch for ch in s if not unicodedata.combining(ch))
    s = re.sub(r'\s+', ' ', s)
    return s


# _allow_image_url removed – image blocking disabled


async def _route_handler(route, request) -> None:
    try:
        rtype = request.resource_type
    except Exception:
        rtype = ''
    if rtype in _BLOCK_RESOURCE_TYPES:
        await route.abort()
        return
    # Image blocking disabled – allow all images
    await route.continue_()


async def _configure_page(page: Page) -> None:
    if not _BLOCK_RESOURCE_TYPES and not _BLOCK_IMAGES:
        return
    try:
        await page.route('**/*', _route_handler)
    except Exception:
        pass


async def _install_modal_autoclose(page: Page) -> None:
    script = """
(() => {
  if (window.__runtAutoCloseInstalled) return;
  window.__runtAutoCloseInstalled = true;
  const selectors = [
    'body > div.swal2-container.swal2-center.swal2-backdrop-show > div > div.swal2-actions > button.swal2-confirm.swal2-styled',
    'div.swal2-container.swal2-backdrop-show button.swal2-confirm',
    'button.swal2-confirm.swal2-styled',
    'button.swal2-confirm',
  ];
  const tryClose = () => {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        try { el.click(); } catch (e) {}
        return true;
      }
    }
    return false;
  };
  const target = document.body || document.documentElement;
  if (target) {
    const obs = new MutationObserver(() => { tryClose(); });
    obs.observe(target, { childList: true, subtree: true });
  }
  setTimeout(tryClose, 0);
  setTimeout(tryClose, 150);
  let attempts = 0;
  const maxAttempts = 20;
  const interval = setInterval(() => {
    attempts += 1;
    if (tryClose() || attempts >= maxAttempts) {
      clearInterval(interval);
    }
  }, 100);
})();
"""
    try:
        if not getattr(page, '_runt_autoclose_init', False):
            try:
                await page.add_init_script(script)
            except Exception:
                pass
            try:
                setattr(page, '_runt_autoclose_init', True)
            except Exception:
                pass
        await page.evaluate(script)
    except Exception:
        pass

class RuntLicenseScraper:
    """Clase principal que maneja la interacción con la página de consulta por documento.

    Re‑usa la infraestructura de Playwright del proyecto original. Las sesiones
    lógicas (sessionId) se guardan en `_sessions_store` para permitir reutilizar la
    página entre la obtención del captcha y la verificación del documento.
    """

    def __init__(self):
        self.runt_doc_url = RUNT_DOC_URL
        self._sessions_lock: asyncio.Lock = asyncio.Lock()
        self._doc_type_label_cache: Dict[str, str] = {}

    # ---------------------------------------------------------------------
    # Helpers genéricos (copiados de RuntScraper)
    # ---------------------------------------------------------------------
    async def _wait_for_form(self, page: Page) -> None:
        """Espera a que el formulario de la página esté listo.
        Reutiliza los selectores que aparecen en DOC_FORM_SELECTORS.
        """
        try:
            await page.wait_for_load_state('domcontentloaded', timeout=12000)
        except Exception:
            pass
        await page.wait_for_timeout(80)
        for sel in [
            DOC_FORM_SELECTORS.get('captcha_image'),
            DOC_FORM_SELECTORS.get('document_input'),
            DOC_FORM_SELECTORS.get('captcha_input'),
        ]:
            if not sel:
                continue
            try:
                await page.wait_for_selector(sel, timeout=3500)
                return
            except Exception:
                continue

    def _is_license_response(self, resp) -> bool:
        try:
            url = (resp.url or '').lower()
            if _RUNT_LICENSE_URL.lower() not in url:
                return False
            req = resp.request
            if req and (req.method or '').upper() != 'GET':
                return False
            ctype = (resp.headers.get('content-type') or '').lower()
            if 'json' not in ctype:
                return False
            return True
        except Exception:
            return False

    def _is_auth_response(self, resp) -> bool:
        try:
            url = (resp.url or '').lower()
            if _RUNT_AUTH_URL.lower() not in url:
                return False
            req = resp.request
            if req and (req.method or '').upper() != 'POST':
                return False
            ctype = (resp.headers.get('content-type') or '').lower()
            if 'json' not in ctype:
                return False
            return True
        except Exception:
            return False

    async def _extract_auth_token(self, resp) -> str:
        token = ''
        # Try header auth-token
        try:
            token = (resp.headers.get('auth-token') or '').strip()
        except Exception:
            token = ''
        if token:
            # Ensure Bearer prefix
            if not token.lower().startswith('bearer '):
                token = f"Bearer {token}"
            return token
        # Try JSON payload for common fields
        try:
            data = await resp.json()
        except Exception:
            data = None
        if isinstance(data, dict):
            token = (
                data.get('auth-token')
                or data.get('authToken')
                or data.get('token')
                or ''
            )
            if not token:
                # Fallback: search any dict value that looks like JWT
                for v in data.values():
                    if isinstance(v, str):
                        v_str = v.strip()
                        if re.match(r'^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$', v_str):
                            token = v_str
                            break
        if not token:
            return ''
        token = str(token).strip()
        if token and not token.lower().startswith('bearer '):
            token = f"Bearer {token}"
        return token

    async def _fetch_license_via_api(self, page: Page, auth_token: str) -> Dict[str, Any] | None:
        if not auth_token:
            return None
        headers = {
            'accept': 'application/json, text/plain, */*',
            'auth-token': auth_token,
            'x-funcionalidad': 'SHELL',
        }
        try:
            resp = await page.request.get(_RUNT_LICENSE_URL, headers=headers, timeout=_RUNT_LICENSE_API_TIMEOUT)
        except Exception:
            return None
        try:
            data = await resp.json()
        except Exception:
            data = None
        if data is None:
            return None
        return self._extract_from_payloads([data])

    async def _ensure_doc_form(self, page: Page) -> None:
        url_ok = False
        try:
            url = (page.url or '').lower()
            if 'runt.gov.co' in url:
                url_ok = True
        except Exception:
            url_ok = False
        has_form = False
        sel = DOC_FORM_SELECTORS.get('document_input') or ''
        if sel:
            try:
                has_form = await page.locator(sel).count() > 0
            except Exception:
                has_form = False
        if url_ok and has_form:
            return
        await page.goto(self.runt_doc_url, wait_until='domcontentloaded', timeout=_RUNT_GOTO_TIMEOUT)
        await _install_modal_autoclose(page)
        await self._wait_for_form(page)

    async def _get_input(self, page: Page, which: str):
        """Busca un locator para los inputs del formulario.
        `which` coincide con las claves del diccionario DOC_FORM_SELECTORS.
        """
        sel = DOC_FORM_SELECTORS.get(which)
        if sel:
            loc = page.locator(sel)
            try:
                if await loc.count() > 0:
                    return loc.first
            except Exception:
                pass
        # Fallback genérico usando formcontrolname (si existe).
        name_map = {
            'document_input': 'documento',
            'captcha_input': 'captcha',
        }
        form_name = name_map.get(which)
        if form_name:
            loc = page.locator(f'input[formcontrolname="{form_name}"]')
            try:
                if await loc.count() > 0:
                    return loc.first
            except Exception:
                pass
        return None

    async def _select_document_type(self, page: Page, document_type: str) -> None:
        """Selecciona el tipo de documento (CC, CE, PASAPORTE, etc.) en el mat‑select.
        Usa cache de etiquetas para evitar iterar todas las opciones en llamados sucesivos.
        """
        target = (document_type or '').strip().upper()
        target_n = _norm(target)

        preferred_terms = {
            'CC': ['cc', 'cedula de ciudadania', 'cedula', 'ciudadania'],
            'CE': ['ce', 'cedula de extranjeria', 'extranjeria'],
            'TI': ['ti', 'tarjeta de identidad', 'tarjeta'],
            'RC': ['rc', 'registro civil'],
            'NIT': ['nit'],
            'PAS': ['pas', 'pasaporte'],
        }.get(target, [target_n])

        selects = page.locator(DOC_FORM_SELECTORS.get('document_type_select') or '')
        try:
            count = await selects.count()
        except Exception:
            count = 0
        if count == 0:
            return
        doc_select = selects.nth(count - 1)

        # Intentar con etiqueta cacheada primero
        cached_label = self._doc_type_label_cache.get(target)
        if cached_label:
            try:
                await doc_select.click()
                await page.wait_for_selector('mat-option', timeout=8000)
                option = page.locator(f'mat-option:has-text("{cached_label}")')
                if await option.count() > 0:
                    await option.first.click()
                    return
            except Exception:
                pass

        # Fallback: iterar todas las opciones
        try:
            await doc_select.click()
            await page.wait_for_selector('mat-option', timeout=8000)
        except Exception:
            return
        options = page.locator('mat-option .mat-option-text')
        try:
            opt_count = await options.count()
        except Exception:
            opt_count = 0
        best_idx = None
        matched_label = ''
        for i in range(opt_count):
            try:
                txt = (await options.nth(i).inner_text()).strip()
            except Exception:
                continue
            txt_n = _norm(txt)

            if any(term in txt_n for term in preferred_terms if term):
                best_idx = i
                matched_label = txt
                break
        if best_idx is None:
            try:
                await page.keyboard.press('Escape')
            except Exception:
                pass
            return
        try:
            await options.nth(best_idx).click()
            if matched_label:
                self._doc_type_label_cache[target] = matched_label
        except Exception:
            try:
                await page.keyboard.press('Escape')
            except Exception:
                pass

    # ---------------------------------------------------------------------
    # API pública
    # ---------------------------------------------------------------------
    async def create_session(self) -> Dict[str, Any]:
        """Crea una sesión RUNT en la sección de documento y devuelve captcha.
        Adquiere una página caliente del pool, espera a que el formulario esté listo
        y extrae un captcha válido. Si la extracción falla, reintenta una vez recargando
        la página. La página se guarda en `_sessions_store` bajo un UUID que será el
        `sessionId` devuelto al cliente.
        """
        pool = get_page_pool()
        page = await pool.acquire()
        session_id = str(uuid.uuid4())
        try:
            # Asegurarse de que el formulario y el captcha estén cargados
            await self._wait_for_form(page)
            captcha_b64 = ""
            try:
                # Primero intento con timeout mayor para mayor fiabilidad
                captcha_b64 = await self._extract_captcha_base64(page, timeout_ms=5000)
                # Si sigue vacío, recargar y volver a intentar una vez
                if not captcha_b64:
                    await page.reload()
                    await self._wait_for_form(page)
                    await _install_modal_autoclose(page)
                    captcha_b64 = await self._extract_captcha_base64(page, timeout_ms=5000)
            except Exception as e:
                logger.warning('Error extrayendo captcha: %s', e)
            async with self._sessions_lock:
                _sessions_store[session_id] = {'created_at': datetime.now(), 'page': page}
            logger.debug('Created RUNT document session %s (captcha present=%s)', session_id[:8], bool(captcha_b64))
            return {'sessionId': session_id, 'captchaPngBase64': captcha_b64}
        except Exception as exc:
            # Liberar la página al pool (se reutilizará si no está cerrada)
            pool.release(page)
            raise

    async def _extract_captcha_base64(self, page: Page, timeout_ms: int = 6000) -> str:
        """Extrae el captcha de forma robusta.

        Preferimos data URL; si no existe, hacemos screenshot del <img>.
        Devuelve base64 puro (sin prefijo data:image/...;base64,).
        """

        # 1) Selector configurado (normalmente img[src^="data:image"]).
        selectors = [
            DOC_FORM_SELECTORS.get('captcha_image') or '',
            'img[src*="captcha" i]',
            'img[src^="data:image"]',
            'div.divCaptcha img',
            '.divCaptcha img',
        ]
        selectors = [s for s in selectors if s.strip()]

        for sel in selectors:
            try:
                await page.wait_for_selector(sel, timeout=timeout_ms)
            except Exception:
                continue

            # Tomar el "mejor" candidato: primero data url, si no, el screenshot mas grande.
            try:
                elems = await page.query_selector_all(sel)
            except Exception:
                elems = []

            best_png: bytes = b''
            best_area: float = -1.0

            for el in elems:
                try:
                    src = await el.get_attribute('src')
                except Exception:
                    src = None

                if src and src.startswith('data:image') and 'base64,' in src:
                    try:
                        raw = src.split('base64,', 1)[1]
                        data = base64.b64decode(raw)
                        if data:
                            return base64.b64encode(data).decode('utf-8')
                    except Exception:
                        pass

                try:
                    box = await el.bounding_box()
                    area = 0.0 if not box else float(box.get('width', 0.0) * box.get('height', 0.0))
                    png = await el.screenshot()
                    if png and area > best_area:
                        best_area = area
                        best_png = png
                except Exception:
                    continue

            if best_png:
                return base64.b64encode(best_png).decode('utf-8')

        return ''

    async def verify_license(
        self,
        session_id: str,
        document_type: str,
        document_number: str,
        captcha_text: str,
    ) -> Dict[str, Any]:
        """Envía los datos del documento y el captcha, y extrae la información de la licencia.
        Si la página asociada a `session_id` está disponible, se reutiliza; de lo
        contrario se crea una página fresca.
        """
        async with self._sessions_lock:
            sess = _sessions_store.get(session_id)
        if sess and sess.get('page'):
            page = sess['page']
            try:
                result = await self._verify_license_on_page(
                    page, document_type, document_number, captcha_text
                )
                return result
            except Exception as e:
                logger.warning('Session verification failed, discarding broken session: %s', e)
                await self.discard_session(session_id)
        # Fallback: crear página nueva y realizar la verificación
        return await self._verify_license_fresh(document_type, document_number, captcha_text)

    async def discard_session(self, session_id: str) -> None:
        async with self._sessions_lock:
            data = _sessions_store.pop(session_id, None)
        if data and data.get('page'):
            page = data['page']
            try:
                await page.close()
                logger.debug('Session closed and removed: %s', session_id[:8])
            except Exception as e:
                logger.warning('Error closing session page: %s', e)
        try:
            pool = get_page_pool()
            asyncio.create_task(pool.warm_one())
        except Exception:
            pass

    # ---------------------------------------------------------------------
    # Implementación interna de la verificación
    # ---------------------------------------------------------------------
    async def _verify_license_core(
        self,
        page: Page,
        document_type: str,
        document_number: str,
        captcha_text: str,
    ) -> Dict[str, Any]:
        """Núcleo compartido de verificación: navega al formulario, lo rellena,
        envía la consulta, detecta errores de captcha y extrae los datos de licencia."""
        await self._ensure_doc_form(page)

        dialog_state: Dict[str, str] = {'msg': ''}

        def _is_captcha_invalid_msg(msg: str) -> bool:
            m = _norm(msg)
            return 'captcha' in m and 'no es valido' in m

        async def _handle_dialog(dialog) -> None:
            try:
                dialog_state['msg'] = (dialog.message or '').strip()
            except Exception:
                dialog_state['msg'] = ''
            try:
                await dialog.accept()
            except Exception:
                pass

        def _on_dialog_evt(dialog) -> None:
            try:
                asyncio.create_task(_handle_dialog(dialog))
            except Exception:
                return

        auth_future = asyncio.get_running_loop().create_future()

        def _on_auth_response(resp):
            if auth_future.done():
                return
            if self._is_auth_response(resp):
                auth_future.set_result(resp)

        page.on('response', _on_auth_response)
        page.on('dialog', _on_dialog_evt)
        try:
            await self._select_document_type(page, document_type)
            doc_input = await self._get_input(page, 'document_input')
            if doc_input:
                await doc_input.fill(document_number)
            if captcha_text:
                captcha_input = await self._get_input(page, 'captcha_input')
                if captcha_input:
                    await captcha_input.click()
                    await captcha_input.fill(captcha_text)
            submit = await page.query_selector(DOC_FORM_SELECTORS.get('submit_button') or '')
            if submit:
                await submit.click()
            await self._close_swal2_fast(page, total_ms=600, poll_ms=100)
            for _ in range(6):
                if dialog_state.get('msg'):
                    break
                await page.wait_for_timeout(40)
            if _is_captcha_invalid_msg(dialog_state.get('msg', '')):
                return {
                    'error': True,
                    'code': 'RUNT_CAPTCHA_INVALID',
                    'message': dialog_state.get('msg') or 'El captcha no es valido',
                    'raw': {'dialogMessage': dialog_state.get('msg', '')},
                }

            token = ''
            auth_timeout_s = max(_RUNT_AUTH_RESPONSE_TIMEOUT, 0) / 1000.0
            logger.debug('Waiting for RUNT auth response (timeout=%ds)...', auth_timeout_s)
            try:
                auth_resp = await asyncio.wait_for(auth_future, timeout=auth_timeout_s)
                token = await self._extract_auth_token(auth_resp)
                logger.debug('Auth response received, token extracted: %s', 'yes' if token else 'no')
            except asyncio.TimeoutError:
                token = ''
                logger.warning('RUNT auth response timed out after %ds', auth_timeout_s)
            except Exception as e:
                token = ''
                logger.warning('RUNT auth response error: %s', e)

            if token:
                api_payload = await self._fetch_license_via_api(page, token)
                if api_payload:
                    logger.debug('License data fetched via API successfully')
                    return api_payload
                logger.warning('License API call returned no payload')

            logger.warning('RUNT_RESPONSE_TIMEOUT: token=%s, api_payload=%s', bool(token), bool(api_payload if token else False))

            return {
                'error': True,
                'code': 'RUNT_RESPONSE_TIMEOUT',
                'message': 'No se recibio respuesta de licencias a tiempo',
            }
        finally:
            try:
                page.remove_listener('response', _on_auth_response)
            except Exception:
                pass
            try:
                page.remove_listener('dialog', _on_dialog_evt)
            except Exception:
                pass

    async def _verify_license_on_page(
        self,
        page: Page,
        document_type: str,
        document_number: str,
        captcha_text: str,
    ) -> Dict[str, Any]:
        """Reutiliza una página existente para verificar la licencia."""
        return await self._verify_license_core(page, document_type, document_number, captcha_text)

    async def _verify_license_fresh(
        self,
        document_type: str,
        document_number: str,
        captcha_text: str,
    ) -> Dict[str, Any]:
        """Adquiere una página caliente del pool para verificar la licencia."""
        pool = get_page_pool()
        page = await pool.acquire()
        try:
            return await self._verify_license_core(page, document_type, document_number, captcha_text)
        finally:
            pool.release(page)

    async def _open_license_section(self, page: Page) -> None:
        # La UI post-consulta muestra varias subsecciones. Necesitamos expandir la de licencias.
        candidates = [
            'mat-expansion-panel-header:has-text("Licencia(s) de conducción")',
            'button:has-text("Licencia(s) de conducción")',
            '[role="button"]:has-text("Licencia(s) de conducción")',
            'a:has-text("Licencia(s) de conducción")',
            'text=/Licencia\\(s\\) de conducci[oó]n/i',
        ]
        for _ in range(3):
            for sel in candidates:
                try:
                    try:
                        await page.wait_for_selector(sel, timeout=800)
                    except Exception:
                        continue
                    loc = page.locator(sel)
                    if await loc.count() <= 0:
                        continue
                    try:
                        await loc.first.scroll_into_view_if_needed()
                    except Exception:
                        pass
                    await loc.first.click(timeout=1200, force=True)
                    await page.wait_for_timeout(200)
                    return
                except Exception:
                    continue
            await page.wait_for_timeout(150)

    def _looks_like_license_payload(self, data: Any) -> bool:
        # Ejemplos vistos: lista de objetos con keys `numeroLicencia`, `otExpide`, `estadoLicencia`, etc.
        try:
            if isinstance(data, list) and data and isinstance(data[0], dict):
                keys = set(data[0].keys())
                return 'numeroLicencia' in keys or 'detalleLicencia' in keys
            if isinstance(data, dict):
                # A veces viene envuelto.
                for v in data.values():
                    if isinstance(v, list) and v and isinstance(v[0], dict):
                        keys = set(v[0].keys())
                        if 'numeroLicencia' in keys or 'detalleLicencia' in keys:
                            return True
        except Exception:
            return False
        return False

    def _extract_from_payloads(self, payloads: List[Any]) -> Dict[str, Any] | None:
        # Busca el primer payload que se parezca a licencias.
        for p in payloads or []:
            # Direct list
            if isinstance(p, list) and p and isinstance(p[0], dict):
                return self._normalize_license_payload(p)
            if isinstance(p, dict):
                for v in p.values():
                    if isinstance(v, list) and v and isinstance(v[0], dict):
                        normalized = self._normalize_license_payload(v)
                        if normalized:
                            return normalized
        return None

    def _normalize_license_payload(self, items: List[Dict[str, Any]]) -> Dict[str, Any] | None:
        if not items:
            return None
        first = items[0]
        numero = str(first.get('numeroLicencia') or '')
        if not numero:
            return None
        ot = str(first.get('otExpide') or '')
        estado = str(first.get('estadoLicencia') or '')
        fecha = str(first.get('fechaExpedicion') or '')
        restricciones = first.get('restricciones')
        # Normalizar fecha a YYYY-MM-DD si viene ISO
        issue_date = fecha
        try:
            # 2025-09-05T09:24:52.000-05:00
            if 'T' in issue_date:
                issue_date = issue_date.split('T', 1)[0]
        except Exception:
            pass

        license_info = {
            'licenseNumber': numero,
            'issuingOffice': ot,
            'issueDate': issue_date,
            'status': estado,
            'restrictions': '' if restricciones is None else str(restricciones),
            'retention': '',
            'cancellationOffice': '',
        }
        return {'licenseInfo': license_info, 'raw': {'payload': items}}

    async def _extract_license_from_page(self, page: Page, captured_payloads: List[Any] | None = None) -> Dict[str, Any]:
        """Extrae la tabla de licencias y construye el dict de salida.
        Si la tabla no está presente o no contiene la fila esperada, devuelve
        un error estructurado.
        """
        # 0) Preferir payload JSON capturado (mas estable que UI).
        normalized = self._extract_from_payloads(captured_payloads or [])
        if normalized:
            return normalized

        try:
            rows: List[List[str]] = await page.evaluate(
                f'''() => {{
                    const table = document.querySelector('{LICENSE_TABLE_SELECTOR}');
                    if (!table) return [];
                    const bodyRows = Array.from(table.querySelectorAll('tbody tr'));
                    const data = bodyRows.map(tr => {{
                        const cells = Array.from(tr.querySelectorAll('td'));
                        return cells.map(c => (c.innerText || '').trim());
                    }});
                    return data;
                }}'''
            )
        except Exception as e:
            logger.error('Error extracting license table: %s', e)
            rows = []
        if not rows:
            return {
                'error': True,
                'code': 'LICENSE_NOT_FOUND',
                'message': 'No se encontró información de licencia en la respuesta del portal',
            }
        row = rows[0]
        while len(row) < 7:
            row.append('')
        license_info = {
            'licenseNumber': row[0],
            'issuingOffice': row[1],
            'issueDate': row[2],
            'status': row[3],
            'restrictions': row[4],
            'retention': row[5],
            'cancellationOffice': row[6],
        }
        raw_date = license_info.get('issueDate', '')
        try:
            dt = datetime.strptime(raw_date, '%d/%m/%Y')
            license_info['issueDate'] = dt.strftime('%Y-%m-%d')
        except Exception:
            pass
        return {'licenseInfo': license_info, 'raw': {'tableRows': rows}}

    async def cleanup_expired_sessions(self, ttl_seconds: int = 180) -> None:
        """Cierra y elimina sesiones cuyo `created_at` sea mayor a `ttl_seconds`.
        Utilizada por el bucle de cleanup en `src/app.py`.
        """
        now = datetime.now()
        expired_pages: List[Tuple[str, Optional[Page]]] = []
        async with self._sessions_lock:
            for sid, data in list(_sessions_store.items()):
                created = data.get('created_at')
                if not created:
                    continue
                if (now - created).total_seconds() > ttl_seconds:
                    expired_pages.append((sid, data.get('page')))
        # Cerrar páginas fuera del lock (operación await)
        for sid, page in expired_pages:
            if page:
                try:
                    await page.close()
                except Exception:
                    pass
        # Eliminar del store
        async with self._sessions_lock:
            for sid, _ in expired_pages:
                _sessions_store.pop(sid, None)

    async def close(self) -> None:
        """Cierra páginas/sesiones del scraper. El pool se cierra por separado en lifespan."""
        pages_to_close: List[Page] = []
        async with self._sessions_lock:
            for sid, data in list(_sessions_store.items()):
                page = data.get('page')
                if page:
                    pages_to_close.append(page)
            _sessions_store.clear()
        for page in pages_to_close:
            try:
                await page.close()
            except Exception:
                pass

    async def _close_swal2_once(self, page: Page, timeout_ms: int = 150) -> bool:
        try:
            container = page.locator('div.swal2-container')
            if await container.count() == 0:
                return False
            button = page.locator('button.swal2-confirm')
            if await button.count() > 0:
                await button.first.click(timeout=timeout_ms, force=True)
            else:
                try:
                    await page.keyboard.press('Escape')
                except Exception:
                    pass
            try:
                await container.first.wait_for(state='hidden', timeout=timeout_ms)
            except Exception:
                pass
            return True
        except Exception:
            return False

    async def _close_swal2_fast(self, page: Page, total_ms: int = 1200, poll_ms: int = 100) -> bool:
        try:
            attempts = max(1, int(total_ms / max(poll_ms, 1)))
        except Exception:
            attempts = 1
            poll_ms = 100
        for _ in range(attempts):
            if await self._close_swal2_once(page, timeout_ms=poll_ms):
                return True
            try:
                await page.wait_for_timeout(poll_ms)
            except Exception:
                break
        return False

    async def _close_captcha_error(self, page: Page) -> None:
        try:
            if await self._close_swal2_fast(page, total_ms=600, poll_ms=100):
                return
        except Exception:
            pass
        try:
            btn = page.locator('button:has-text("Aceptar")')
            if await btn.count() > 0:
                await btn.first.click(timeout=150, force=True)
                return
        except Exception:
            pass
        try:
            await page.keyboard.press('Escape')
        except Exception:
            pass

    async def refresh_captcha(self, session_id: str) -> str:
        """Recarga el captcha en la sesión existente y devuelve la nueva imagen en base64.
        Cierra cualquier modal de error, asegura la página del formulario,
        extrae el captcha con timeout largo (igual que en el primer intento),
        y solo como último recurso recarga la página completa.
        """
        async with self._sessions_lock:
            sess = _sessions_store.get(session_id)
        if not sess or not sess.get('page'):
            raise ValueError('Session not found or page missing')
        page = sess['page']

        dialog_state: Dict[str, str] = {'msg': ''}

        async def _handle_dialog(dialog) -> None:
            try:
                dialog_state['msg'] = (dialog.message or '').strip()
            except Exception:
                dialog_state['msg'] = ''
            try:
                await dialog.accept()
            except Exception:
                pass

        def _on_dialog_evt(dialog) -> None:
            try:
                asyncio.create_task(_handle_dialog(dialog))
            except Exception:
                return

        page.on('dialog', _on_dialog_evt)
        try:
            # 1) Cerrar modales HTML de error (Material UI)
            await self._close_captcha_error(page)
            await self._close_swal2_fast(page, total_ms=600, poll_ms=100)

            # 2) Asegurar que la página está en la URL del formulario
            await self._ensure_doc_form(page)

            # 3) Primer intento: extraer captcha con timeout largo como en create_session
            captcha_b64 = await self._extract_captcha_base64(page, timeout_ms=5000)
            if captcha_b64:
                return captcha_b64

            # 4) Fallback: recargar la página y reintentar
            await page.reload()
            await self._ensure_doc_form(page)
            await _install_modal_autoclose(page)
            await self._close_swal2_fast(page, total_ms=600, poll_ms=100)
            return await self._extract_captcha_base64(page, timeout_ms=5000)
        finally:
            try:
                page.remove_listener('dialog', _on_dialog_evt)
            except Exception:
                pass

    async def captcha_b64_from_session(self, session_id: str) -> str:
        """Refresca la página de la sesión y extrae el captcha fresco.
        Devuelve base64 puro (sin prefijo data:image/...;base64,).
        Vacío si falla.
        """
        async with self._sessions_lock:
            sess = _sessions_store.get(session_id)
        if not sess or not sess.get('page'):
            return ''
        page = sess['page']
        try:
            await page.goto(self.runt_doc_url, wait_until='domcontentloaded', timeout=_RUNT_GOTO_TIMEOUT)
        except Exception:
            pass
        await self._ensure_doc_form(page)
        await _install_modal_autoclose(page)
        return await self._extract_captcha_base64(page, timeout_ms=5000)
