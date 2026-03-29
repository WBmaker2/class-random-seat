---
name: wireframe-to-spec
description: Turn a web feature brief into low-fidelity wireframes and an implementation-ready UI handoff for React/Next.js teams.
---

# Wireframe To Spec

Use this skill when the design worker needs to define structure before implementation begins.

## Trigger

- No UI spec exists yet
- The request includes pages, flows, states, or interactions
- Frontend and backend teams need a shared baseline

## Procedure

1. Read the brief, existing UI, and repo conventions.
2. Identify primary user journey, supporting states, and screen hierarchy.
3. Produce `_workspace/01_wireframes.md` with:
   - page sections
   - low-fidelity layout blocks
   - responsive notes
   - empty/error/loading/success states
4. Produce `_workspace/01_ui_handoff.md` with:
   - component inventory
   - copy notes
   - interaction rules
   - localization/accessibility notes
5. Call out anything that requires backend or contract support.

## Good Output

- Concrete enough that a frontend builder can start coding without guessing
- Clear about assumptions and unresolved questions
