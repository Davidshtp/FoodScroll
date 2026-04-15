import os
import uvicorn
from src.app import app


if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=int(os.getenv('SERVER_PORT', '5591')))
