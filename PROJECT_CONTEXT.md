# PROJECT_CONTEXT

이 문서는 다른 스레드나 다른 작업 세션에서 이 프로젝트를 빠르게 이어받을 수 있도록 핵심 맥락만 정리한 인수인계용 문서입니다.

## 1. 프로젝트 한 줄 요약

`class-random-seat`는 교실 자리 바꾸기, 학생 랜덤 뽑기, 타이머 기능을 제공하는 **로컬 우선(local-first) 교실 도우미 웹앱**입니다.

기본 동작은 브라우저 `localStorage` 저장이며, 필요할 때만 **Google 로그인 + Firebase**로 클라우드 백업/복원을 사용합니다.

## 2. 현재 작업 기준 정보

- 현재 작업 폴더: `/Users/kimhongnyeon/Dev/codex/class-random-seat/.worktrees/project-improvements`
- Git 원격 저장소: `https://github.com/WBmaker2/class-random-seat.git`
- 운영 URL: `https://class-random-seat.vercel.app`
- 사용자 표시 버전: `v1.0.8`
- `package.json` 버전: `1.0.8`

참고: 예전 경로인 `/Volumes/DATA/Dev/Codex/class-random-seat`는 현재 작업 기준이 아닐 수 있으므로, 새 작업은 **반드시 위 `/Users/...` 경로 기준**으로 진행하는 것이 안전합니다.

## 3. 제품 핵심 기능

### 메인 화면(`/`)
메인 화면은 아래 4개 구역만 보여주도록 정리되어 있습니다.

1. 제목 섹션
2. 자리표
3. 학생 랜덤 뽑기
4. 타이머

### 교사용 관리 화면(`/manage`)
교사용 관리 페이지에서 아래 기능을 담당합니다.

- 학급 등록 / 수정
- 학생 등록 / 수정 / 삭제
- 자리표 생성 / 저장 / 조회
- 선택적 Google 로그인
- Firebase 클라우드 백업 / 복원

## 4. 현재 제품 동작 상세

### 4-1. 학급 / 학생 / 자리표

- 학급은 `학급 이름`, `메모`, `교실 배치도(rows, pairsPerRow)`를 가집니다.
- 학생 등록 시 `이름 + 성별(male/female)`를 저장합니다.
- 자리표는 제목 예: `4월 자리`, `3월 수행평가 자리` 형태로 생성합니다.
- 자리표에는 생성 시점의 `layoutTemplate snapshot`이 함께 저장됩니다.
- 나중에 학급 기본 배치도를 바꿔도 과거 자리표는 당시 구조로 그대로 복원됩니다.
- 별도 선택이 없으면 최근 조회한 자리표가 기본으로 보이도록 설계되어 있습니다.

### 4-2. 교실 배치도

- 배치도는 `모든 행 동일 구조` 기준입니다.
- 현재 선택 범위:
  - 행 수: `1 ~ 5`
  - 한 행의 짝 수: `1 ~ 3`
- 총 좌석 수는 `rows * pairsPerRow * 2`입니다.

### 4-3. 자리 배치 로직

- 기본 배치 방식: `성별 구분 없이 랜덤`
- 선택 배치 방식: `가능하면 남녀 짝으로 구성`
- 좌석은 **앞줄부터 우선 채워지고**, 학생 수가 모자라면 뒤 줄부터 빈자리가 생기도록 맞춰져 있습니다.
- 생성된 자리표는 이후 아래 작업을 지원합니다.
  - `랜덤 재배정`: 같은 제목 유지, 좌석만 다시 섞기
  - `선택한 2자리 바꾸기`: 학생-학생 / 학생-빈자리 / 빈자리-빈자리 모두 가능

### 4-4. 학생 랜덤 뽑기

- 선발 대상 필터:
  - 전체
  - 남학생
  - 여학생
- 한 번에 뽑을 수 있는 인원:
  - `1 ~ 5명`
- 현재 동작:
  - 중복 없이 한 바퀴씩 순환
  - 진행 현황 표시
  - 한 바퀴를 모두 돌면 완료 안내 후 다음 추첨부터 새 라운드 자동 시작
- 연출:
  - 결과 카드 크게 표시
  - 중앙 팝업 애니메이션
  - 축하 효과음 재생

### 4-5. 타이머

- 빠른 선택: `1, 3, 5, 10, 15분`
- 종료 시 차임벨 성격의 효과음이 재생됩니다.

### 4-6. 언어

- 한국어 / 영어 전환 가능
- 주요 UI 문자열은 `src/lib/i18n.ts`에서 관리합니다.

## 5. 기술 스택

- Next.js App Router
- React 19
- TypeScript
- CSS Modules
- Firebase Auth (Google, optional)
- Cloud Firestore (backup only, optional)
- Local Storage (primary storage)

## 6. 저장 구조

### 6-1. 로컬 저장

기본 저장소는 브라우저 `localStorage`입니다.

- 저장 키: `class-random-seat-app-data`
- 관련 파일: `src/lib/local-app-data.ts`

로컬 저장 데이터 구조:

- `classes`
- `studentsByClass`
- `seatPlansByClass`
- `preferences`
  - `language`
  - `recentClassId`
  - `lastBackupAt`
  - `lastRestoreAt`

### 6-2. Firebase 백업

Google 로그인은 선택 사항이며, 로그인 없이도 앱 기능 대부분은 정상 사용 가능합니다.

Firebase는 **백업/복원용**으로만 사용합니다.

Firestore 구조:

```text
users/{uid}
users/{uid}/backups/primary
```

관련 파일:

- Firebase 초기화: `src/lib/firebase/client.ts`
- Firebase 백업/복원 로직: `src/lib/firebase/data.ts`

중요한 구현 포인트:

- Firestore write 전에 `undefined` 값을 제거하는 sanitize 로직이 들어가 있습니다.
- 이 처리가 없으면 `lastRestoreAt` 같은 optional 필드 때문에 `setDoc()` 오류가 날 수 있습니다.

## 7. 중요 타입

핵심 타입은 `src/lib/types.ts`에 있습니다.

특히 자주 보는 타입:

- `LayoutTemplate`
- `ClassroomRecord`
- `StudentRecord`
- `SeatAssignment`
- `SeatPlanRecord`
- `LocalAppData`
- `PickerDrawCount = 1 | 2 | 3 | 4 | 5`

## 8. 주요 파일 맵

### 화면 진입점

- `src/app/page.tsx`: 메인 화면 라우트
- `src/app/manage/page.tsx`: 교사용 관리 페이지 라우트

### 핵심 컴포넌트

- `src/components/home-app.tsx`
  - 메인 화면 전체
  - 자리표 조회
  - 학생 랜덤 뽑기
  - 타이머
- `src/components/manage-app.tsx`
  - 학급 / 학생 / 자리표 관리
  - Firebase 로그인 및 백업/복원
- `src/components/shared-app-ui.tsx`
  - `SeatGrid`, `LanguageSwitch`, `StatCard`
- `src/components/dashboard-app.module.css`
  - 주요 스타일 전반

### 핵심 로직

- `src/lib/layout.ts`
  - 좌석 위치 생성
  - 자리표 배치 알고리즘
  - 학생 랜덤 뽑기 유틸
- `src/lib/local-app-data.ts`
  - localStorage load/save
- `src/lib/firebase/client.ts`
  - Firebase app/auth/db 초기화
- `src/lib/firebase/data.ts`
  - Firestore CRUD / backup
- `src/lib/i18n.ts`
  - 다국어 사전
- `src/lib/version.ts`
  - 사용자에게 노출되는 버전 문자열

## 9. 최근 반영된 사용자 요구사항 요약

현재 버전 기준으로 이미 반영된 중요한 요구사항은 아래와 같습니다.

- 메인 화면 단순화: 제목 / 자리표 / 랜덤 뽑기 / 타이머만 표시
- 관리 기능 분리: `/manage`
- 로컬 우선 저장 + 선택적 Google 백업
- 학급별 교실 배치도 등록/수정
- 자리표 제목 저장 및 월별 조회
- 최근 조회 자리표 자동 복원
- 남녀 짝 배치 옵션
- 랜덤 뽑기 성별 필터 + 1~5명 뽑기
- 중복 없는 랜덤 뽑기 라운드
- 랜덤 뽑기 팝업 애니메이션 + 효과음
- 타이머 종료 효과음
- 자리표 재랜덤 배정
- 선택한 2자리 교환 및 빈자리 이동
- 좌석 이름 확대 및 랜덤 뽑기 진행 현황 표시

## 10. 환경 변수 / 외부 설정

`.env.example` 기반으로 `.env.local`을 사용합니다.

공개 환경 변수:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

주의할 점:

- `.env.local`은 커밋하지 않습니다.
- Firebase Auth에서 Vercel 운영 도메인이 Authorized domains에 등록되어 있어야 Google 로그인 오류가 나지 않습니다.
- Firestore rules는 `firestore.rules`를 기준으로 관리합니다.

## 11. 개발 / 검증 / 배포 명령어

로컬 개발:

```bash
npm install
npm run dev
```

검증:

```bash
npm run lint
npm run test:unit
npm run build
npm run test:smoke
npm run verify
```

배포:

- GitHub: `main` 브랜치 기준
- Vercel: 운영 URL은 `https://class-random-seat.vercel.app`

## 12. 다음 작업자가 가장 먼저 보면 좋은 포인트

### UI 수정일 때

- 거의 대부분 `src/components/home-app.tsx`
- 관리 화면은 `src/components/manage-app.tsx`
- 스타일은 `src/components/dashboard-app.module.css`

### 자리 배치 로직 수정일 때

- `src/lib/layout.ts`

### 저장/백업 문제일 때

- 로컬: `src/lib/local-app-data.ts`
- Firebase: `src/lib/firebase/client.ts`, `src/lib/firebase/data.ts`

### 문자열/다국어 수정일 때

- `src/lib/i18n.ts`

### 버전 올릴 때

- `package.json`
- `package-lock.json`
- `src/lib/version.ts`는 `package.json`의 `version`을 그대로 표시용으로 읽어 옵니다.

## 13. 하네스 / 에이전트 관련 메모

이 저장소에는 웹 개발 하네스 구조도 같이 들어 있습니다.

- `agents/`
- `.agents/`
- `_workspace/`

앱 기능 수정에는 직접 영향이 없지만, 여러 역할로 작업을 나눌 때 참고할 수 있습니다.

## 14. 작업 시 주의 메모

- 이 앱은 **로컬 우선**이라는 제품 원칙이 중요합니다.
- Google 로그인 없이도 핵심 기능이 계속 동작해야 합니다.
- 자리표는 과거 데이터가 깨지지 않도록 `layout snapshot` 보존이 중요합니다.
- Firebase write에서는 optional field의 `undefined` 처리에 주의해야 합니다.
- 사용자에게 보이는 버전은 `package.json`의 `version`을 기준으로 관리되며, `src/lib/version.ts`의 `APP_VERSION`은 그 값을 그대로 표시용으로 사용합니다.

---

필요하다면 다음 스레드에서는 이 문서와 함께 아래 파일부터 읽으면 대부분의 작업을 바로 이어갈 수 있습니다.

1. `README.md`
2. `PROJECT_CONTEXT.md`
3. `src/components/home-app.tsx`
4. `src/components/manage-app.tsx`
5. `src/lib/layout.ts`
6. `src/lib/firebase/data.ts`
