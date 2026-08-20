<!-- BEGIN:nextjs-agent-rules -->
# Canonical workspace preflight

Before code, test, build, server, E2E, migration-adjacent, or deployment action, read `../workspace/PROJECT_STATUS.md` first and parse the exact canonical JSON operational-authority block. Proceed only for its exact `READY` mission and explicitly allowed action class. Stop on absent, duplicate, malformed, stale, or conflicting authority. Queue, roadmap, prompts, tokens, briefs, reports, decisions, and gate results are subordinate evidence and never authority.

Exception: when the canonical block's `operational_runtime` is `DISABLED` and `authorized_mission` is `null` (AI Dev OS intentionally on HOLD), an explicit, direct instruction from the human user in the current session authorizes normal local development for that session only — product code, focused tests, localhost server, localhost network, an isolated local test database, and build/lint/typecheck — without requiring `authorized_mission` to be populated. This exception applies only within the Melómanos project repositories/directories explicitly available in the current Claude Code session, and does not extend to destructive or ambiguous database operations, production data, `git reset`/`clean`/force-push, deployment, cloud, secrets, paid services/APIs, global environment/PATH mutation, or AI Dev OS runtime activation; those remain fully gated by the rule above and still require the canonical JSON block to authorize them explicitly.

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
