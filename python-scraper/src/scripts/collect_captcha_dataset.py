from __future__ import annotations

import argparse
import base64
import csv
import os
import time
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
    if not text:
        return False
    if not (4 <= len(text) <= 7):
        return False
    return text.isalnum()


def main() -> int:
    load_dotenv()

    parser = argparse.ArgumentParser(description='Collect and label real RUNT captchas for model training.')
    parser.add_argument('--base-url', default='http://localhost:5001', help='Microservice base URL.')
    parser.add_argument('--count', type=int, default=100, help='Number of captchas to collect.')
    parser.add_argument('--delay-ms', type=int, default=500, help='Delay between requests in milliseconds.')
    parser.add_argument('--jwt-secret', default=os.getenv('JWT_SECRET_KEY', ''), help='JWT secret.')
    parser.add_argument('--service-secret', default=os.getenv('SERVICE_SECRET', ''), help='x-service-secret value.')
    parser.add_argument('--sub', default='captcha-dataset-bot', help='JWT sub claim.')
    parser.add_argument('--role', default='service', help='JWT role claim.')
    parser.add_argument('--client', default='captcha-collector', help='JWT client claim.')
    parser.add_argument('--ttl-minutes', type=int, default=120, help='JWT validity minutes.')
    parser.add_argument(
        '--out-dir',
        default='data/captcha_dataset/images',
        help='Where captcha images are stored.',
    )
    parser.add_argument(
        '--labels-csv',
        default='data/captcha_dataset/labels.csv',
        help='CSV where labels are appended.',
    )
    parser.add_argument('--label', action='store_true', help='Prompt label input after each captcha.')
    parser.add_argument('--open-image', action='store_true', help='Open each captcha image in default viewer.')
    args = parser.parse_args()

    if args.count <= 0:
        print('ERROR: --count must be >= 1')
        return 2
    if not args.jwt_secret or not args.service_secret:
        print('ERROR: JWT secret or service secret missing.')
        return 2

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    labels_path = Path(args.labels_csv)
    labels_path.parent.mkdir(parents=True, exist_ok=True)
    write_header = not labels_path.exists()

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

    collected = 0
    failures = 0

    with labels_path.open('a', encoding='utf-8', newline='') as csv_file:
        writer = csv.DictWriter(
            csv_file,
            fieldnames=['filename', 'label', 'session_id_masked', 'collected_at_iso'],
        )
        if write_header:
            writer.writeheader()

        for i in range(1, args.count + 1):
            try:
                resp = requests.post(f"{args.base_url.rstrip('/')}/runt/sessions", headers=headers, timeout=90)
                if resp.status_code >= 400:
                    failures += 1
                    print(f'[{i}/{args.count}] session error: status={resp.status_code} body={resp.text[:200]}')
                    time.sleep(max(args.delay_ms, 0) / 1000)
                    continue

                data = resp.json()
                sid = (data.get('sessionId') or '').strip()
                captcha_b64 = (data.get('captchaPngBase64') or '').strip()
                if not captcha_b64:
                    failures += 1
                    print(f'[{i}/{args.count}] no captcha returned (sid={mask_session_id(sid)})')
                    time.sleep(max(args.delay_ms, 0) / 1000)
                    continue

                filename = f'{datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")}_{uuid.uuid4().hex[:10]}.png'
                image_path = out_dir / filename
                image_path.write_bytes(base64.b64decode(captcha_b64))

                label = ''
                if args.open_image:
                    try:
                        os.startfile(str(image_path))  # type: ignore[attr-defined]
                    except Exception:
                        pass

                if args.label:
                    while True:
                        raw = input(
                            f'[{i}/{args.count}] sid={mask_session_id(sid)} label captcha '
                            f'({image_path}) or ENTER to skip: '
                        ).strip()
                        if raw == '':
                            break
                        if valid_label(raw):
                            label = raw
                            break
                        print('Invalid label. Use 4-7 alphanumeric chars (case-sensitive).')
                else:
                    print(f'[{i}/{args.count}] saved: {image_path} sid={mask_session_id(sid)}')

                writer.writerow(
                    {
                        'filename': filename,
                        'label': label,
                        'session_id_masked': mask_session_id(sid),
                        'collected_at_iso': datetime.now(timezone.utc).isoformat(),
                    }
                )
                csv_file.flush()

                try:
                    requests.delete(f"{args.base_url.rstrip('/')}/runt/sessions/{sid}", headers=headers, timeout=20)
                except Exception:
                    pass

                collected += 1
                time.sleep(max(args.delay_ms, 0) / 1000)
            except KeyboardInterrupt:
                print('\nInterrupted by user.')
                break
            except Exception as exc:
                failures += 1
                print(f'[{i}/{args.count}] error: {exc}')
                time.sleep(max(args.delay_ms, 0) / 1000)

    print('\nDone')
    print(f'Collected: {collected}')
    print(f'Failures: {failures}')
    print(f'Images: {out_dir}')
    print(f'Labels: {labels_path}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
