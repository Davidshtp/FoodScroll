from __future__ import annotations

import argparse
import base64
import csv
import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
import requests
from dotenv import load_dotenv


def build_token(jwt_secret: str, sub: str, role: str, client: str, ttl_minutes: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        'sub': sub,
        'role': role,
        'client': client,
        'type': 'access',
        'iat': int(now.timestamp()),
        'exp': int((now + timedelta(minutes=ttl_minutes)).timestamp()),
    }
    token = jwt.encode(payload, jwt_secret, algorithm='HS256')
    if isinstance(token, bytes):
        return token.decode('utf-8')
    return token


def mask_session_id(session_id: str) -> str:
    sid = (session_id or '').strip()
    if len(sid) < 8:
        return '***'
    return f'{sid[:4]}***{sid[-4:]}'


def valid_label(text: str) -> bool:
    return 4 <= len(text) <= 7 and text.isalnum()


def main() -> int:
    load_dotenv()

    parser = argparse.ArgumentParser(description='Interactive live captcha label loop (session-by-session).')
    parser.add_argument('--base-url', default='http://localhost:5001', help='API base URL')
    parser.add_argument('--jwt-secret', default=os.getenv('JWT_SECRET_KEY', ''), help='JWT secret')
    parser.add_argument('--service-secret', default=os.getenv('SERVICE_SECRET', ''), help='x-service-secret')
    parser.add_argument('--sub', default='captcha-live-bot', help='JWT sub claim')
    parser.add_argument('--role', default='service', help='JWT role claim')
    parser.add_argument('--client', default='captcha-live-labeler', help='JWT client claim')
    parser.add_argument('--ttl-minutes', type=int, default=120, help='JWT ttl minutes')
    parser.add_argument('--images-dir', default='data/captcha_dataset/images', help='Image output folder')
    parser.add_argument('--labels-csv', default='data/captcha_dataset/labels.csv', help='Labels CSV')
    parser.add_argument('--open-image', action='store_true', help='Open each image in default viewer')
    parser.add_argument('--max-errors', type=int, default=10, help='Stop after N consecutive request errors')
    args = parser.parse_args()

    if not args.jwt_secret or not args.service_secret:
        print('ERROR: Missing JWT_SECRET_KEY or SERVICE_SECRET.')
        return 2

    images_dir = Path(args.images_dir)
    labels_csv = Path(args.labels_csv)
    images_dir.mkdir(parents=True, exist_ok=True)
    labels_csv.parent.mkdir(parents=True, exist_ok=True)

    write_header = not labels_csv.exists()

    token = build_token(
        jwt_secret=args.jwt_secret,
        sub=args.sub,
        role=args.role,
        client=args.client,
        ttl_minutes=args.ttl_minutes,
    )
    headers = {
        'Authorization': f'Bearer {token}',
        'x-service-secret': args.service_secret,
    }

    print('Live loop started. Commands:')
    print("- write captcha text to save")
    print("- 's' to skip")
    print("- 'q' to quit")

    saved = 0
    skipped = 0
    failures = 0
    consecutive_errors = 0

    with labels_csv.open('a', encoding='utf-8', newline='') as fh:
        writer = csv.DictWriter(
            fh,
            fieldnames=['filename', 'label', 'session_id_masked', 'collected_at_iso'],
        )
        if write_header:
            writer.writeheader()

        while True:
            try:
                resp = requests.post(f"{args.base_url.rstrip('/')}/runt/sessions", headers=headers, timeout=90)
            except KeyboardInterrupt:
                print('\nInterrupted by user.')
                break
            except Exception as exc:
                failures += 1
                consecutive_errors += 1
                print(f'ERROR creating session: {exc}')
                if consecutive_errors >= max(args.max_errors, 1):
                    print('Too many consecutive errors. Check that API is running with latest code.')
                    break
                continue

            if resp.status_code >= 400:
                failures += 1
                consecutive_errors += 1
                print(f'Session error: status={resp.status_code} body={resp.text[:200]}')
                if consecutive_errors >= max(args.max_errors, 1):
                    print('Too many consecutive errors. Check that API is running with latest code.')
                    break
                continue

            consecutive_errors = 0

            data = resp.json()
            sid = (data.get('sessionId') or '').strip()
            b64 = (data.get('captchaPngBase64') or '').strip()
            if not sid or not b64:
                failures += 1
                print(f'Invalid session/captcha. sid={mask_session_id(sid)}')
                continue

            filename = f"{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')}_{uuid.uuid4().hex[:10]}.png"
            image_path = images_dir / filename
            image_path.write_bytes(base64.b64decode(b64))

            if args.open_image:
                try:
                    os.startfile(str(image_path))  # type: ignore[attr-defined]
                except Exception:
                    pass

            print(f'Open this file: {image_path.resolve()}')

            print(f'Captcha: {image_path} (sid={mask_session_id(sid)})')
            raw = input('Label [text/s/q]: ').strip()
            if raw.lower() == 'q':
                break
            if raw.lower() == 's' or raw == '':
                try:
                    requests.delete(f"{args.base_url.rstrip('/')}/runt/sessions/{sid}", headers=headers, timeout=20)
                except Exception:
                    pass
                skipped += 1
                continue
            if not valid_label(raw):
                print('Invalid label, must be 4-7 alphanumeric chars. Skipped.')
                try:
                    requests.delete(f"{args.base_url.rstrip('/')}/runt/sessions/{sid}", headers=headers, timeout=20)
                except Exception:
                    pass
                skipped += 1
                continue

            writer.writerow(
                {
                    'filename': filename,
                    'label': raw,
                    'session_id_masked': mask_session_id(sid),
                    'collected_at_iso': datetime.now(timezone.utc).isoformat(),
                }
            )
            fh.flush()

            try:
                requests.delete(f"{args.base_url.rstrip('/')}/runt/sessions/{sid}", headers=headers, timeout=20)
            except Exception:
                pass

            saved += 1
            print(f'Saved ({saved})')

    print('\nFinished.')
    print(f'Saved: {saved}')
    print(f'Skipped: {skipped}')
    print(f'Failures: {failures}')
    print(f'CSV: {labels_csv}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
