# Runner

`languageAdapter.ts`가 C/C++/Java/Python의 현재 문제용 문법을 기존 AST 실행기로 연결합니다.
이것은 실제 컴파일러가 아니며 전체 언어 의미와 표준 라이브러리를 지원하지 않습니다.
Worker 입력은 `{ source, language }`이고 실행 한도와 해제 방식은 동일합니다.

Acorn AST의 허용된 JavaScript 일부 문법을 `interpreter.ts`에서 해석하고 `code.worker.ts`에서 실행합니다.
변수, 숫자·불리언, 배열, 배열 인덱스·length, 사칙연산, for/for-of, if, activate를 지원합니다.
함수·클래스·임의 객체·외부 API·동적 코드는 허용하지 않습니다. 일부 언어 의미(블록 스코프·const 재할당 등)는 전체 JavaScript와 다릅니다.

구현 시 제한된 인터프리터 또는 별도로 검증한 실행 환경을 Worker 안에서 사용합니다.
Worker 자체는 보안 샌드박스나 강제 메모리 제한을 보장하지 않습니다.

- 페이지 또는 API 서버에서 사용자 코드를 `eval` / `new Function`으로 실행하지 않습니다.
- 실행 시간, 연산량, 입력 크기, 출력량을 제한합니다.
- 취소·시간 초과·화면 종료 시 Worker를 종료합니다.
- 실행 ID와 문제 ID로 오래된 결과를 무시합니다.
- 게임 상태와 네트워크에 직접 접근시키지 않고 검증된 결과만 전달합니다.
