---
name: fullstack-web-orchestrator
description: React/Next.js 풀스택 웹 기능을 와이어프레임부터 API, QA, 배포까지 조율할 때 사용하는 리더 스킬. 디자인, 프론트엔드, 백엔드, QA가 함께 필요한 기능 요청에서 우선 사용한다. 단순 단일 파일 수정이나 읽기 전용 조사에는 과하게 쓰지 않는다.
---

# Fullstack Web Orchestrator

이 스킬은 이 저장소에서 풀스택 웹 기능을 리더-워커 구조로 전달할 때 사용한다. 리더는 계약 정의, 의존성 정리, 워커 조율, QA 게이트, 배포 판단을 맡는다.

## 언제 트리거되는가

- 화면 설계와 구현이 같이 필요한 기능 요청
- React/Next.js UI와 Firebase 또는 API 계층이 함께 바뀌는 작업
- QA와 배포 판단까지 포함한 다단계 작업

## 언제 트리거하지 않는가

- 문구 수정처럼 단순한 단일 화면 변경
- 읽기 전용 코드 탐색 또는 리뷰만 필요한 요청
- 프론트엔드나 백엔드 한쪽만 좁게 수정하는 작업

## 오케스트레이션

1. 요구사항을 받아 `update_plan`에 설계, 계약, 구현, QA, 배포 단계를 등록한다.
2. `_workspace/00_artifact_map.md`를 기준으로 이번 작업의 아티팩트 경로를 정한다.
3. 디자인이 필요한 경우 `product-designer`를 먼저 위임해 `_workspace/01_design_wireframe.md`, `_workspace/01_design_handoff.md`를 받는다.
4. 데이터 경계가 필요한 경우 리더가 `_workspace/02_api_contract.md`를 먼저 작성하거나 백엔드 워커에게 계약 초안을 받는다.
5. 프론트엔드와 백엔드가 독립적으로 시작 가능한 시점부터 `next-frontend-builder`, `api-backend-builder`를 병렬로 위임한다.
6. 구현 산출물은 `_workspace/03_frontend_handoff.md`, `_workspace/03_backend_handoff.md`에 남기게 한다.
7. 통합 후 `qa-release-worker`에게 `_workspace/04_qa_findings.md`를 남기게 한다.
8. QA가 통과되면 리더가 배포 여부를 판단하고 `_workspace/05_release_notes.md`를 남긴다.

## 필수 아티팩트

- `_workspace/01_design_wireframe.md`
- `_workspace/01_design_handoff.md`
- `_workspace/02_api_contract.md`
- `_workspace/03_frontend_handoff.md`
- `_workspace/03_backend_handoff.md`
- `_workspace/04_qa_findings.md`
- `_workspace/05_release_notes.md`

## 저장소별 기본 규칙

- UI는 `src/app`, `src/components`, `src/lib` 중심으로 유지한다.
- 로컬 우선 저장, Firebase 백업, 한영 i18n 흐름을 깨지 않는다.
- 배포 전 최소 검증은 `npm run lint`, `npm run build`다.
- 실제 UI 검증이 필요하면 브라우저 스모크 테스트를 추가한다.
