---
name: qa-smoke-gate
description: Run requirement-driven QA checks for integrated full-stack web changes and produce a release gate report.
---

# QA Smoke Gate

Use this skill when a QA worker validates integrated behavior before deployment or release.

## Trigger

- Frontend and backend handoffs are both ready
- A feature or site increment is approaching release
- Browser behavior, contract alignment, or regression risk matters

## Procedure

1. Read `_workspace/00_brief.md`, `_workspace/02_system_contracts.md`, `_workspace/03_frontend_handoff.md`, and `_workspace/03_backend_handoff.md`.
2. Check requirement vs behavior across these edges:
   - UI state vs data state
   - success vs error paths
   - empty/loading/retry flows
   - deploy-time configuration assumptions
3. Run the narrowest meaningful checks, typically:
   - `npm run lint`
   - `npm run build`
   - browser smoke on key user flows
4. Write `_workspace/05_qa_report.md` with:
   - commands run
   - passes/failures
   - reproduction steps
   - residual risk or release recommendation

## Guardrails

- Do not report “looks fine” without evidence.
- Prefer reproducible failures and explicit scope over vague commentary.
