from __future__ import annotations

import io
import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple

import numpy as np
import paddle
import paddle.nn as nn
from PIL import Image


CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
CAPTCHA_LEN = 5


def default_char_model_dir() -> Path:
    return Path(os.getenv('CAPTCHA_CHAR_MODEL_DIR', 'models/captcha_char'))


def _to_gray_array(image: Image.Image) -> np.ndarray:
    return np.array(image.convert('L')).astype(np.uint8)


def _crop_text_band(gray: np.ndarray) -> np.ndarray:
    mask = gray < 180
    ys = np.where(mask.sum(axis=1) > max(2, int(gray.shape[1] * 0.02)))[0]
    xs = np.where(mask.sum(axis=0) > max(2, int(gray.shape[0] * 0.02)))[0]
    if len(ys) == 0 or len(xs) == 0:
        return gray

    y0, y1 = max(int(ys[0]) - 4, 0), min(int(ys[-1]) + 5, gray.shape[0])
    x0, x1 = max(int(xs[0]) - 4, 0), min(int(xs[-1]) + 5, gray.shape[1])
    band = gray[y0:y1, x0:x1]
    return band if band.size else gray


def segment_captcha_chars(image: Image.Image, n_chars: int = CAPTCHA_LEN) -> List[np.ndarray]:
    gray = _to_gray_array(image)
    band = _crop_text_band(gray)
    h, w = band.shape
    if w < n_chars:
        return [band for _ in range(n_chars)]

    step = w / n_chars
    chunks: List[np.ndarray] = []
    for i in range(n_chars):
        x0 = int(round(i * step))
        x1 = int(round((i + 1) * step))
        x0 = max(0, min(x0, w - 1))
        x1 = max(x0 + 1, min(x1, w))
        chunk = band[:, x0:x1]
        if chunk.size == 0:
            chunk = band
        chunks.append(chunk)
    return chunks


def preprocess_char(chunk: np.ndarray, out_size: int = 32) -> np.ndarray:
    if chunk.dtype != np.uint8:
        chunk = chunk.astype(np.uint8)
    img = Image.fromarray(chunk)
    img = img.resize((out_size, out_size), Image.BILINEAR)
    arr = np.array(img).astype('float32') / 255.0
    arr = (arr - 0.5) / 0.5
    return arr[None, :, :]


class CharCnn(nn.Layer):
    def __init__(self, num_classes: int):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2D(1, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2D(2),
            nn.Conv2D(32, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2D(2),
            nn.Conv2D(64, 128, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2D(2),
            nn.Flatten(),
            nn.Linear(128 * 4 * 4, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, num_classes),
        )

    def forward(self, x):
        return self.net(x)


@dataclass
class CaptchaCharPredictor:
    model: CharCnn
    charset: str
    captcha_len: int

    @classmethod
    def load(cls, model_dir: Path) -> Optional['CaptchaCharPredictor']:
        meta_path = model_dir / 'meta.json'
        params_path = model_dir / 'model.pdparams'
        if not meta_path.exists() or not params_path.exists():
            return None

        meta = json.loads(meta_path.read_text(encoding='utf-8'))
        charset = str(meta.get('charset', CHARSET))
        captcha_len = int(meta.get('captcha_len', CAPTCHA_LEN))

        model = CharCnn(num_classes=len(charset))
        state = paddle.load(str(params_path))
        model.set_state_dict(state)
        model.eval()
        return cls(model=model, charset=charset, captcha_len=captcha_len)

    def predict(self, image_bytes: bytes) -> Tuple[str, float]:
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        chunks = segment_captcha_chars(image, self.captcha_len)
        xs = np.stack([preprocess_char(c) for c in chunks]).astype('float32')
        x = paddle.to_tensor(xs)
        with paddle.no_grad():
            logits = self.model(x)
            probs = paddle.nn.functional.softmax(logits, axis=-1).numpy()

        out: List[str] = []
        confs: List[float] = []
        for p in probs:
            idx = int(np.argmax(p))
            out.append(self.charset[idx])
            confs.append(float(p[idx]))

        text = ''.join(out)
        conf = float(np.mean(confs)) if confs else 0.0
        return text, conf
