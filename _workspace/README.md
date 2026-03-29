# Workspace Artifact Rules

이 디렉토리는 하네스 실행 중간 산출물과 핸드오프를 모아두는 곳이다.

## 파일명 규칙

- `{phase}_{artifact}.md`
- 단계 번호는 작업 흐름 순서를 따른다.
- 워커별 상세 산출물은 단계 번호를 유지한 채 목적을 붙인다.

## 기본 파이프라인

1. `01_design_wireframe.md`
2. `01_design_handoff.md`
3. `02_api_contract.md`
4. `03_frontend_handoff.md`
5. `03_backend_handoff.md`
6. `04_qa_findings.md`
7. `05_release_notes.md`

## 전달 규칙

- 설계와 계약은 구현 전에 반드시 작성한다.
- 구현 워커는 코드 변경 요약만 남기지 말고 QA가 바로 재현할 정보를 남긴다.
- QA는 실행 명령, 재현 절차, 결과를 함께 적는다.
- 최종 배포 여부와 URL은 `05_release_notes.md`에 남긴다.
