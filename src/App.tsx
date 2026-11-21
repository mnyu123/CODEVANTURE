import { lazy, Suspense, useEffect, useReducer, useRef, useState } from 'react';
import { stages } from './content/chapter';
import type { Mode } from './content/chapter';
import { initialProgress, progression } from './game/progression';
import Difficulty from './features/Difficulty';
import TouchControls, { mobileQuery } from './features/TouchControls';
import type { TouchInput } from './features/TouchControls';
const World = lazy(() => import('./game/World'));
const CodePanel = lazy(() => import('./features/CodePanel'));
export default function App() {
  const [state, dispatch] = useReducer(progression, initialProgress);
  const [key, setKey] = useState('');
  const [mobile, setMobile] = useState(
    () => window.matchMedia(mobileQuery).matches,
  );
  const touch = useRef<TouchInput>({
    left: false,
    right: false,
    jump: false,
    interact: false,
  });
  const stage = stages[state.stage];
  const resolving = state.phase === 'resolving';
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
  useEffect(() => {
    const query = window.matchMedia(mobileQuery);
    const update = () => setMobile(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  if (state.phase === 'difficulty' || !state.mode)
    return <Difficulty onSelect={(mode) => dispatch({ type: 'mode', mode })} />;
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
          <div className="key-entry">
            <input
              id="world-key"
              autoFocus
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              inputMode="text"
              enterKeyHint="go"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              aria-label="게임 시작 키"
            />
            <button className="key-submit" aria-label="게임 시작" type="submit">
              →
            </button>
          </div>
        </form>
      </main>
    );
  return (
    <main className="adventure">
      <header className="hud">
        <div className="brand">
          CODEVANTURE<span>THE FIRST LIGHT</span>
        </div>
        <div className="chapter-name">{stage.title}</div>
        <label className="mode-label">
          플레이 모드
          <select
            aria-label="플레이 모드"
            value={state.mode}
            disabled={modal || resolving}
            onChange={(event) => {
              dispatch({ type: 'mode', mode: event.target.value as Mode });
              event.currentTarget.blur();
            }}
          >
            <option value="easy">쉬움 · 블록</option>
            <option value="medium">
              {mobile ? '중간 · 블록/코드' : '중간 · 코드'}
            </option>
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
            key={state.stage}
            stageId={state.stage}
            locked={modal || resolving}
            obstacleCleared={state.obstacleCleared}
            touch={touch}
            codeLines={resolving ? state.codeLines : null}
            onResolved={() =>
              dispatch({ type: 'resolved', stage: state.stage })
            }
            onInteract={(target) => {
              if (target === 'guide') dispatch({ type: 'talk' });
              if (target === 'terminal') dispatch({ type: 'code' });
              if (target === 'exit') dispatch({ type: 'exit' });
            }}
          />
        </Suspense>
        <div className="quest">
          <span>현재 목표</span>
          <p role="status">
            {resolving
              ? '정답 · 작성한 명령을 장치에 전송하는 중'
              : state.obstacleCleared
                ? stage.exitObjective
                : state.metGuide
                  ? stage.terminalObjective
                  : stage.guideObjective}
          </p>
        </div>
        <div className="world-caption">
          {stage.place} <span>{stage.subtitle}</span>
        </div>
      </div>
      <TouchControls input={touch} locked={modal || resolving} />
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
        <span className="local-note">싱글 플레이</span>
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
              <span className="eyebrow">{stage.place}</span>
              <h2 id="dialogue-title">{stage.guide}</h2>
              <p>{stage.story}</p>
              <button
                className="primary"
                autoFocus
                onClick={() => dispatch({ type: 'close' })}
              >
                장치를 찾아볼게요 →
              </button>
            </section>
          )}
          {state.phase === 'coding' && (
            <Suspense
              fallback={<section className="modal">단말기에 연결 중…</section>}
            >
              <CodePanel
                mode={state.mode}
                mobile={mobile}
                task={stage.tasks[state.mode]}
                terminal={stage.terminal}
                onClose={() => dispatch({ type: 'close' })}
                onSolved={(source) =>
                  dispatch({ type: 'solved', stage: state.stage, source })
                }
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
              <span className="eyebrow">CHAPTER 05 / COMPLETE</span>
              <h2 id="ending-title">다시 흐르기 시작한 빛</h2>
              <p>
                당신의 명령으로 관문 너머의 길과 별빛이 다시 이어졌습니다.
                <br />
                관측소의 봉화가 켜졌어요. 다섯 지역의 모험을 모두 완료했습니다.
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
