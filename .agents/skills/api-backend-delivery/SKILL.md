---
name: api-backend-delivery
description: Implement backend and data-layer behavior for a web feature, then document integration and environment notes.
---

# API Backend Delivery

Use this skill when a backend worker owns API, persistence, auth, or integration logic.

## Trigger

- The task changes data flow, storage, API routes, auth, or server behavior
- Frontend requirements depend on new or adjusted backend behavior

## Procedure

1. Read `_workspace/02_system_contracts.md` and inspect the current data/auth stack.
2. Implement the smallest coherent backend change set.
3. Validate with focused checks such as lint, build, or a scoped smoke test.
4. Write `_workspace/03_backend_handoff.md` with:
   - changed files
   - API/data behavior changes
   - env/config or migration notes
   - verification run

## Guardrails

- Prefer explicit validation and serialization boundaries.
- Record any deployment requirement early so the lead can plan release.
