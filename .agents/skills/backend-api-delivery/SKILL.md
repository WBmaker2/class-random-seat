---
name: backend-api-delivery
description: API, Firebase, Firestore, 인증, 데이터 직렬화와 같은 백엔드 계층 작업에 사용하는 스킬. Next.js UI 변경과 연결되는 데이터 계약이나 저장 로직 수정이 있을 때 트리거한다.
---

# Backend API Delivery

백엔드 워커는 데이터 계약과 저장 경계를 안정적으로 만든다.

## 절차

1. 요구사항에서 저장, 인증, 권한, API 계약 변화를 먼저 추출한다.
2. `_workspace/02_api_contract.md`를 작성하거나 갱신한다.
3. `src/lib`, `src/app/api`, Firebase 관련 경로를 수정한다.
4. 입력 검증, 직렬화, 선택 필드, 오류 메시지를 점검한다.
5. `npm run build`에 영향을 주는 타입 경계까지 확인한다.
6. `_workspace/03_backend_handoff.md`에 계약, 환경변수, 마이그레이션 메모를 남긴다.

## 기대 출력

- 변경된 계약 요약
- 저장 계층이나 API 경계 변경 사항
- 환경/배포 주의점
- QA 재현 포인트
