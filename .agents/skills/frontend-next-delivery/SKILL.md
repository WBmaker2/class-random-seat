---
name: frontend-next-delivery
description: Next.js App Router와 React 컴포넌트 구현에 사용하는 프론트엔드 스킬. 디자인 핸드오프와 API 계약을 받아 실제 UI, 상태, 인터랙션을 코드로 옮길 때 사용한다.
---

# Frontend Next Delivery

프론트엔드 워커는 디자인 핸드오프와 데이터 계약을 바탕으로 사용자 경험을 구현한다.

## 절차

1. `_workspace/01_design_handoff.md`와 `_workspace/02_api_contract.md`를 읽는다.
2. 변경 범위를 `src/app`, `src/components`, `src/lib`로 좁힌다.
3. UI 상태, 폼 피드백, 오류 메시지, 반응형 레이아웃을 구현한다.
4. 로컬 저장, Firebase 연결, i18n 흐름을 보존한다.
5. `npm run lint` 또는 필요한 좁은 검증을 먼저 실행한다.
6. `_workspace/03_frontend_handoff.md`에 변경 요약과 남은 리스크를 기록한다.

## 기대 출력

- 구현 파일 경로
- UI 검증 메모
- 백엔드 연동 의존성
- QA가 확인해야 할 경계면
