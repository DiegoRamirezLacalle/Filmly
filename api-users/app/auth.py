from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from jose import jwt, JWTError
from passlib.context import CryptContext

from .settings import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _truncate_for_bcrypt(pw: str) -> str:
    """
    bcrypt acepta como máximo 72 bytes (no caracteres).
    Para evitar 500 por ValueError, truncamos a 72 bytes UTF-8.
    """
    pw_bytes = pw.encode("utf-8")
    if len(pw_bytes) > 72:
        pw = pw_bytes[:72].decode("utf-8", errors="ignore")
    return pw


def hash_password(pw: str) -> str:
    pw = _truncate_for_bcrypt(pw)
    return pwd_context.hash(pw)


def verify_password(pw: str, hashed: str) -> bool:
    pw = _truncate_for_bcrypt(pw)
    return pwd_context.verify(pw, hashed)


def create_access_token(subject: str | None = None, sub: str | None = None, extra: Dict[str, Any] | None = None) -> str:
    """
    Acepta subject o sub (para compatibilidad con main.py).
    """
    real_sub = sub or subject
    if not real_sub:
        raise ValueError("create_access_token requires 'sub' or 'subject'")

    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=int(settings.JWT_EXPIRES_MIN))

    payload: Dict[str, Any] = {
        "sub": real_sub,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }

    if extra:
        payload.update(extra)

    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALG)



def decode_token(token: str) -> Dict[str, Any]:
    """
    Devuelve el payload si el token es válido; lanza JWTError si no.
    """
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
