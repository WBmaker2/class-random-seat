---
name: fullstack-pipeline
description: Orchestrate a multi-agent web delivery pipeline from wireframe through frontend, backend, QA, and deployment in a Next.js/Firebase style project.
---

# Fullstack Pipeline

Use this skill when the lead agent needs to coordinate a full-stack web delivery team across design, frontend, backend, QA, and release.

## Trigger

- New website or feature development from idea to deploy
- Significant UI + data/API work that benefits from role separation
- Requests for team-based or pipeline-based execution

## Should Trigger

- "풀스택 웹사이트 개발 하네스를 구성해줘"
- "와이어프레임부터 배포까지 팀으로 조율해줘"
- "디자인, 프론트엔드, 백엔드, QA 파이프라인을 만들어줘"

## Should Not Trigger

- Single-file bug fixes with no team coordination
- Pure documentation or pure design-only tasks
- One-off code reviews without implementation

## Working Assumptions

- Frontend uses React/Next.js App Router patterns
- Backend may be API routes, Firebase, or a local data layer
- QA includes command validation and browser smoke checks
- Deployment is coordinated by the lead after QA sign-off

## Orchestration

1. Create `_workspace/00_brief.md` with the goal, user-facing behavior, constraints, and acceptance checks.
2. Call `update_plan` with design, contracts, frontend, backend, QA, and release stages.
3. Spawn `wireframe-designer` first, or use an existing approved UI spec if already available.
4. Create `_workspace/02_system_contracts.md` after the design phase. This file should define:
   - route/page ownership
   - data shape and API expectations
   - loading/error/empty states
   - deployment or environment needs
5. Spawn `frontend-builder` and `backend-builder` in parallel once contracts are stable.
6. Ask each worker to write its handoff file:
   - `_workspace/03_frontend_handoff.md`
   - `_workspace/03_backend_handoff.md`
7. Integrate the results and record `_workspace/04_integration_notes.md`.
8. Spawn or run `qa-worker` and require `_workspace/05_qa_report.md`.
9. If QA passes, deploy and write `_workspace/06_release_notes.md`.
10. Close workers that are no longer needed.

## Artifact Rules

- Keep artifacts small, actionable, and phase-specific.
- Use filenames `{phase}_{agent}_{artifact}.md` when adding new files.
- Treat `_workspace/02_system_contracts.md` as the shared contract source of truth.

## Output Expectations

- A clear plan and dependency order
- File-based handoffs for each stage
- A final summary that names the verified commands and deployment URL
