"""
JWT validation using Supabase's own auth.get_user() API.

Using SYNC functions — FastAPI automatically runs sync Depends in a
thread pool via anyio.to_thread.run_sync(), so no manual threading needed.
"""

from supabase import create_client
from fastapi import HTTPException, status
from core.config import settings

_admin_client = None


def _get_admin_client():
    global _admin_client
    if _admin_client is None:
        _admin_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    return _admin_client


def validate_token(token: str) -> dict:
    """
    Validate a Supabase JWT synchronously.
    FastAPI runs sync Depends in a thread pool automatically.
    """
    try:
        client = _get_admin_client()
        response = client.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return {"sub": str(response.user.id), "email": response.user.email}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )
