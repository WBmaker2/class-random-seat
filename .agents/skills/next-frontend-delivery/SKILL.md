---
name: next-frontend-delivery
description: Implement React/Next.js UI from approved handoffs and contracts, then verify with focused checks.
---

# Next Frontend Delivery

Use this skill when a frontend worker owns a bounded Next.js/React implementation slice.

## Trigger

- Approved wireframe/handoff exists
- Page, component, or UI-state implementation is needed
- The repository uses React/Next.js

## Procedure

1. Read `_workspace/01_wireframes.md`, `_workspace/01_ui_handoff.md`, and `_workspace/02_system_contracts.md`.
2. Inspect the existing component/page structure before editing.
3. Implement the smallest coherent UI change set.
4. Verify with the narrowest meaningful checks, usually:
   - `npm run lint`
   - `npm run build`
   - local browser smoke when the UI changed materially
5. Write `_workspace/03_frontend_handoff.md` with:
   - changed files
   - what was verified
   - unresolved integration points

## Guardrails

- Preserve existing styling and component patterns unless the task explicitly changes them.
- Do not widen API assumptions without updating the contract artifact.
