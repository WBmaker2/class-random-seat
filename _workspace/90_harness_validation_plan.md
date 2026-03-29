# Harness Validation Plan

## Structure Checks

- `agents/`에 역할 파일이 존재해야 한다.
- `.agents/skills/`의 각 `SKILL.md`는 frontmatter와 트리거 설명을 가져야 한다.
- `_workspace/README.md`와 `_workspace/00_artifact_map.md`가 파이프라인 규칙을 설명해야 한다.

## Should-trigger Examples

- "이 기능을 와이어프레임부터 구현, QA, 배포까지 한 번에 진행해줘."
- "Next.js 화면과 Firebase 저장 로직을 같이 바꾸고 검증까지 해줘."
- "디자인 초안, 프론트 구현, API 계약, 테스트까지 조율하는 팀을 돌려줘."

## Should-not-trigger Examples

- "이 문구 한 줄만 수정해줘."
- "이 함수가 무슨 역할인지 설명해줘."
- "배포 없이 CSS 간격만 조정해줘."

## With-skill vs Baseline Plan

- 비교 대상: `fullstack-web-orchestrator` 사용 vs 일반 단일 에이전트 진행
- 평가 기준:
  - 계약 문서 생성 여부
  - 디자인/프론트/백엔드/QA 산출물 분리 여부
  - QA 재현 절차의 구체성
  - 배포 판단과 릴리즈 노트 존재 여부

## QA Inclusion Decision

- 이 하네스는 QA를 기본 포함한다.
- 이유:
  - Next.js UI와 Firebase 저장 경계가 자주 맞물린다.
  - 브라우저 스모크 테스트와 정적 검증이 모두 중요하다.
  - 배포 전 계약 검증이 빠지면 회귀를 놓치기 쉽다.
