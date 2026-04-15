from __future__ import annotations

import json
import sys

from src.scraper.license_ocr import LicenseOCR


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'missing image path', 'needsManualInput': True}))
        return 2

    image_path = sys.argv[1]
    with open(image_path, 'rb') as fh:
        image_bytes = fh.read()

    result = LicenseOCR().parse(image_bytes)
    print(json.dumps(result, ensure_ascii=True))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
