import { lazy, Suspense, useEffect, useReducer, useState } from 'react';
import { chapter } from './content/chapter';
import type { Mode } from './content/chapter';
import { initialProgress, progression } from './game/progression';
const World = lazy(() => import('./game/World'));
const CodePanel = lazy(() => import('./features/CodePanel'));
export default function App() {
  const [state, dispatch] = useReducer(progression, initialProgress);
  const [key, setKey] = useState('');
  const [notice, setNotice] = useState(
    '동쪽으로 걸어가 기록의 수호자를 만나세요.',
  );
  const modal =
    state.phase === 'dialogue' ||
    state.phase === 'coding' ||
    state.phase === 'complete';
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dispatch({ type: 'close' });
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, []);
  if (state.phase === 'opening')
    return (
      <main className="opening">
        <form
          className="key-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (key === 'Hello World;') dispatch({ type: 'start' });
            else setKey('');
          }}
        >
          <label htmlFor="world-key">게임을 진행하려면 키를 입력하세요</label>
          <input
            id="world-key"
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={key}
            onChange={(event) => setKey(event.target.value)}
            aria-label="게임 시작 키"
          />
        </form>
      </main>
    );
  return (
    <main className="adventure">
      <header className="hud">
        <div className="brand">
          CODEVANTURE<span>THE FIRST LIGHT</span>
        </div>
        <div className="chapter-name">{chapter.title}</div>
        <label className="mode-label">
          플레이 모드
          <select
            aria-label="플레이 모드"
            value={state.mode}
            disabled={modal}
            onChange={(event) =>
              dispatch({ type: 'mode', mode: event.target.value as Mode })
            }
          >
            <option value="easy">쉬움 · 블록</option>
            <option value="medium">중간 · 코드</option>
            <option value="hard">어려움 · 코드</option>
            <option disabled>AI · 준비 중</option>
          </select>
        </label>
      </header>
      <div className="world-frame">
        <Suspense
          fallback={
            <div className="world-loading">세상이 깨어나고 있습니다…</div>
          }
        >
          <World
            locked={modal}
            gateOpen={state.gateOpen}
            onInteract={(target) => {
              if (target === 'guide') dispatch({ type: 'talk' });
              if (target === 'terminal') dispatch({ type: 'code' });
              if (target === 'exit') dispatch({ type: 'complete' });
            }}
          />
        </Suspense>
        <div className="quest">
          <span>현재 목표</span>
          <p>
            {state.gateOpen
              ? '열린 관문을 지나 동쪽 빛으로 이동하세요.'
              : notice}
          </p>
        </div>
        <div className="world-caption">
          잊힌 계곡 <span>THE FORGOTTEN VALLEY</span>
        </div>
      </div>
      <footer className="controls">
        <span>
          <kbd>←</kbd>
          <kbd>→</kbd> 또는 A · D 이동
        </span>
        <span>
          <kbd>SPACE</kbd> 점프
        </span>
        <span>
          <kbd>E</kbd> 상호작용
        </span>
        <span className="local-note">첫 번째 이야기 · 로컬 플레이</span>
      </footer>
      {modal && (
        <div className="overlay">
          {state.phase === 'dialogue' && (
            <section
              className="modal dialogue"
              role="dialog"
              aria-modal="true"
              aria-labelledby="dialogue-title"
            >
              <span className="eyebrow">THE KEEPER OF RECORDS</span>
              <h2 id="dialogue-title">기록의 수호자</h2>
              <p>{chapter.story}</p>
              <button
                className="primary"
                autoFocus
                onClick={() => {
                  setNotice('동쪽의 푸른 단말기를 조사해 관문을 복구하세요.');
                  dispatch({ type: 'close' });
                }}
              >
                단말기를 찾아볼게요 →
              </button>
            </section>
          )}
          {state.phase === 'coding' && (
            <Suspense
              fallback={<section className="modal">단말기에 연결 중…</section>}
            >
              <CodePanel
                mode={state.mode}
                onClose={() => dispatch({ type: 'close' })}
                onSolved={() => dispatch({ type: 'solved' })}
              />
            </Suspense>
          )}
          {state.phase === 'complete' && (
            <section
              className="modal ending"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ending-title"
            >
              <span className="eyebrow">CHAPTER 01 / COMPLETE</span>
              <h2 id="ending-title">다시 흐르기 시작한 빛</h2>
              <p>
                당신이 작성한 명령으로 잠든 관문이 깨어났습니다.
                <br />첫 번째 모험을 완료했어요. 다음 이야기는 이 길 너머에서
                이어집니다.
              </p>
              <button
                className="primary"
                autoFocus
                onClick={() => window.location.reload()}
              >
                처음부터 다시
              </button>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
