"""Set E2E seller plan to pro (run from melomanos_market project root)."""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.getcwd())

from sqlalchemy import text  # noqa: E402

from app.core.database import SessionLocal  # noqa: E402

EMAIL = os.environ.get("E2E_SELLER_EMAIL", "seller@example.com")
PLAN = os.environ.get("E2E_SELLER_PLAN", "pro")


def main() -> None:
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
