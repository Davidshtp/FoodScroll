import logging
import sys
from typing import Optional

_LOGGER_INITIALIZED = False


def setup_logging(level: Optional[str] = None) -> None:
    """Configura logging global para la aplicación."""
    global _LOGGER_INITIALIZED
    if _LOGGER_INITIALIZED:
        return
    log_level = (level or 'INFO').upper()
    numeric_level = getattr(logging, log_level, logging.INFO)
    formatter = logging.Formatter(
        fmt='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('asyncio').setLevel(logging.WARNING)
    logging.getLogger('playwright').setLevel(logging.WARNING)
    _LOGGER_INITIALIZED = True


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
