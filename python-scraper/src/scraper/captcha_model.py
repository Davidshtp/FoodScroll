from __future__ import annotations

import io
import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Tuple

import numpy as np
import paddle
import paddle.nn as nn
from PIL import Image


CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
MIN_LEN = 4
MAX_LEN = 7
PAD_TOKEN = '<PAD>'


def default_model_dir() -> Path:
    return Path(os.getenv('CAPTCHA_MODEL_DIR', 'models/captcha_seq'))


def normalize_image(image: Image.Image, width: int = 192, height: int = 64) -> np.ndarray:
    gray = image.convert('L').resize((width, height), Image.BILINEAR)
    arr = np.array(gray).astype('float32') / 255.0
    arr = (arr - 0.5) / 0.5
    return arr[None, :, :]


class CaptchaSeqModel(nn.Layer):
    def __init__(self, num_chars: int, max_len: int, len_classes: int):
        super().__init__()
        self.max_len = max_len
        self.num_chars = num_chars
        self.features = nn.Sequential(
            nn.Conv2D(1, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2D(kernel_size=2, stride=2),
            nn.Conv2D(32, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2D(kernel_size=2, stride=2),
            nn.Conv2D(64, 128, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2D(kernel_size=2, stride=2),
        )
        # Input 1x64x192 -> 128x8x24
        self.backbone = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * 8 * 24, 512),
            nn.ReLU(),
            nn.Dropout(0.2),
        )
        self.char_head = nn.Linear(512, max_len * num_chars)
        self.len_head = nn.Linear(512, len_classes)

    def forward(self, x):
        x = self.features(x)
        x = self.backbone(x)
        char_logits = self.char_head(x)
        char_logits = paddle.reshape(char_logits, [-1, self.max_len, self.num_chars])
        len_logits = self.len_head(x)
        return char_logits, len_logits


@dataclass
class CaptchaSeqPredictor:
    model: CaptchaSeqModel
    charset: str
    min_len: int
    max_len: int
    pad_index: int

    @classmethod
    def load(cls, model_dir: Path) -> Optional['CaptchaSeqPredictor']:
        meta_path = model_dir / 'meta.json'
        params_path = model_dir / 'model.pdparams'
        if not meta_path.exists() or not params_path.exists():
            return None

        meta = json.loads(meta_path.read_text(encoding='utf-8'))
        charset = meta['charset']
        min_len = int(meta['min_len'])
        max_len = int(meta['max_len'])
        pad_index = int(meta['pad_index'])
        len_classes = int(meta['len_classes'])

        model = CaptchaSeqModel(num_chars=len(charset) + 1, max_len=max_len, len_classes=len_classes)
        state = paddle.load(str(params_path))
        model.set_state_dict(state)
        model.eval()
        return cls(model=model, charset=charset, min_len=min_len, max_len=max_len, pad_index=pad_index)

    def predict(self, image_bytes: bytes) -> Tuple[str, float]:
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        arr = normalize_image(image)
        x = paddle.to_tensor(arr[None, ...], dtype='float32')
        with paddle.no_grad():
            char_logits, len_logits = self.model(x)
            char_probs = paddle.nn.functional.softmax(char_logits, axis=-1)
            len_probs = paddle.nn.functional.softmax(len_logits, axis=-1)

        char_probs_np = char_probs.numpy()[0]
        len_probs_np = len_probs.numpy()[0]
        len_idx = int(np.argmax(len_probs_np))
        pred_len = self.min_len + len_idx

        out = []
        conf_values = [float(len_probs_np[len_idx])]
        for i in range(self.max_len):
            row = char_probs_np[i]
            idx = int(np.argmax(row))
            conf_values.append(float(row[idx]))
            if i >= pred_len:
                continue
            if idx == self.pad_index:
                continue
            if idx < len(self.charset):
                out.append(self.charset[idx])

        text = ''.join(out)
        if not (self.min_len <= len(text) <= self.max_len):
            return '', 0.0
        conf = float(np.mean(conf_values)) if conf_values else 0.0
        return text, conf
