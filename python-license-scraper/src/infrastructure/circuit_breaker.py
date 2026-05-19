from __future__ import annotations
import os
import time
from enum import Enum
from typing import Any, Callable, Optional
from src.infrastructure.logging import get_logger
logger = get_logger(__name__)

class CircuitState(str, Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"


class CircuitBreakerOpenError(Exception):
    def __init__(self, service_name: str, retry_after: float):
        self.service_name = service_name
        self.retry_after = retry_after
        super().__init__(
            f"Circuit breaker OPEN for {service_name}. Retry after {retry_after:.1f}s"
        )


class CircuitBreaker:
    def __init__(
        self,
        service_name: str = "runt",
        max_fails: int = 5,
        recover_timeout: int = 60,
    ):
        self.service_name = service_name
        self.max_fails = max_fails
        self.recover_timeout = recover_timeout
        self._state = CircuitState.CLOSED
        self._fail_count = 0
        self._last_failure_time: Optional[float] = None
        logger.info(
            "Circuit breaker initialized: service=%s, max_fails=%d, recover=%ds",
            service_name, max_fails, recover_timeout,
        )

    @property
    def state(self) -> CircuitState:
        return self._state

    @property
    def fail_count(self) -> int:
        return self._fail_count

    def is_available(self) -> bool:
        if self._state == CircuitState.CLOSED:
            return True
        return self._cooldown_elapsed()

    def _cooldown_elapsed(self) -> bool:
        if self._last_failure_time is None:
            return True
        elapsed = time.time() - self._last_failure_time
        return elapsed >= self.recover_timeout

    def _get_retry_after(self) -> float:
        if self._last_failure_time is None:
            return float(self.recover_timeout)
        elapsed = time.time() - self._last_failure_time
        remaining = self.recover_timeout - elapsed
        return max(0.0, remaining)

    def _record_success(self) -> None:
        self._state = CircuitState.CLOSED
        self._fail_count = 0
        self._last_failure_time = None

    def _record_failure(self) -> None:
        self._fail_count += 1
        self._last_failure_time = time.time()
        if self._fail_count >= self.max_fails and self._state != CircuitState.OPEN:
            logger.warning(
                "Circuit breaker OPEN: %s failed %d consecutive times",
                self.service_name, self._fail_count,
            )
            self._state = CircuitState.OPEN

    async def call_async(self, func: Callable, *args, **kwargs) -> Any:
        if not self.is_available():
            retry_after = self._get_retry_after()
            logger.warning(
                "Circuit breaker OPEN: rejecting async call to %s, retry after %.1fs",
                self.service_name, retry_after,
            )
            raise CircuitBreakerOpenError(self.service_name, retry_after)
        try:
            result = await func(*args, **kwargs)
            self._record_success()
            return result
        except Exception as e:
            self._record_failure()
            raise

def create_circuit_breaker() -> CircuitBreaker:
    return CircuitBreaker(
        service_name="runt",
        max_fails=int(os.getenv('CIRCUIT_BREAKER_MAX_FAILS', '5')),
        recover_timeout=int(os.getenv('CIRCUIT_BREAKER_RECOVER_SECONDS', '60')),
    )
