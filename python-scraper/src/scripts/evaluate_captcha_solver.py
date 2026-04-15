from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.scraper.captcha_solver import CaptchaSolver


def load_labeled_rows(labels_csv: Path):
    rows = []
    with labels_csv.open('r', encoding='utf-8', newline='') as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            label = (row.get('label') or '').strip()
            filename = (row.get('filename') or '').strip()
            if label and filename:
                rows.append((filename, label))
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(description='Evaluate current captcha solver against labeled dataset.')
    parser.add_argument('--images-dir', default='data/captcha_dataset/images', help='Captcha image directory.')
    parser.add_argument('--labels-csv', default='data/captcha_dataset/labels.csv', help='Labels CSV path.')
    parser.add_argument('--limit', type=int, default=0, help='Optional limit (0 = all).')
    args = parser.parse_args()

    images_dir = Path(args.images_dir)
    labels_csv = Path(args.labels_csv)
    if not images_dir.exists():
        print(f'ERROR: images dir not found: {images_dir}')
        return 2
    if not labels_csv.exists():
        print(f'ERROR: labels CSV not found: {labels_csv}')
        return 2

    rows = load_labeled_rows(labels_csv)
    if args.limit > 0:
        rows = rows[: args.limit]
    if not rows:
        print('No labeled rows found.')
        return 1

    solver = CaptchaSolver()
    total = 0
    full_correct = 0
    char_total = 0
    char_correct = 0

    for filename, label in rows:
        image_path = images_dir / filename
        if not image_path.exists():
            continue
        total += 1
        pred, conf = solver.solve_with_confidence(image_path.read_bytes())
        if pred == label:
            full_correct += 1

        min_len = min(len(pred), len(label))
        for i in range(min_len):
            if pred[i] == label[i]:
                char_correct += 1
        char_total += len(label)

        print(f'{filename} expected={label} predicted={pred} conf={conf:.4f}')

    if total == 0:
        print('No evaluable samples (missing files).')
        return 1

    full_acc = (full_correct / total) * 100
    char_acc = (char_correct / char_total) * 100 if char_total > 0 else 0.0

    print('\n=== Metrics ===')
    print(f'Samples: {total}')
    print(f'Captcha exact accuracy: {full_acc:.2f}%')
    print(f'Character accuracy: {char_acc:.2f}%')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
