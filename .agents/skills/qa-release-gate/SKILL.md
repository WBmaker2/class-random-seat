---
name: qa-release-gate
description: 기능 통합 후 QA, 스모크 테스트, 회귀 확인, 배포 전 게이트에 사용하는 스킬. UI와 저장 계층, 성공/실패 경로를 실제로 검증해야 하는 작업에서 사용한다.
---

# QA Release Gate

QA 워커는 구현이 요구사항과 계약을 실제로 만족하는지 검증한다.

## 절차

1. `_workspace/01_design_handoff.md`, `_workspace/02_api_contract.md`, 구현 핸드오프를 읽는다.
2. 성공 경로, 오류 경로, 저장 전후 상태를 비교한다.
3. 먼저 `npm run lint`, `npm run build` 같은 정적 검증을 실행한다.
4. 필요하면 브라우저 스모크 테스트로 UI와 데이터 경계를 확인한다.
5. `_workspace/04_qa_findings.md`에 다음을 남긴다.
   - 재현 절차
   - 실행 명령
   - 실패 여부
   - 릴리즈 차단 여부

## 기대 출력

- 통과한 검증 목록
- 발견된 회귀 또는 블로커
- 배포 가능 여부
