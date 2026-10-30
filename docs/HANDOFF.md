# 다른 데스크톱으로 이어가기

## 2026-10-30 로컬 프로토타입

시작 입력 → Phaser 월드 등장 → 직접 이동·점프 → NPC 대화 → 코딩 → 관문 열림 → 챕터 완료 흐름을 구현했습니다.
쉬움은 Blockly, 중간·어려움은 CodeMirror를 사용합니다. 난이도는 현재 튜토리얼 수준이며 최종 등급 문제는 후속 콘텐츠입니다.
AI 항목은 준비 중으로 비활성화되어 있고 실제 AI를 흉내 내지 않습니다.
진행 상태는 메모리에만 있으며 새로고침하면 초기화됩니다.

- `src/game/progression.ts`: 진행·관문 상태의 유일한 변경 지점
- `src/game/World.tsx`: 월드·이동·카메라, 장면 해제 시 게임 인스턴스 정리
- `src/features/CodePanel.tsx`: 편집기와 Worker 수명 관리
- `src/runner/interpreter.ts`: 허용된 AST만 해석, 제한된 연산·출력
- `tests/runner.test.ts`: 풀이·호스트 접근 거부·무한 반복 제한

코딩창에서는 Phaser의 키 입력을 비활성화하고 물리를 일시 정지합니다.
Worker는 완료·오류·취소·창 해제·시간 초과 시 종료하며, 편집기·리사이즈 관찰자도 해제합니다.
외부 네트워크 호출이나 DB 커넥션은 추가하지 않았습니다.

이번 검증: `npm run check` 통과. Edge 브라우저에서 정확한 시작 키, 이동, 대화,
중간 모드 코드 입력, 무한 반복 제한 후 재시도, 관문 열림, 챕터 완료를 확인했습니다.
쉬움 모드도 Blockly 작업 블록 → Worker 판정 → 관문 해금까지 확인했습니다.
브라우저 검증은 개발 서버 기준이며 실제 배포 검증은 아닙니다.

현재 개발도구 의존성 감사에는 Netlify CLI의 `deepmerge` 관련 낮은 등급 항목 5개가 남아 있습니다.
자동 수정 제안은 CLI 대폭 다운그레이드이므로 적용하지 않았습니다. 차후 CLI 업데이트 시 확인합니다.

## 현재 단계

2026-10-27: CODEVANTURE 초기 개발환경 구성.

- Node.js 24.15.0 / npm 11.13.0 기준
- React + TypeScript + Vite 실행 구조
- Phaser, Blockly, CodeMirror, Supabase, Gemini SDK 의존성 준비
- Netlify Functions의 읽기 전용 상태 API
- Netlify 배포 설정, 환경변수 예시, 에디터·서식 설정
- GitHub Actions의 설치·정적 검사·빌드 자동화
- 기획·아키텍처·안정성 원칙 문서

게임 기능, 계정 생성, 실제 외부 서비스 연결과 배포는 후속 작업입니다.

## 새 PC 체크리스트

1. Git과 Node.js 24.15.0, npm 11.13.0을 설치합니다.
2. 저장소 접근 가능한 GitHub 계정으로 인증합니다.
3. `README.md`의 명령으로 복제하고 `npm ci`를 실행합니다.
4. `npm run check`가 통과하는지 확인합니다.
5. `npm run dev:full`로 웹과 `/api/health`를 확인합니다.
6. 작업 후 개발 서버를 `Ctrl+C`로 종료합니다.

`node_modules`, `dist`, `.netlify`, 비밀키는 PC 간 복사하지 않습니다.
의존성은 잠금 파일에서 재설치하고 외부 서비스 연결은 필요할 때 해당 PC에서 설정합니다.

기본 포트는 프런트 `15173`, 프런트+함수 `18888`, 빌드 미리보기 `4173`입니다.
초기 PC에서 `5173`은 Windows 예약 범위, `8888`은 접근 거부 상태여서 사용 가능한 포트로 지정했습니다.
새 PC에서 같은 오류가 발생하면 `netsh interface ipv4 show excludedportrange protocol=tcp`로
예약 범위를 확인하고 `vite.config.ts`와 `netlify.toml`의 포트를 함께 변경합니다.

## 다음 개발 작업

1. `docs/PRODUCT.md`의 시작 화면 구현: 정확한 `Hello World;` 문자열 검증.
2. Phaser를 React 생명주기와 연결하고 월드 등장 연출 구현.
3. 사용자의 직접 이동과 카메라·충돌 구현.
4. NPC/장치 상호작용과 첫 코딩 문제 설계.
5. 코드 실행 환경과 지원 언어 결정 후 네 가지 모드 연결.

## 검증 경계

초기 Windows PC에서 외부 서비스 키 없이 다음을 확인했습니다.

- `npm run check`: ESLint, Prettier, 프런트·서버 TypeScript 검사, Vite 빌드 통과.
- `npm run dev:full`: Vite와 Netlify 함수 로컬 실행.
- `GET /`: HTTP 200과 CODEVANTURE 페이지 제목 확인.
- React 진입 컴포넌트: 개발 서버의 변환 응답 확인.
- `GET /api/health`: HTTP 200, 예상 JSON, `Cache-Control: no-store` 확인.
- `POST /api/health`: HTTP 405, `Allow: GET` 확인.
- `npm audit`: 초기 의존성 보정 후 취약점 0건.

브라우저의 실제 화면·조작 검증, Netlify 실배포, Supabase 인증·DB,
Gemini 응답 품질·한도, 게임 플레이는 아직 검증하지 않았습니다.
원격 자동 검사의 최신 결과는 GitHub 저장소의 Actions 탭에서 확인합니다.

## 의존성 관리 메모

Netlify CLI 27.14.2는 직접 의존성으로 `toml@4.3.0`을 사용합니다.
초기 설치 감사에서 TOML 파서의 자원 소모 취약점이 확인되어,
`package.json`의 프로젝트 전용 override로 `toml@5.0.1`을 지정했습니다.
Node.js 24 환경에서 사용하며, 이 변경을 포함한 로컬 함수 실행을 확인합니다.
추후 Netlify CLI 업데이트 시 자체 수정 여부를 확인한 뒤 override 제거를 검토합니다.

- [TOML CPU 자원 소모 취약점 및 수정 버전](https://github.com/advisories/GHSA-9qmh-m7c6-f92p)
- [TOML 테이블 처리 취약점 및 수정 버전](https://github.com/advisories/GHSA-4qx8-w7c3-pj3p)
