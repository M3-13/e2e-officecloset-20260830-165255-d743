"""Account routes (self-deletion).

The routes themselves are implemented by the account-deletion ticket; this
skeleton only declares the router so the application can mount it under
``/api/account``.
"""

from fastapi import APIRouter

router = APIRouter()
