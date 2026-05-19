import os
from dotenv import load_dotenv

# Cargar variables de entorno ANTES de cualquier import de src.*
load_dotenv()

os.environ.setdefault('PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK', 'True')
os.environ.setdefault('PADDLE_PDX_EAGER_INIT', 'False')

import uvicorn  # noqa: E402
from src.app import app  # noqa: E402

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=int(os.getenv('SERVER_PORT', '5592')))
