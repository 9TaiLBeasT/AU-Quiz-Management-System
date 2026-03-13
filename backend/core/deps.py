from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.security import validate_token
from db.supabase_client import get_admin_client

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    """
    Sync dependency — FastAPI automatically runs sync Depends in a thread pool.
    1. Validates Bearer JWT via Supabase auth.get_user()
    2. Fetches the user's profile from the profiles table
    3. Returns the full profile dict (includes role, full_name, etc.)
    """
    token = credentials.credentials
    auth_user = validate_token(token)
    user_id = auth_user["sub"]

    client = get_admin_client()
    result = client.table("profiles").select("*").eq("id", user_id).maybe_single().execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found. Contact your administrator.",
        )
    if result.data.get("status") == "inactive":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    return result.data


def require_role(*roles: str):
    """
    Dependency factory — enforces that the current user has one of the given roles.
    """
    def checker(user=Depends(get_current_user)):
        if user.get("role") not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required: {', '.join(roles)}. Your role: {user.get('role')}",
            )
        return user
    return checker


# Shorthand role dependencies
require_admin            = require_role("admin")
require_faculty          = require_role("faculty")
require_student          = require_role("student")
require_faculty_or_admin = require_role("faculty", "admin")
