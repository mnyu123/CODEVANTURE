# CODEVANTURE

사용자가 직접 이동하며 이야기 속 사건을 코딩으로 해결하는 횡스크롤 웹 TRPG입니다.

현재는 **초기 개발환경만 구성한 단계**입니다. 실행 화면과 서버 상태 확인 API가 있으며,
게임 시작 연출, 이동, 코딩 문제, 로그인, 저장, 실제 AI 연결은 아직 구현하지 않았습니다.

## 다른 데스크톱에서 시작하기

Git과 Node.js **24.15.0**을 설치합니다. 기준 npm 버전은 **11.13.0**입니다.
Node 설치 후 npm 버전이 다르면 `npm install --global npm@11.13.0`으로 맞출 수 있습니다.
저장소는 비공개이므로 접근 가능한 GitHub 계정으로 인증해야 합니다.

```powershell
git clone https://github.com/mnyu123/CODEVANTURE.git D:\CODEVANTURE
cd D:\CODEVANTURE
npm ci
npm run check
npm run dev:full
```

- 웹 화면: <http://localhost:18888>
- 백엔드 확인: <http://localhost:18888/api/health>
- 종료: 실행 중인 터미널에서 `Ctrl+C`
- API 키, Supabase 프로젝트, Netlify 로그인 없이 초기 화면과 상태 API를 실행할 수 있습니다.
- PowerShell에서 `npm.ps1` 실행 정책 오류가 나면 같은 명령의 `npm`을 `npm.cmd`로 바꿉니다.
- 다른 경로에 복제해도 동작합니다. 로컬 절대경로는 소스 설정에 포함하지 않습니다.

## 명령어

| 명령                   | 용도                                                      |
| ---------------------- | --------------------------------------------------------- |
| `npm ci`               | 잠금 파일에 기록된 버전 그대로 설치                       |
| `npm run dev`          | 프런트만 실행: <http://localhost:15173>                   |
| `npm run dev:full`     | Netlify 로컬 서버와 프런트 실행: <http://localhost:18888> |
| `npm run typecheck`    | 프런트·서버 TypeScript 검사                               |
| `npm run lint`         | 정적 코드 검사                                            |
| `npm run format`       | 코드·문서 서식 정리                                       |
| `npm run format:check` | 서식 검사                                                 |
| `npm run build`        | 타입 검사 후 `dist/` 생성                                 |
| `npm run preview`      | 빌드한 프런트 확인: <http://localhost:4173>               |
| `npm run check`        | 정적 검사·서식 검사·타입 검사·빌드                        |

`dev`와 `preview`는 Netlify 함수를 실행하지 않습니다. API 확인에는 `dev:full`을 사용합니다.
`dev:full`이 Vite를 함께 시작하므로 같은 프로젝트의 `dev`를 별도로 켜지 않습니다.
개발 서버는 네트워크 장애나 포트 충돌로 실행되지 않을 수 있으며 CI에서는 실행하지 않습니다.

## 기술 구성

- 웹: React, TypeScript, Vite
- 월드: Phaser 3.90.0 (의존성만 준비)
- 편집기: Blockly, CodeMirror (의존성만 준비)
- 백엔드: Node.js + TypeScript + Netlify Functions
- DB·인증: Supabase PostgreSQL/Auth 예정, SDK만 준비
- AI: Gemini API 예정, `@google/genai` SDK만 준비
- 품질 검사: ESLint, Prettier, TypeScript, GitHub Actions

실제 설치 버전은 `package.json`과 `package-lock.json`이 기준입니다.
프로젝트 패키지는 전역 설치하지 않습니다. Netlify CLI도 이 저장소의 고정 버전을 사용합니다.

## 구조

```text
src/
  App.tsx              개발환경 확인용 화면
  game/                Phaser 월드 구현 위치
  features/            시작·대화·코딩 패널 구현 위치
  content/             지역·사건·문제 데이터 위치
  runner/              제한된 코드 실행기 구현 위치
server/                서버 전용 서비스 구현 위치
netlify/functions/
  health.ts            GET /api/health
docs/
  PRODUCT.md           합의된 기획과 아직 결정하지 않은 사항
  ARCHITECTURE.md      구성과 실행·보안 경계
  HANDOFF.md           다른 PC에서 이어갈 작업과 검증 범위
.github/workflows/     자동 검사
```

## 환경변수

초기 실행에는 `.env`가 필요하지 않습니다. 실제 외부 연동을 시작할 때만 복사합니다.

```powershell
Copy-Item .env.example .env
```

| 변수                            | 범위          | 용도                                    |
| ------------------------------- | ------------- | --------------------------------------- |
| `VITE_SUPABASE_URL`             | 브라우저 공개 | Supabase 프로젝트 URL                   |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | 브라우저 공개 | Supabase 공개용 키, RLS와 함께 사용     |
| `GEMINI_API_KEY`                | 서버 전용     | Gemini 요청 인증                        |
| `GEMINI_MODEL`                  | 서버 전용     | 연동 시 사용 가능 여부를 확인한 모델 ID |

이 변수들은 아직 코드에서 소비하지 않습니다. 빈 값이어도 초기 화면과 상태 API는 동작합니다.
`VITE_` 변수는 프런트 번들에 공개될 수 있습니다. Gemini 키나 Supabase 비밀키를 넣지 않습니다.
`.env`, `.netlify/`, `node_modules/`, `dist/`는 Git에서 제외합니다.

## 배포와 외부 서비스

오늘은 GitHub에 초기 환경만 보관합니다. Netlify/Supabase 프로젝트 생성, DB 스키마 적용,
AI 호출, 공개 배포는 수행하지 않습니다. `netlify.toml`은 추후 배포에 사용할 준비 설정입니다.
GitHub Actions는 설치·검사·빌드만 하며 배포하지 않습니다.

Netlify에 연결할 때 빌드 명령은 `npm run build`, 결과 경로는 `dist`, 함수 경로는
`netlify/functions`입니다. `.netlify/`의 사이트 연결 정보는 PC마다 별도로 생성합니다.

무료 제공 범위와 AI 모델은 변경될 수 있으므로 실제 연동·배포 시 공식 문서와 계정 한도를 다시 확인합니다.

- [Netlify Functions](https://docs.netlify.com/build/functions/get-started/)
- [Netlify CLI](https://cli.netlify.com/commands/dev/)
- [Supabase](https://supabase.com/docs)
- [Gemini API](https://ai.google.dev/gemini-api/docs)

## 다음 작업

`docs/HANDOFF.md`를 확인합니다. 첫 게임 기능은 흰 화면의 어두운 입력창과 정확한
`Hello World;` 검증부터 시작하고, 월드 등장과 직접 조작을 순서대로 연결합니다.
