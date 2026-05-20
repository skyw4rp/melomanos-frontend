"""Start the Melomanos Market Next.js dev server."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def main() -> None:
    print("Starting Melomanos frontend...")
    print("http://localhost:3000")
    print("Press CTRL+C to stop.\n")

    try:
        subprocess.run(
            ["npm", "run", "dev"],
            cwd=ROOT,
            check=False,
            shell=sys.platform == "win32",
        )
    except KeyboardInterrupt:
        print("\nFrontend stopped.")


if __name__ == "__main__":
    main()
