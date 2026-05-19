from __future__ import annotations
from typing import Any, Dict
import jwt
from fastapi import Header, HTTPException
import os

def _get_bearer_token(authorization: str) -> str:
    if not authorization:
        return ''
    parts = authorization.split(' ', 1)
    if len(parts) != 2:
        return ''
    if parts[0].lower() != 'bearer':
        return ''
    return parts[1].strip()


def _decode_and_validate_token(token: str, jwt_secret: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
    except Exception as exc:
        raise HTTPException(status_code=401, detail={'error': True, 'message': 'Unauthorized'}) from exc

    if payload.get('type') == 'refresh':
        raise HTTPException(status_code=401, detail={'error': True, 'message': 'Unauthorized'})

    if not payload.get('sub') or not payload.get('role') or not payload.get('client'):
        raise HTTPException(status_code=401, detail={'error': True, 'message': 'Unauthorized'})

    return payload


async def verify_internal_request(
    authorization: str = Header(default=''),
    x_service_secret: str = Header(default=''),
) -> Dict[str, Any]:
    """FastAPI dependency que verifica el secret del servicio y el JWT bearer."""
    # Leer variables de entorno aquí (lazy loading) para capturar valores correctos
    service_secret = os.getenv('SERVICE_SECRET', '')
    jwt_secret = os.getenv('JWT_SECRET_KEY', '')

    if not service_secret or not jwt_secret:
        raise HTTPException(
            status_code=500,
            detail={'error': True, 'message': 'Security configuration missing'},
        )

    if not x_service_secret or x_service_secret != service_secret:
        raise HTTPException(
            status_code=401,
            detail={'error': True, 'message': 'Acceso denegado: credenciales de servicio invalidas'},
        )

    token = _get_bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail={'error': True, 'message': 'Unauthorized'})

    return _decode_and_validate_token(token, jwt_secret)
