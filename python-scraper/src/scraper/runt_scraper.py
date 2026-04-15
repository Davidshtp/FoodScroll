import asyncio
import uuid
import base64
import os
from datetime import datetime
from typing import Any, Dict, Optional, List, Tuple

import re
import unicodedata

from playwright.async_api import async_playwright, Browser, Page, Playwright

from src.infrastructure.logging import get_logger
from src.scraper.selectors import RUNT_SELECTORS, RUNT_URL

logger = get_logger(__name__)

# Global singleton scraper
_scraper_instance: Optional['RuntScraper'] = None

def get_scraper() -> 'RuntScraper':
    global _scraper_instance
    if _scraper_instance is None:
        _scraper_instance = RuntScraper()
    return _scraper_instance

# Global persistent browser and page
_global_browser: Optional[Browser] = None
_global_page: Optional[Page] = None
_global_playwright: Optional[Playwright] = None

# Session storage (global to persist across requests)
_sessions_store: Dict[str, dict] = {}


def _is_headless() -> bool:
    raw = (os.getenv('PLAYWRIGHT_HEADLESS', 'true') or '').strip().lower()
    return raw in ('1', 'true', 'yes', 'on')


async def _get_global_page() -> Tuple[Page, str]:
    global _global_browser, _global_page, _global_playwright
    
    if _global_page is None or (_global_browser and not _global_browser.is_connected()):
        _global_playwright = await async_playwright().start()
        _global_browser = await _global_playwright.chromium.launch(
            headless=_is_headless(),
            args=['--no-sandbox', '--disable-setuid-sandbox'],
        )
        _global_page = await _global_browser.new_page()
        await _global_page.goto(RUNT_URL, wait_until='domcontentloaded', timeout=15000)
    
    session_id = str(uuid.uuid4())
    return _global_page, session_id

class RuntScraper:
    """Scraper real para el portal RUNT usando Playwright"""
    
    def __init__(self):
        self.playwright: Optional[Playwright] = None
        self.browser: Optional[Browser] = None
        # runt.gov.co redirige a portalpublico; usar URL actual por defecto.
        self.runt_url = os.getenv('RUNT_URL', RUNT_URL)

    def _norm(self, s: str) -> str:
        s = s or ''
        s = unicodedata.normalize('NFD', s)
        s = ''.join(ch for ch in s if unicodedata.category(ch) != 'Mn')
        s = re.sub(r'\s+', ' ', s).strip().lower()
        return s

    def _map_document_type_label(self, document_type: str) -> str:
        """Maps API-ish document codes to UI visible labels."""
        dt = (document_type or '').strip().upper()
        mapping = {
            'C': 'Cedula Ciudadania',
            'CC': 'Cedula Ciudadania',
            'E': 'Cedula de Extranjeria',
            'CE': 'Cedula de Extranjeria',
            'N': 'NIT',
            'NIT': 'NIT',
            'P': 'Pasaporte',
            'PA': 'Pasaporte',
            'T': 'Tarjeta de Identidad',
            'TI': 'Tarjeta de Identidad',
            'U': 'Registro Civil',
            'RC': 'Registro Civil',
            'D': 'Carnet Diplomatico',
            'CD': 'Carnet Diplomatico',
            'Y': 'Permiso por Proteccion Temporal',
            'PPT': 'Permiso por Proteccion Temporal',
        }
        return mapping.get(dt, 'Cedula Ciudadania')

    async def _wait_for_runt_form(self, page: Page) -> None:
        try:
            await page.wait_for_load_state('domcontentloaded', timeout=15000)
        except Exception:
            pass
        try:
            await page.wait_for_timeout(1500)
        except Exception:
            pass
        for sel in [RUNT_SELECTORS.get('captcha_image'), RUNT_SELECTORS.get('plate_input'), 'input.mat-input-element']:
            if not sel:
                continue
            try:
                await page.wait_for_selector(sel, timeout=5000)
                return
            except Exception:
                continue

    async def _get_input(self, page: Page, which: str):
        """Returns a locator for plate/document/captcha inputs."""
        sel = RUNT_SELECTORS.get(which)
        if sel:
            loc = page.locator(sel)
            try:
                if await loc.count() > 0:
                    return loc.first
            except Exception:
                pass

        # Fallback to formcontrolname
        name_map = {
            'plate_input': 'placa',
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

        # Last fallback
        inputs = page.locator('input.mat-input-element')
        idx_map = {'plate_input': 0, 'document_input': 1, 'captcha_input': 2}
        idx = idx_map.get(which, 0)
        return inputs.nth(idx)

    async def _select_document_type(self, page: Page, document_type: str) -> None:
        """Select document type in Angular Material mat-select."""
        target = self._map_document_type_label(document_type)
        target_n = self._norm(target)

        selects = page.locator('mat-select')
        try:
            count = await selects.count()
        except Exception:
            count = 0

        if count <= 0:
            return

        # In current portal: [procedencia, tipoConsulta, tipoDocumento]. Use last as best-effort.
        doc_select = selects.nth(2) if count >= 3 else selects.last

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
        for i in range(opt_count):
            try:
                txt = (await options.nth(i).inner_text()).strip()
            except Exception:
                continue
            txt_n = self._norm(txt)
            if not txt_n:
                continue
            if target_n in txt_n:
                best_idx = i
                break

        if best_idx is None:
            # Fall back to default selected (usually Cedula Ciudadania) by just closing.
            try:
                await page.keyboard.press('Escape')
            except Exception:
                pass
            return

        try:
            await options.nth(best_idx).click()
        except Exception:
            try:
                await page.keyboard.press('Escape')
            except Exception:
                pass
    
    async def _get_browser(self) -> Browser:
        """Obtiene o crea el navegador"""
        try:
            if self.browser and self.browser.is_connected():
                return self.browser
        except:
            pass
        
        # Always create new
        pw = await async_playwright().start()
        self.playwright = pw
        self.browser = await pw.chromium.launch(
            headless=_is_headless(),
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        return self.browser

    async def _safe_new_page(self):
        """Crea una nueva pagina, recreando el browser si quedo en estado roto."""
        try:
            browser = await self._get_browser()
            return await browser.new_page()
        except Exception:
            # Browser/playwright puede quedar zombie; recrear completamente.
            try:
                if self.browser:
                    await self.browser.close()
            except Exception:
                pass
            try:
                if self.playwright:
                    await self.playwright.stop()
            except Exception:
                pass

            self.browser = None
            self.playwright = None
            browser = await self._get_browser()
            return await browser.new_page()
    
    async def create_session(self) -> dict:
        try:
            # Always use a fresh page so RUNT session/captcha is never stale.
            page = await self._safe_new_page()
            session_id = str(uuid.uuid4())

            # Ensure a fresh captcha is rendered for each logical session.
            try:
                await page.goto(self.runt_url, wait_until='domcontentloaded', timeout=20000)
            except Exception as e:
                logger.warning("Failed to navigate to RUNT URL: %s", e)
            await self._wait_for_runt_form(page)

            _sessions_store[session_id] = {'created_at': datetime.now(), 'page': page}

            captcha_b64 = ""
            try:
                captcha_b64 = await self._extract_captcha_base64(page)
            except Exception as e:
                logger.warning("Failed to extract captcha: %s", e)
                captcha_b64 = ""
            
            logger.info("Session created: %s, has_captcha=%s", session_id[:8], bool(captcha_b64))
            return {'sessionId': session_id, 'captchaPngBase64': captcha_b64}
        except Exception as exc:
            logger.error("Failed to create RUNT session: %s", exc)
            raise RuntimeError(f'Could not create RUNT session: {str(exc)}') from exc

    async def _extract_captcha_base64(self, page: Page) -> str:
        """Extract captcha robustly: prefer data URL, fallback to screenshot."""
        # 1) Best source: image located in the same form area as captcha input.
        try:
            captcha_input = page.locator('input[formcontrolname="captcha"]')
            if await captcha_input.count() > 0:
                local_img = page.locator('img[src^="data:image"], img[src*="captcha" i]').first
                if await local_img.count() > 0:
                    src = await local_img.get_attribute('src')
                    if src and src.startswith('data:image') and 'base64,' in src:
                        raw = src.split('base64,', 1)[1]
                        data = base64.b64decode(raw)
                        if data:
                            return base64.b64encode(data).decode('utf-8')
                    png = await local_img.screenshot()
                    if png:
                        return base64.b64encode(png).decode('utf-8')
        except Exception:
            pass

        # 2) Generic fallbacks.
        selectors = [
            RUNT_SELECTORS.get('captcha_image', ''),
            'img[src*="captcha" i]',
            'img[src^="data:image"]',
        ]
        selectors = [s for s in selectors if s]

        for sel in selectors:
            try:
                await page.wait_for_selector(sel, timeout=6000)
            except Exception:
                continue

            elems = await page.query_selector_all(sel)
            best_png = b''
            best_area = -1.0
            for el in elems:
                try:
                    src = await el.get_attribute('src')
                except Exception:
                    src = None

                if src and src.startswith('data:image') and 'base64,' in src:
                    try:
                        raw = src.split('base64,', 1)[1]
                        data = base64.b64decode(raw)
                        if len(data) > len(best_png):
                            best_png = data
                        continue
                    except Exception:
                        pass

                try:
                    box = await el.bounding_box()
                    area = 0.0 if not box else float(box.get('width', 0.0) * box.get('height', 0.0))
                    png = await el.screenshot()
                    if area > best_area and png:
                        best_area = area
                        best_png = png
                except Exception:
                    continue

            if best_png:
                return base64.b64encode(best_png).decode('utf-8')

        return ''
    
    async def verify_vehicle(
        self,
        session_id: str,
        plate: str,
        document_type: str,
        document_number: str,
        captcha_text: str
    ) -> dict:
        """Verifica un vehículo en RUNT"""
        # Use the session page if it still exists
        sess = _sessions_store.get(session_id)
        if sess and sess.get('page'):
            try:
                page = sess['page']
                # Verify on existing page
                result = await self._verify_on_page(
                    page=page,
                    plate=plate,
                    document_type=document_type,
                    document_number=document_number,
                    captcha_text=captcha_text,
                )
                # Session page is one-shot for captcha flow; close it after verify.
                _sessions_store.pop(session_id, None)
                try:
                    await page.close()
                except Exception:
                    pass
                return result
            except Exception as e:
                logger.warning("Session verify error, falling back to fresh page: %s", e)
                try:
                    if sess.get('page'):
                        await sess['page'].close()
                except Exception:
                    pass
                _sessions_store.pop(session_id, None)
        
        # Fallback to fresh page
        return await self._verify_fresh(plate, document_type, document_number, captcha_text)

    async def _verify_on_page(
        self,
        page: Page,
        plate: str,
        document_type: str,
        document_number: str,
        captcha_text: str,
    ) -> dict:
        """Verifica usando una pagina existente (de create_session)."""
        try:
            api_payloads: List[Tuple[str, Any]] = []

            def _on_response(resp):
                try:
                    ct = (resp.headers or {}).get('content-type', '')
                except Exception:
                    ct = ''
                if 'application/json' not in (ct or ''):
                    return
                url = getattr(resp, 'url', '') or ''
                if 'runtproapi.runt.gov.co' not in url:
                    return
                # Ignore noisy boot/config endpoints.
                if (
                    '/captcha/' in url
                    or url.endswith('/tipo-documento')
                    or url.endswith('/configuracion-sesion')
                    or url.endswith('/soat/banner')
                    or url.endswith('/captcha/valida-captcha-recaptcha')
                ):
                    return
                api_payloads.append((url, resp))

            try:
                page.on('response', _on_response)
            except Exception:
                pass

            # Ensure we are on the correct URL and UI is ready.
            try:
                if page.url != self.runt_url:
                    await page.goto(self.runt_url, wait_until='domcontentloaded', timeout=20000)
            except Exception:
                # If navigation fails, continue; selectors will tell.
                pass

            await self._wait_for_runt_form(page)

# Fill form - use fill() which works for placa and documento
            try:
                await page.locator('input[formcontrolname="placa"]').fill(plate)
            except Exception:
                pass

            # Wait for captcha input to appear
            await page.wait_for_timeout(800)

            await self._select_document_type(page, document_type)
            await page.wait_for_timeout(300)

            try:
                await page.locator('input[formcontrolname="documento"]').fill(document_number)
            except Exception:
                pass

            await page.wait_for_timeout(800)

            # CAPTCHA - CLICK first then TYPE (key for Angular)
            if captcha_text:
                try:
                    captcha_input = page.locator('input[formcontrolname="captcha"]')
                    await captcha_input.click()
                    await page.wait_for_timeout(300)
                    await captcha_input.fill(captcha_text)
                except Exception:
                    pass

            await page.wait_for_timeout(1000)

            submit = await page.query_selector('button:has-text("Consultar")')
            if not submit:
                submit = await page.query_selector('button[type="submit"]')
            if submit:
                await submit.click()
            else:
                pass

            # Wait for either a validation error or results.
            try:
                await page.wait_for_load_state('networkidle', timeout=20000)
            except Exception:
                pass

            await page.wait_for_timeout(4000)
            
            # Save page text for debugging
            try:
                page_text = await page.evaluate("() => document.body.innerText")
            except Exception:
                pass

            # First pass extraction (before tab navigation)
            result = await self._extract_result_from_page(page, plate)

            # Try to get SOAT/RTM from DOM by clicking tabs
            try:
                soat_data = await self._get_soat_rtm_data(page)
                if soat_data:
                    result['soatLatest'] = soat_data.get('soat')
                    result['rtmLatest'] = soat_data.get('rtm')
            except:
                pass

            # Convert captured API responses to JSON payloads (serializable)
            # NOTE: do this after tab navigation to include SOAT/RTM API calls.
            api_json: List[Tuple[str, Any]] = []
            for url, resp in api_payloads[-80:]:
                try:
                    api_json.append((url, await resp.json()))
                except Exception:
                    continue

            # Merge API-derived data (vehicle + raw + soat/rtm when available)
            if api_json:
                api_result = self._extract_from_api_payloads(api_json, plate)
                api_soat, api_rtm = self._extract_soat_rtm_from_api_json(api_json)

                # Prefer API vehicle info when available; keep DOM fallback otherwise.
                if isinstance(api_result, dict):
                    if api_result.get('vehicleInfo'):
                        result['vehicleInfo'] = api_result.get('vehicleInfo')
                    result['rawApi'] = api_result.get('rawApi')

                # Prefer explicit SOAT/RTM API payloads over DOM parsing.
                if api_soat is not None:
                    result['soatLatest'] = api_soat
                elif isinstance(api_result, dict) and api_result.get('soatLatest') is not None:
                    result['soatLatest'] = api_result.get('soatLatest')

                if api_rtm is not None:
                    result['rtmLatest'] = api_rtm
                elif isinstance(api_result, dict) and api_result.get('rtmLatest') is not None:
                    result['rtmLatest'] = api_result.get('rtmLatest')

                # Build normalized histories from real API payloads.
                soat_history, rtm_history = self._extract_normalized_histories_from_api_json(api_json)
                result['soatHistory'] = soat_history
                result['rtmHistory'] = rtm_history

                # Ensure latest records are aligned with history ordering.
                if soat_history:
                    result['soatLatest'] = soat_history[0]
                if rtm_history:
                    result['rtmLatest'] = rtm_history[0]

                # Add compact normalized block for downstream consumers.
                result['normalized'] = {
                    'vehicle': result.get('vehicleInfo', {}),
                    'soat': {
                        'latest': result.get('soatLatest'),
                        'history': soat_history,
                    },
                    'rtm': {
                        'latest': result.get('rtmLatest'),
                        'history': rtm_history,
                    },
                }

            return self._build_public_vehicle_response(result)
        except Exception as e:
            logger.error("Verify error on session page: %s", e)
            return {
                'error': True,
                'code': 'RUNT_VERIFY_ERROR',
                'message': str(e),
            }

    def _extract_from_api_payloads(self, api_json: List[Tuple[str, Any]], plate: str) -> Optional[Dict[str, Any]]:
        """Heuristically map CYRConsultaVehiculoMS API JSON into our expected shape."""
        if not api_json:
            return None

        candidates: List[Dict[str, Any]] = []

        def walk(obj: Any):
            if isinstance(obj, dict):
                candidates.append(obj)
                for v in obj.values():
                    walk(v)
            elif isinstance(obj, list):
                for it in obj:
                    walk(it)

        for _url, payload in api_json:
            walk(payload)

        def score(d: Dict[str, Any]) -> int:
            keys = {self._norm(k) for k in d.keys()}
            s = 0
            for want in ['placa', 'marca', 'linea', 'clase', 'clasificacion', 'soat', 'rtm', 'tecnomecanica']:
                if any(want in k for k in keys):
                    s += 1
            return s

        best = None
        best_s = 0
        for d in candidates:
            sc = score(d)
            if sc > best_s:
                best_s = sc
                best = d

        # Return raw API payloads if we got some but couldn't map.
        if not best or best_s < 2:
            return {
                'vehicleInfo': {'plate': plate},
                'soatLatest': None,
                'rtmLatest': None,
                'rawApi': {u: p for (u, p) in api_json},
            }

        vehicle: Dict[str, Any] = {'plate': plate}

        key_map = {
            'brand': ['marca', 'brand'],
            'line': ['linea', 'line'],
            'vehicleClass': ['clase', 'clasevehiculo', 'clase_vehiculo'],
            'classification': ['clasificacion', 'clasificación'],
            'modelYear': ['modelo', 'anomodelo', 'año modelo', 'anio modelo', 'ano modelo'],
            'color': ['color'],
            'transitLicenseNumber': ['licencia', 'licencia de transito', 'numero licencia'],
            'liensStatus': ['gravamen', 'gravámenes'],
            'propertyLiens': ['gravamenes', 'gravamenes a la propiedad'],
        }

        for out_k, in_keys in key_map.items():
            for ik in in_keys:
                for bk, bv in best.items():
                    if self._norm(ik) in self._norm(bk):
                        if bv is not None and str(bv).strip() != '':
                            vehicle[out_k] = bv
                            break
                if out_k in vehicle:
                    break

        if 'modelYear' in vehicle:
            try:
                vehicle['modelYear'] = int(re.sub(r'[^0-9]', '', str(vehicle['modelYear']))[:4])
            except Exception:
                pass

        soat = None
        rtm = None
        for d in candidates:
            kn = {self._norm(k) for k in d.keys()}
            if soat is None and any('soat' in k for k in kn):
                soat = d
            if rtm is None and (any('rtm' in k for k in kn) or any('tecnomecan' in k for k in kn)):
                rtm = d
            if soat is not None and rtm is not None:
                break

        return {
            'vehicleInfo': vehicle,
            'soatLatest': soat,
            'rtmLatest': rtm,
            'rawApi': {u: p for (u, p) in api_json},
        }

    def _extract_soat_rtm_from_api_json(self, api_json: List[Tuple[str, Any]]) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
        """Extract best SOAT/RTM payloads from captured API JSON responses."""
        if not api_json:
            return None, None

        soat_candidates: List[Dict[str, Any]] = []
        rtm_candidates: List[Dict[str, Any]] = []

        def walk(obj: Any):
            if isinstance(obj, dict):
                keys_n = {self._norm(k) for k in obj.keys()}

                # SOAT-like payloads
                if (
                    any('soat' in k for k in keys_n)
                    or any('poliza' in k for k in keys_n)
                    or any('asegur' in k for k in keys_n)
                ):
                    soat_candidates.append(obj)

                # RTM / Tecnomecanica-like payloads
                if (
                    any('rtm' in k for k in keys_n)
                    or any('tecnomecan' in k for k in keys_n)
                    or any('revision' in k for k in keys_n)
                    or any('certificado' in k for k in keys_n)
                    or any('cda' in k for k in keys_n)
                ):
                    rtm_candidates.append(obj)

                for v in obj.values():
                    walk(v)
            elif isinstance(obj, list):
                for it in obj:
                    walk(it)

        for _url, payload in api_json:
            walk(payload)

        def pick_best(candidates: List[Dict[str, Any]], wants: List[str]) -> Optional[Dict[str, Any]]:
            if not candidates:
                return None
            best = None
            best_score = -1
            for c in candidates:
                keys_n = [self._norm(k) for k in c.keys()]
                score = 0
                for w in wants:
                    if any(w in k for k in keys_n):
                        score += 1
                # Slightly prefer payloads with more fields.
                score += min(len(c.keys()), 10)
                if score > best_score:
                    best_score = score
                    best = c
            return best

        best_soat = pick_best(
            soat_candidates,
            ['soat', 'poliza', 'asegur', 'vigencia', 'fecha', 'estado'],
        )
        best_rtm = pick_best(
            rtm_candidates,
            ['rtm', 'tecnomecan', 'revision', 'certificado', 'cda', 'vigencia', 'fecha', 'estado'],
        )

        return best_soat, best_rtm

    def _to_date(self, v: Any) -> str:
        """Normalize API datetime/date strings to YYYY-MM-DD when possible."""
        if v is None:
            return ''
        s = str(v).strip()
        if not s:
            return ''
        # Typical RUNT format: 2024-03-05T00:00:00.000-05:00
        if 'T' in s and len(s) >= 10:
            return s[:10]
        # Already date-ish
        if len(s) >= 10 and s[4] == '-' and s[7] == '-':
            return s[:10]
        return s

    def _parse_ymd(self, s: Any):
        s2 = self._to_date(s)
        if not s2 or len(s2) != 10:
            return None
        try:
            return datetime.strptime(s2, '%Y-%m-%d').date()
        except Exception:
            return None

    def _derive_history_status(self, latest: Optional[Dict[str, Any]], kind: str) -> str:
        """Return ACTIVO/VENCIDO/SIN_DATOS from latest SOAT or RTM record."""
        if not latest:
            return 'SIN_DATOS'

        today = datetime.now().date()

        if kind == 'soat':
            status_text = self._norm(latest.get('status') or latest.get('issuanceStatus') or '')
            if 'vigente' in status_text and 'no vigente' not in status_text:
                return 'ACTIVO'
            end_dt = self._parse_ymd(latest.get('endDate'))
            if end_dt is not None:
                return 'ACTIVO' if end_dt >= today else 'VENCIDO'
            return 'SIN_DATOS'

        if kind == 'rtm':
            status_text = self._norm(latest.get('status') or '')
            vigente_text = self._norm(latest.get('isCurrent') or '')
            if vigente_text in ('si', 'sí'):
                return 'ACTIVO'
            if 'aprobada' in status_text and vigente_text not in ('no',):
                exp_dt = self._parse_ymd(latest.get('expiresAt'))
                if exp_dt is not None:
                    return 'ACTIVO' if exp_dt >= today else 'VENCIDO'
            exp_dt = self._parse_ymd(latest.get('expiresAt'))
            if exp_dt is not None:
                return 'ACTIVO' if exp_dt >= today else 'VENCIDO'
            return 'SIN_DATOS'

        return 'SIN_DATOS'

    def _build_public_vehicle_response(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Return only requested fields: vehicle info, full histories, and active/expired statuses."""
        if result.get('error'):
            return result

        vehicle = result.get('vehicleInfo') or {}
        soat_history = result.get('soatHistory') or []
        rtm_history = result.get('rtmHistory') or []

        # Remove verbose raw payload from history items for a cleaner API contract.
        clean_soat = []
        for row in soat_history:
            if not isinstance(row, dict):
                continue
            clean_soat.append({
                'policyNumber': row.get('policyNumber'),
                'insurer': row.get('insurer'),
                'status': row.get('status'),
                'issuanceStatus': row.get('issuanceStatus'),
                'origin': row.get('origin'),
                'tariffType': row.get('tariffType'),
                'issuedAt': row.get('issuedAt'),
                'startDate': row.get('startDate'),
                'endDate': row.get('endDate'),
            })

        clean_rtm = []
        for row in rtm_history:
            if not isinstance(row, dict):
                continue
            clean_rtm.append({
                'certificateNumber': row.get('certificateNumber'),
                'reviewType': row.get('reviewType'),
                'cda': row.get('cda'),
                'status': row.get('status'),
                'isCurrent': row.get('isCurrent'),
                'issuedAt': row.get('issuedAt'),
                'expiresAt': row.get('expiresAt'),
                'plate': row.get('plate'),
                'consistency': row.get('consistency'),
                'certificateUrl': row.get('certificateUrl'),
            })

        soat_latest = clean_soat[0] if clean_soat else None
        rtm_latest = clean_rtm[0] if clean_rtm else None

        soat_status = self._derive_history_status(soat_latest, 'soat')
        rtm_status = self._derive_history_status(rtm_latest, 'rtm')

        # Si ambos son SIN_DATOS, retornar error de no encontrado
        if soat_status == 'SIN_DATOS' and rtm_status == 'SIN_DATOS':
            return {
                'error': True,
                'code': 'VEHICLE_NOT_FOUND',
                'message': 'Vehículo no encontrado en RUNT',
            }

        return {
            'vehicleInfo': vehicle,
            'soatHistory': clean_soat,
            'rtmHistory': clean_rtm,
            'soatStatus': soat_status,
            'rtmStatus': rtm_status,
        }

    def _extract_normalized_histories_from_api_json(self, api_json: List[Tuple[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Extract and normalize complete SOAT/RTM histories from captured endpoints."""
        soat_rows: List[Dict[str, Any]] = []
        rtm_rows: List[Dict[str, Any]] = []

        for url, payload in api_json:
            u = (url or '').lower()

            # SOAT endpoint usually returns a list.
            if '/soat' in u:
                if isinstance(payload, list):
                    for row in payload:
                        if isinstance(row, dict):
                            soat_rows.append(row)
                elif isinstance(payload, dict):
                    # Some variants may wrap rows.
                    for k, v in payload.items():
                        if isinstance(v, list):
                            for row in v:
                                if isinstance(row, dict):
                                    soat_rows.append(row)

            # RTM endpoint usually returns {'revisiones': [...]}.
            if '/rtm' in u or 'tecnomecan' in u:
                if isinstance(payload, dict):
                    revs = payload.get('revisiones')
                    if isinstance(revs, list):
                        for row in revs:
                            if isinstance(row, dict):
                                rtm_rows.append(row)
                    elif isinstance(payload.get('rtm'), list):
                        for row in payload.get('rtm', []):
                            if isinstance(row, dict):
                                rtm_rows.append(row)

        normalized_soat: List[Dict[str, Any]] = []
        for row in soat_rows:
            normalized_soat.append({
                'policyNumber': row.get('numSoat'),
                'insurer': row.get('razonSocialAsegur'),
                'status': row.get('estado'),
                'issuanceStatus': row.get('estadoSoat'),
                'origin': row.get('origen'),
                'tariffType': row.get('tipoTarifa'),
                'issuedAt': self._to_date(row.get('fechaExpedicion') or row.get('fechaExpediSoat')),
                'startDate': self._to_date(row.get('fechaInicioPoliza')),
                'endDate': self._to_date(row.get('fechaVencimSoat')),
            })

        normalized_rtm: List[Dict[str, Any]] = []
        for row in rtm_rows:
            normalized_rtm.append({
                'certificateNumber': row.get('numeCerti'),
                'reviewType': row.get('tipoRevision'),
                'cda': row.get('nombreCda'),
                'status': row.get('estadoRvt'),
                'isCurrent': row.get('vigente'),
                'issuedAt': self._to_date(row.get('fechaExpedicionRvt')),
                'expiresAt': self._to_date(row.get('fechaVencimientoRvt')),
                'plate': row.get('numeroPlaca'),
                'consistency': row.get('informacionConsistente'),
                'certificateUrl': row.get('url'),
            })

        # Sort newest first by issued date.
        normalized_soat.sort(key=lambda x: x.get('issuedAt') or '', reverse=True)
        normalized_rtm.sort(key=lambda x: x.get('issuedAt') or '', reverse=True)

        return normalized_soat, normalized_rtm
    
    async def _verify_fresh(self, plate: str, document_type: str, document_number: str, captcha_text: str) -> dict:
        page = None
        try:
            page = await self._safe_new_page()
            
            await page.goto(self.runt_url, wait_until='domcontentloaded', timeout=20000)
            await self._wait_for_runt_form(page)

            try:
                await page.locator('input[formcontrolname="placa"]').fill(plate)
            except Exception:
                pass

            await page.wait_for_timeout(800)

            await self._select_document_type(page, document_type)
            await page.wait_for_timeout(400)

            try:
                await page.locator('input[formcontrolname="documento"]').fill(document_number)
            except Exception:
                pass

            await page.wait_for_timeout(800)

            if captcha_text:
                try:
                    await page.locator('input[formcontrolname="captcha"]').fill(captcha_text)
                except Exception:
                    pass
            
            await page.wait_for_timeout(500)
            
            submit = await page.query_selector('button:has-text("Consultar")')
            if not submit:
                submit = await page.query_selector('button[type="submit"]')
            
            if submit:
                await submit.click()
            
            # Esperar resultado
            try:
                await page.wait_for_load_state('networkidle', timeout=20000)
            except Exception:
                pass
            await page.wait_for_timeout(2500)

            result = await self._extract_result_from_page(page, plate)
            
            if page:
                await page.close()
            
            return result
            
        except Exception as e:
            logger.error("Verify error on fresh page: %s", e)
            if page:
                await page.close()
            return {
                'error': True,
                'code': 'RUNT_VERIFY_ERROR',
                'message': str(e)
            }

    async def _extract_result_from_page(self, page: Page, plate: str) -> dict:
        """Extrae resultados reales desde el DOM (best-effort)."""

        # 1) Validation/error handling
        try:
            errors = await page.evaluate(
                """() => Array.from(document.querySelectorAll('.mat-error, mat-error'))
                    .map(e => (e.innerText || '').trim())
                    .filter(Boolean)"""
            )
        except Exception:
            errors = []

        # Also look for snackbar messages
        try:
            snack = await page.evaluate(
                """() => {
                  const el = document.querySelector('snack-bar-container, mat-snack-bar-container');
                  return el && el.innerText ? el.innerText.trim() : '';
                }"""
            )
        except Exception:
            snack = ''

        if snack:
            errors = (errors or []) + [snack]

        if errors:
            msg = ' | '.join([e for e in errors if e])
            lower = self._norm(msg)
            code = 'RUNT_VALIDATION_ERROR'
            if 'captcha' in lower:
                code = 'RUNT_CAPTCHA_INVALID'
            return {
                'error': True,
                'code': code,
                'message': msg,
            }

        # 2) Collect ALL text content from page to debug
        try:
            page_content = await page.content()
            logger.debug("Page HTML length: %d", len(page_content))
        except:
            pass
        
        # 2) Collect key/value pairs from tables (most stable across UIs)
        try:
            pairs = await page.evaluate(
                """() => {
                  const out = [];
                  const tables = Array.from(document.querySelectorAll('table'));
                  for (const t of tables) {
                    for (const tr of Array.from(t.querySelectorAll('tr'))) {
                      const cells = Array.from(tr.querySelectorAll('th,td'))
                        .map(c => (c.innerText || '').trim())
                        .filter(Boolean);
                      if (cells.length === 2) {
                        out.push([cells[0], cells[1]]);
                      }
                    }
                  }

                  // Also get all text content with label:value patterns
                  const allText = document.body.innerText || '';
                  const lines = allText.split('\\n');
                  for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;
                    // Look for "Label: Value" patterns
                    const colonIdx = trimmed.indexOf(':');
                    if (colonIdx > 0 && colonIdx < 60) {
                      const label = trimmed.slice(0, colonIdx).trim();
                      const value = trimmed.slice(colonIdx + 1).trim();
                      if (label && value && value.length < 100) {
                        out.push([label, value]);
                      }
                    }
                  }

                  // Dedup by label
                  const seen = new Set();
                  const dedup = [];
                  for (const [k, v] of out) {
                    const key = (k || '').trim();
                    if (!key) continue;
                    if (seen.has(key)) continue;
                    seen.add(key);
                    dedup.push([key, v]);
                  }
                  return dedup;
                }"""
            )
        except Exception:
            pairs = []

        raw: Dict[str, str] = {str(k): str(v) for (k, v) in pairs} if pairs else {}

        # 3) Normalize into expected shape
        vehicle: Dict[str, Any] = {
            'plate': plate,
        }

        def get_any(keys):
            for k in keys:
                for rk, rv in raw.items():
                    if self._norm(k) == self._norm(rk) or self._norm(k) in self._norm(rk):
                        return rv
            return None

        tl = get_any(['Licencia de transito', 'No. licencia de transito', 'Numero licencia de transito'])
        if tl:
            vehicle['transitLicenseNumber'] = str(tl)

        st = get_any(['Tipo de servicio', 'Servicio'])
        if st:
            vehicle['serviceType'] = str(st)

        vc = get_any(['Clase de vehiculo', 'Clase'])
        if vc:
            vehicle['vehicleClass'] = str(vc)

        cl = get_any(['Clasificacion', 'Clasificación'])
        if cl:
            vehicle['classification'] = str(cl)

        br = get_any(['Marca'])
        if br:
            vehicle['brand'] = str(br)

        ln = get_any(['Linea', 'Línea'])
        if ln:
            vehicle['line'] = str(ln)
        model_year = get_any(['Modelo', 'Ano modelo', 'Año modelo'])
        if model_year:
            try:
                vehicle['modelYear'] = int(re.sub(r'[^0-9]', '', str(model_year))[:4])
            except Exception:
                vehicle['modelYear'] = str(model_year)

        col = get_any(['Color'])
        if col:
            vehicle['color'] = str(col)
        cc = get_any(['Cilindraje', 'Cilindrada'])
        if cc:
            try:
                vehicle['engineDisplacementCc'] = int(re.sub(r'[^0-9]', '', str(cc)))
            except Exception:
                vehicle['engineDisplacementCc'] = str(cc)

        ta = get_any(['Organismo de transito', 'Autoridad de transito', 'Organismo de tránsito'])
        if ta:
            vehicle['transitAuthority'] = str(ta)
        liens = get_any(['Gravamenes a la propiedad', 'Gravámenes a la propiedad', 'Gravamenes'])
        if liens:
            # normalize to SI/NO when possible
            ln = self._norm(str(liens))
            if 'si' == ln or ln.startswith('si'):
                vehicle['liensStatus'] = 'SI'
            elif 'no' == ln or ln.startswith('no'):
                vehicle['liensStatus'] = 'NO'
            else:
                vehicle['liensStatus'] = str(liens)

        # 4) SOAT/RTM extraction: best-effort from any raw keys containing terms
        soat = None
        rtm = None

        for rk, rv in raw.items():
            kn = self._norm(rk)
            if 'soat' in kn and soat is None:
                soat = {'status': str(rv).strip()}
            if ('rtm' in kn or 'tecnomecan' in kn) and rtm is None:
                rtm = {'status': str(rv).strip()}

        result = {
            'vehicleInfo': vehicle,
            'soatLatest': soat,
            'rtmLatest': rtm,
            # Debug payload for tracing changes in the portal
            'raw': raw,
        }

        # Check for RUNT-specific error messages before trying to extract vehicle data
        try:
            body = await page.inner_text('body')
        except Exception:
            body = ''
        
        bl = self._norm(body)
        
        # Map RUNT error patterns to standardized codes
        runt_error_patterns = [
            (r'no\s*corresponde\s*(?:con\s*)?(?:los\s*)?propietarios', 'OWNER_MISMATCH', 'Los datos del propietario no corresponden con los registrados para este vehículo'),
            (r'no\s*ha\s*sido\s*registrado\s*(?:en\s*)?el\s*sistema\s*runt', 'VEHICLE_NOT_REGISTERED', 'El vehículo no ha sido registrado en el sistema RUNT. Diríjase al organismo de tránsito donde está matriculado.'),
            (r'vehículo?\s*no\s*ha\s*sido\s*registrado', 'VEHICLE_NOT_REGISTERED', 'El vehículo no ha sido registrado en el sistema RUNT.'),
            (r'datos\s*no\s*corresponden', 'OWNER_MISMATCH', 'Los datos proporcionados no corresponden con los registrados para el vehículo'),
            (r'vehículo?\s*no\s*existe', 'VEHICLE_NOT_FOUND', 'Vehículo no encontrado en RUNT'),
            (r'placa\s*no\s*existe', 'VEHICLE_NOT_FOUND', 'La placa no existe en el sistema RUNT'),
            (r'no\s*se\s*encontro' r'\s*vehiculo', 'VEHICLE_NOT_FOUND', 'Vehículo no encontrado'),
            (r'error\s*en\s*los\s*datos', 'INVALID_DATA', 'Error en los datos ingresados'),
            (r'documento\s*incorrecto', 'INVALID_DATA', 'Número de documento incorrecto'),
            (r'placa\s*incorrecta', 'INVALID_DATA', 'Placa incorrecta'),
        ]

        for pattern, code, generic_msg in runt_error_patterns:
            if re.search(pattern, bl, re.IGNORECASE):
                logger.warning("RUNT error detected: code=%s, pattern=%s", code, pattern)
                return {
                    'error': True,
                    'code': code,
                    'message': generic_msg,
                    'originalMessage': body[:500],
                }

        # If we couldn't extract anything meaningful, return an explicit error.
        meaningful = any(
            vehicle.get(k) for k in ['brand', 'line', 'vehicleClass', 'classification', 'transitLicenseNumber']
        )
        if not meaningful:
            if 'no se encontro' in bl or 'no se encontr' in bl or 'no existe' in bl:
                return {
                    'error': True,
                    'code': 'VEHICLE_NOT_FOUND',
                    'message': 'Vehículo no encontrado en RUNT',
                    'originalMessage': body[:500],
                }

        return result
    
    def get_session(self, session_id: str) -> Optional[dict]:
        return _sessions_store.get(session_id)

    async def discard_session(self, session_id: str) -> None:
        data = _sessions_store.pop(session_id, None)
        if data and data.get('page'):
            try:
                await data['page'].close()
                logger.debug("Session discarded: %s", session_id[:8])
            except Exception as e:
                logger.warning("Error closing session page: %s", e)
    
    async def _get_soat_rtm_data(self, page: Page) -> dict:
        """Click on SOAT and RTM tabs and extract their data"""
        soat_result: Optional[Dict[str, Any]] = None
        rtm_result: Optional[Dict[str, Any]] = None
        
        try:
            await page.wait_for_timeout(2000)

            async def click_tab(tab_type: str) -> bool:
                names = ['SOAT'] if tab_type == 'soat' else ['RTM', 'TECNOMECANICA', 'TECNOMECÁNICA']
                for name in names:
                    # 1) Role-based locator (Angular Material tabs)
                    try:
                        role_tab = page.get_by_role('tab', name=re.compile(name, re.I))
                        if await role_tab.count() > 0:
                            await role_tab.first.click()
                            await page.wait_for_load_state('networkidle', timeout=10000)
                            await page.wait_for_timeout(1500)
                            return True
                    except Exception:
                        pass

                    # 2) Text locator fallback
                    try:
                        txt = page.get_by_text(re.compile(name, re.I))
                        if await txt.count() > 0:
                            await txt.first.click()
                            await page.wait_for_load_state('networkidle', timeout=10000)
                            await page.wait_for_timeout(1500)
                            return True
                    except Exception:
                        pass

                    # 3) CSS fallback
                    selectors = [
                        f'div[role="tab"]:has-text("{name}")',
                        f'.mat-tab-label:has-text("{name}")',
                        f'button:has-text("{name}")',
                        f'a:has-text("{name}")',
                    ]
                    for sel in selectors:
                        try:
                            node = page.locator(sel)
                            if await node.count() > 0:
                                await node.first.click()
                                await page.wait_for_load_state('networkidle', timeout=10000)
                                await page.wait_for_timeout(1500)
                                return True
                        except Exception:
                            continue
                return False

            # Click SOAT tab and extract
            soat_clicked = await click_tab('soat')
            if soat_clicked:
                pairs = await self._extract_key_value_pairs(page)
                soat_info: Dict[str, Any] = {}
                for key, value in pairs.items():
                    k_lower = key.lower()
                    if (
                        'poliza' in k_lower
                        or 'póliza' in k_lower
                        or 'entidad' in k_lower
                        or 'vigencia' in k_lower
                        or 'soat' in k_lower
                        or 'asegur' in k_lower
                        or 'estado' in k_lower
                    ):
                        soat_info[key] = value
                if soat_info:
                    soat_result = soat_info

            # Click RTM tab and extract
            rtm_clicked = await click_tab('rtm')
            if rtm_clicked:
                pairs = await self._extract_key_value_pairs(page)
                rtm_info: Dict[str, Any] = {}
                for key, value in pairs.items():
                    k_lower = key.lower()
                    if (
                        'certificado' in k_lower
                        or 'tecnomecanica' in k_lower
                        or 'tecnomecánica' in k_lower
                        or 'rtm' in k_lower
                        or 'revision' in k_lower
                        or 'revisión' in k_lower
                        or 'cda' in k_lower
                        or 'vigencia' in k_lower
                        or 'estado' in k_lower
                    ):
                        rtm_info[key] = value
                if rtm_info:
                    rtm_result = rtm_info
                 
        except Exception:
            pass
        
        return {'soat': soat_result, 'rtm': rtm_result}
    
    async def _extract_key_value_pairs(self, page: Page) -> dict:
        """Extract all key-value pairs from the page"""
        try:
            pairs = await page.evaluate('''() => {
                const out = {};
                const keywords = ['poliza', 'vigencia', 'entidad', 'estado', 'fecha', 'certificado', 'tipo', 'cda', 'revision', 'expedicion', 'tecnomecanica', 'soat', 'rtm'];
                
                // Get from tables
                const tables = Array.from(document.querySelectorAll('table'));
                for (const t of tables) {
                    for (const tr of Array.from(t.querySelectorAll('tr'))) {
                        const cells = Array.from(tr.querySelectorAll('th, td'))
                            .map(c => (c.innerText || '').trim())
                            .filter(Boolean);
                        if (cells.length >= 2) {
                            const label = cells[0].trim();
                            const value = cells[1].trim();
                            const lower = label.toLowerCase();
                            if (keywords.some(k => lower.includes(k))) {
                                out[label] = value;
                            }
                        }
                    }
                }
                
                // Get from divs/spans with colons
                const allEls = Array.from(document.querySelectorAll('div, span, p, label, strong'));
                for (const el of allEls) {
                    const txt = (el.innerText || '').trim();
                    if (!txt) continue;
                    const idx = txt.indexOf(':');
                    if (idx > 3 && idx < 60) {
                        const label = txt.slice(0, idx).trim();
                        const value = txt.slice(idx + 1).trim();
                        const lower = label.toLowerCase();
                        if (keywords.some(k => lower.includes(k)) && value) {
                            out[label] = value;
                        }
                    }
                }
                
                return out;
            }''')
            return pairs if pairs else {}
        except Exception:
            return {}
    
    async def cleanup_expired_sessions(self, ttl_seconds: int = 180):
        now = datetime.now()
        expired = [
            sid for sid, data in _sessions_store.items()
            if (now - data['created_at']).total_seconds() > ttl_seconds
        ]
        for sid in expired:
            data = _sessions_store.pop(sid, None)
            if data and data.get('page'):
                try:
                    await data['page'].close()
                except:
                    pass
    
    async def close(self):
        if self.browser:
            try:
                await self.browser.close()
            except:
                pass
        if self.playwright:
            try:
                await self.playwright.stop()
            except:
                pass
