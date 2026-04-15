from __future__ import annotations

import os
import time
import asyncio
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, Optional

from src.infrastructure.logging import get_logger

logger = get_logger(__name__)


class CircuitState(str, Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


class CircuitBreakerOpenError(Exception):
    def __init__(self, service_name: str, retry_after: float):
        self.service_name = service_name
        self.retry_after = retry_after
        super().__init__(
            f"Circuit breaker OPEN for {service_name}. Retry after {retry_after:.1f}s"
        )


class CircuitBreaker:
    """
    Circuit breaker implementation to prevent cascading failures
    when the external RUNT service is unavailable.
    
    States:
    - CLOSED: Normal operation, requests pass through
    - OPEN: Service is down, fail fast without calling
    - HALF_OPEN: Testing if service recovered
    """
    
    def __init__(
        self,
        service_name: str = "runt",
        max_fails: int = 5,
        timeout_seconds: int = 30,
        recover_timeout: int = 60,
    ):
        self.service_name = service_name
        self.max_fails = max_fails
        self.timeout_seconds = timeout_seconds
        self.recover_timeout = recover_timeout
        
        self._state = CircuitState.CLOSED
        self._fail_count = 0
        self._last_failure_time: Optional[float] = None
        self._last_attempt_time: Optional[float] = None
        
        logger.info(
            "Circuit breaker initialized: service=%s, max_fails=%d, timeout=%ds, recover=%ds",
            service_name, max_fails, timeout_seconds, recover_timeout
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
        
        if self._state == CircuitState.OPEN:
            return self._should_attempt_recovery()
        
        return True  # HALF_OPEN allows one attempt
    
    def _should_attempt_recovery(self) -> bool:
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
        if self._state == CircuitState.HALF_OPEN:
            self._transition_to_closed()
        else:
            self._fail_count = 0
    
    def _record_failure(self) -> None:
        self._fail_count += 1
        self._last_failure_time = time.time()
        
        if self._state == CircuitState.HALF_OPEN:
            self._transition_to_open()
        elif self._fail_count >= self.max_fails:
            self._transition_to_open()
    
    def _transition_to_open(self) -> None:
        if self._state != CircuitState.OPEN:
            logger.warning(
                "Circuit breaker OPEN: %s failed %d consecutive times",
                self.service_name, self._fail_count
            )
            self._state = CircuitState.OPEN
    
    def _transition_to_half_open(self) -> None:
        logger.info("Circuit breaker HALF_OPEN: testing %s recovery", self.service_name)
        self._state = CircuitState.HALF_OPEN
        self._fail_count = 0
    
    def _transition_to_closed(self) -> None:
        logger.info("Circuit breaker CLOSED: %s recovered", self.service_name)
        self._state = CircuitState.CLOSED
        self._fail_count = 0
        self._last_failure_time = None
    
    def call(self, func: Callable, *args, **kwargs) -> Any:
        if not self.is_available():
            retry_after = self._get_retry_after()
            logger.warning(
                "Circuit breaker OPEN: rejecting call to %s, retry after %.1fs",
                self.service_name, retry_after
            )
            raise CircuitBreakerOpenError(self.service_name, retry_after)
        
        self._last_attempt_time = time.time()
        
        try:
            result = func(*args, **kwargs)
            self._record_success()
            return result
        except Exception as e:
            self._record_failure()
            
            if self._state == CircuitState.OPEN and self._should_attempt_recovery():
                self._transition_to_half_open()
            
            raise
    
    async def call_async(self, func: Callable, *args, **kwargs) -> Any:
        if not self.is_available():
            retry_after = self._get_retry_after()
            logger.warning(
                "Circuit breaker OPEN: rejecting async call to %s, retry after %.1fs",
                self.service_name, retry_after
            )
            raise CircuitBreakerOpenError(self.service_name, retry_after)
        
        self._last_attempt_time = time.time()
        
        try:
            result = await func(*args, **kwargs)
            self._record_success()
            return result
        except Exception as e:
            self._record_failure()
            
            if self._state == CircuitState.OPEN and self._should_attempt_recovery():
                self._transition_to_half_open()
            
            raise
    
    def get_status(self) -> Dict[str, Any]:
        return {
            "service": self.service_name,
            "state": self._state.value,
            "fail_count": self._fail_count,
            "max_fails": self.max_fails,
            "last_failure": (
                datetime.fromtimestamp(self._last_failure_time).isoformat()
                if self._last_failure_time else None
            ),
            "retry_after": self._get_retry_after() if self._state == CircuitState.OPEN else 0,
        }


def create_circuit_breaker() -> CircuitBreaker:
    return CircuitBreaker(
        service_name="runt",
        max_fails=int(os.getenv('CIRCUIT_BREAKER_MAX_FAILS', 5)),
        timeout_seconds=int(os.getenv('CIRCUIT_BREAKER_TIMEOUT_SECONDS', 30)),
        recover_timeout=int(os.getenv('CIRCUIT_BREAKER_RECOVER_SECONDS', 60)),
    )