FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True \
    PADDLE_PDX_EAGER_INIT=False \
    PLAYWRIGHT_BROWSERS_PATH=/opt/playwright-browsers \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    wget \
    libgomp1 \
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libatspi2.0-0 \
    libwayland-client0 \
    libwayland-egl1 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir paddlepaddle==3.2.2 paddleocr==3.4.0

COPY python-license-scraper/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN python -m playwright install chromium --with-deps

COPY python-license-scraper/ .

RUN useradd -m -r appuser && chown -R appuser:appuser /app

USER appuser

EXPOSE 5592

CMD ["python", "main.py"]
