"""Importing this package registers every API route on the shared router."""

from . import auth_api          # noqa: F401
from . import profile_api       # noqa: F401
from . import jobs_api          # noqa: F401
from . import applications_api  # noqa: F401
from . import university_api    # noqa: F401
from . import ai_api            # noqa: F401
from . import messages_api      # noqa: F401
from . import schedule_api      # noqa: F401
from . import notifications_api  # noqa: F401
