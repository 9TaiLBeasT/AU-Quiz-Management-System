import threading
from supabase import create_client, Client
from core.config import settings

_admin_client: Client | None = None
_lock = threading.Lock()


def get_admin_client() -> Client:
    """
    Returns a Supabase client initialized with the service-role key.
    Thread-safe singleton — safe for use in FastAPI's sync thread pool.
    """
    global _admin_client
    if _admin_client is None:
        with _lock:
            if _admin_client is None:  # double-checked locking
                key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
                _admin_client = create_client(settings.SUPABASE_URL, key)
    return _admin_client


def get_auth_admin():
    """Returns the Supabase Auth admin interface for creating users."""
    return get_admin_client().auth.admin
