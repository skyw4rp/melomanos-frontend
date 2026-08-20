"""Set E2E seller plan to pro (run with cwd = backend/)."""

from __future__ import annotations

import os
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[3] / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from sqlalchemy import text  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.core.database import SessionLocal  # noqa: E402
from app.demo.safety import DemoSafetyError, assert_demo_tooling_allowed  # noqa: E402

EMAIL = os.environ.get("E2E_SELLER_EMAIL", "seller@example.com")
PLAN = os.environ.get("E2E_SELLER_PLAN", "pro")


def main() -> None:
    if "DATABASE_URL" not in os.environ:
        raise SystemExit(
            "Refusing to run: DATABASE_URL is not set in this process's environment. "
            "This script must be pointed explicitly at the intended (e.g. isolated E2E) "
            "database - it will not silently fall back to .env.local's default."
        )
    try:
        assert_demo_tooling_allowed(database_url=settings.DATABASE_URL)
    except DemoSafetyError as exc:
        raise SystemExit(f"Refusing to run: {exc}") from exc

    with SessionLocal() as db:
        result = db.execute(
            text("UPDATE users SET plan_type = :plan WHERE email = :email"),
            {"plan": PLAN, "email": EMAIL},
        )
        db.commit()
        if result.rowcount == 0:
            raise SystemExit(f"User not found: {EMAIL}")
    print(f"set plan_type={PLAN} for {EMAIL}")


if __name__ == "__main__":
    main()
