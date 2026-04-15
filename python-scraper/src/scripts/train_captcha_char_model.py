from __future__ import annotations

import argparse
import csv
import json
import random
import sys
from pathlib import Path
from typing import List, Tuple

import numpy as np
import paddle
import paddle.nn.functional as F
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.scraper.captcha_char_model import (  # noqa: E402
    CAPTCHA_LEN,
    CHARSET,
    CharCnn,
    preprocess_char,
    segment_captcha_chars,
)


def load_labeled_samples(images_dir: Path, labels_csv: Path) -> List[Tuple[Path, str]]:
    out: List[Tuple[Path, str]] = []
    with labels_csv.open('r', encoding='utf-8', newline='') as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            fn = (row.get('filename') or '').strip()
            label = (row.get('label') or '').strip()
            if not fn or not label:
                continue
            if len(label) != CAPTCHA_LEN or not label.isalnum():
                continue
            p = images_dir / fn
            if not p.exists():
                continue
            out.append((p, label))
    return out


def expand_char_dataset(samples: List[Tuple[Path, str]], char_to_idx: dict) -> List[Tuple[np.ndarray, int]]:
    out: List[Tuple[np.ndarray, int]] = []
    for image_path, label in samples:
        image = Image.open(image_path).convert('RGB')
        chunks = segment_captcha_chars(image, CAPTCHA_LEN)
        if len(chunks) != CAPTCHA_LEN:
            continue
        for idx, chunk in enumerate(chunks):
            ch = label[idx]
            if ch not in char_to_idx:
                continue
            x = preprocess_char(chunk)
            y = char_to_idx[ch]
            out.append((x, y))
    return out


def make_batch(items: List[Tuple[np.ndarray, int]]):
    xs = np.stack([x for x, _y in items]).astype('float32')
    ys = np.array([y for _x, y in items], dtype='int64')
    return paddle.to_tensor(xs), paddle.to_tensor(ys)


def evaluate(model: CharCnn, data: List[Tuple[np.ndarray, int]], batch_size: int) -> float:
    if not data:
        return 0.0
    model.eval()
    correct = 0
    total = 0
    for i in range(0, len(data), batch_size):
        b = data[i : i + batch_size]
        x, y = make_batch(b)
        with paddle.no_grad():
            logits = model(x)
            pred = paddle.argmax(logits, axis=1)
        correct += int((pred == y).astype('int32').sum().numpy())
        total += len(b)
    return correct / max(total, 1)


def main() -> int:
    parser = argparse.ArgumentParser(description='Train character-wise captcha model (fast and robust).')
    parser.add_argument('--images-dir', default='data/captcha_dataset/images')
    parser.add_argument('--labels-csv', default='data/captcha_dataset/labels.csv')
    parser.add_argument('--out-dir', default='models/captcha_char')
    parser.add_argument('--epochs', type=int, default=20)
    parser.add_argument('--batch-size', type=int, default=64)
    parser.add_argument('--lr', type=float, default=8e-4)
    parser.add_argument('--val-ratio', type=float, default=0.2)
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--min-captchas', type=int, default=80)
    args = parser.parse_args()

    random.seed(args.seed)
    np.random.seed(args.seed)
    paddle.seed(args.seed)

    images_dir = Path(args.images_dir)
    labels_csv = Path(args.labels_csv)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    if not images_dir.exists() or not labels_csv.exists():
        print('ERROR: dataset not found')
        return 2

    captcha_samples = load_labeled_samples(images_dir, labels_csv)
    if len(captcha_samples) < max(args.min_captchas, 1):
        print(f'ERROR: need at least {args.min_captchas} labeled captchas, got {len(captcha_samples)}')
        return 2

    random.shuffle(captcha_samples)
    split = int(len(captcha_samples) * (1.0 - args.val_ratio))
    train_caps = captcha_samples[:split]
    val_caps = captcha_samples[split:]

    char_to_idx = {c: i for i, c in enumerate(CHARSET)}
    train_data = expand_char_dataset(train_caps, char_to_idx)
    val_data = expand_char_dataset(val_caps, char_to_idx)

    model = CharCnn(num_classes=len(CHARSET))
    optimizer = paddle.optimizer.Adam(learning_rate=args.lr, parameters=model.parameters())

    best_val = -1.0
    for epoch in range(1, args.epochs + 1):
        model.train()
        random.shuffle(train_data)
        loss_sum = 0.0
        n_batches = 0

        for i in range(0, len(train_data), args.batch_size):
            b = train_data[i : i + args.batch_size]
            x, y = make_batch(b)
            logits = model(x)
            loss = F.cross_entropy(logits, y)
            loss.backward()
            optimizer.step()
            optimizer.clear_grad()
            loss_sum += float(loss.numpy())
            n_batches += 1

        train_acc = evaluate(model, train_data[: min(len(train_data), 5000)], args.batch_size)
        val_acc = evaluate(model, val_data, args.batch_size)
        avg_loss = loss_sum / max(n_batches, 1)
        print(f'Epoch {epoch:02d} loss={avg_loss:.4f} train_char_acc={train_acc:.4f} val_char_acc={val_acc:.4f}')

        if val_acc > best_val:
            best_val = val_acc
            paddle.save(model.state_dict(), str(out_dir / 'model.pdparams'))
            meta = {
                'charset': CHARSET,
                'captcha_len': CAPTCHA_LEN,
                'best_val_char_acc': best_val,
            }
            (out_dir / 'meta.json').write_text(json.dumps(meta, indent=2), encoding='utf-8')

    print(f'Best val char accuracy: {best_val:.4f}')
    print(f'Model saved to: {out_dir}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
