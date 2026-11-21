import { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { python } from '@codemirror/lang-python';
import * as Blockly from 'blockly';
import type { Mode, Task } from '../content/chapter';
import { languages, starterCode } from '../content/languages';
import type { Language } from '../content/languages';
import {
  blockCode,
  inputBlockTypes,
  palettes,
  registerCommandBlocks,
  sendBlock,
} from './commandBlocks';

const noVariables: readonly string[] = [];

export default function CodePanel({
  mode,
  mobile,
  task,
  terminal,
  onClose,
  onSolved,
}: {
  mode: Mode;
  mobile: boolean;
  task: Task;
  terminal: string;
  onClose: () => void;
  onSolved: (source: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorView | null>(null);
  const workspace = useRef<Blockly.WorkspaceSvg | null>(null);
  const blocks = useRef<ReturnType<
    typeof Blockly.serialization.workspaces.save
  > | null>(null);
  const worker = useRef<Worker | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [language, setLanguage] = useState<Language>('javascript');
  const [useBlocks, setUseBlocks] = useState(
    mode === 'easy' || (mode === 'medium' && mobile),
  );
  const drafts = useRef<Partial<Record<Language, string>>>({});
  const [preview, setPreview] = useState('');
  const blockTask = useBlocks ? task.blocks : undefined;
  const variables = task.starter ?? noVariables;
  const exampleInput = Object.entries(task.tests[0]?.inputs ?? {});
  const booleanResult = typeof task.tests[0]?.expected === 'boolean';
  useEffect(() => {
    if (!host.current) return;
    if (blockTask) {
      registerCommandBlocks();
      const names = Object.entries(task.tests[0]?.inputs ?? {})
        .filter(([, value]) => typeof value === 'number')
        .map(([name]) => name);
      const view = Blockly.inject(host.current, {
        horizontalLayout: mobile,
        toolboxPosition: mobile ? 'end' : 'start',
        zoom: { startScale: mobile ? 0.9 : 1, pinch: true },
        toolbox: {
          kind: 'flyoutToolbox',
          contents: [...palettes[blockTask], ...inputBlockTypes(names)].map(
            (type) => ({ kind: 'block', type }),
          ),
        },
        maxBlocks: 28,
        trashcan: true,
        scrollbars: true,
      });
      workspace.current = view;
      if (blocks.current) {
        Blockly.serialization.workspaces.load(blocks.current, view);
      } else {
        const command = view.newBlock(sendBlock);
        command.initSvg();
        command.render();
        command.setDeletable(false);
        command.moveBy(28, 38);
      }
      const change = () => {
        setPreview(blockCode(view, language) ?? '');
      };
      view.addChangeListener(change);
      change();
      const resize = new ResizeObserver(() => Blockly.svgResize(view));
      resize.observe(host.current);
      return () => {
        blocks.current = Blockly.serialization.workspaces.save(view);
        resize.disconnect();
        view.dispose();
        workspace.current = null;
      };
    }
    const view = new EditorView({
      doc: drafts.current[language] ?? starterCode(language, variables),
      extensions: [
        basicSetup,
        language === 'python'
          ? python()
          : language === 'java'
            ? java()
            : language === 'c' || language === 'cpp'
              ? cpp()
              : javascript(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged)
            drafts.current[language] = update.state.doc.toString();
        }),
        EditorView.contentAttributes.of({
          'aria-label': '풀이 코드',
          inputmode: 'text',
          autocapitalize: 'off',
          autocomplete: 'off',
          spellcheck: 'false',
        }),
        EditorView.theme({
          '&': { height: '100%', fontSize: '16px' },
          '.cm-scroller': { overflow: 'auto' },
        }),
      ],
      parent: host.current,
    });
    editor.current = view;
    return () => {
      view.destroy();
      editor.current = null;
    };
  }, [blockTask, language, mobile, task.tests, variables]);
  useEffect(
    () => () => {
      worker.current?.terminate();
      if (timer.current) clearTimeout(timer.current);
      worker.current = null;
      timer.current = null;
    },
    [],
  );
  function run() {
    if (worker.current) return;
    let source = editor.current?.state.doc.toString() ?? '';
    if (blockTask) {
      const view = workspace.current;
      const command = view && blockCode(view, language);
      if (!command) {
        setMessage(
          '빈 칸을 채우고 모든 블록을 장치에 보내기 블록에 연결하세요.',
        );
        return;
      }
      source = command;
    }
    let instance: Worker;
    try {
      instance = new Worker(
        new URL('../runner/code.worker.ts', import.meta.url),
        {
          type: 'module',
        },
      );
    } catch {
      setMessage('실행기를 시작하지 못했어요. 다시 시도하세요.');
      return;
    }
    worker.current = instance;
    setBusy(true);
    setMessage('에너지를 확인하고 있어요…');
    const finish = () => {
      if (worker.current !== instance) return false;
      instance.terminate();
      worker.current = null;
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      setBusy(false);
      return true;
    };
    instance.onmessage = (
      event: MessageEvent<{ ok: boolean; message?: string }>,
    ) => {
      if (!finish()) return;
      if (!event.data.ok) setMessage(event.data.message ?? '실행 오류');
      else onSolved(source);
    };
    instance.onerror = () => {
      if (finish()) setMessage('실행기를 시작하지 못했어요. 다시 시도하세요.');
    };
    timer.current = setTimeout(() => {
      if (finish())
        setMessage('실행 시간이 초과됐어요. 반복 조건을 확인하세요.');
    }, 1500);
    try {
      instance.postMessage({
        source,
        language,
        tests: task.tests,
      });
    } catch {
      if (finish()) setMessage('실행 요청을 보내지 못했어요. 다시 시도하세요.');
    }
  }
  const tokens = [
    '(',
    ')',
    '+',
    '-',
    '*',
    '/',
    '%',
    '=',
    '<',
    '>=',
    '==',
    ...(exampleInput.some(([, value]) => Array.isArray(value))
      ? ['[', ']']
      : []),
    ...(language === 'python'
      ? [':', ' and ', ' or ']
      : ['{', '}', ';', '&&', '||']),
  ];
  function insertCode(text: string) {
    const view = editor.current;
    if (!view) return;
    view.dispatch(view.state.replaceSelection(text));
    view.focus();
  }
  return (
    <section
      className="modal code-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-title"
      aria-describedby="task-rule"
    >
      <div className="panel-top">
        <span className="eyebrow">{terminal}</span>
        <button onClick={onClose} aria-label="코딩창 닫기">
          닫기 · ESC
        </button>
      </div>
      <h2 id="task-title">{task.title}</h2>
      <div className="task-brief" id="task-rule">
        <p className="task-rule">
          <strong>{task.rule}</strong>
        </p>
        {exampleInput.length > 0 && (
          <div className="task-input">
            <strong>이번 문제의 예시 입력</strong>
            <ul>
              {exampleInput.map(([name, value]) => (
                <li key={name}>
                  <code>
                    {name} ={' '}
                    {Array.isArray(value)
                      ? `[${value.join(', ')}]`
                      : String(value)}
                  </code>
                </li>
              ))}
            </ul>
            <p>
              장치가 위 변수를 미리 넣어 줍니다. 실행할 때 값이 바뀌어도 같은
              규칙이 적용되어야 해요.
            </p>
          </div>
        )}
        <p className="task-hint">
          {blockTask ? (task.blockHint ?? task.hint) : task.hint}
          {blockTask && mobile && ['logic', 'choice'].includes(blockTask) && (
            <> 아래 도구상자를 옆으로 밀면 더 많은 블록이 보입니다.</>
          )}
          {booleanResult && !blockTask && (
            <>
              {' '}
              참·거짓은{' '}
              <code>
                {language === 'python' ? 'True / False' : 'true / false'}
              </code>
              로 표시됩니다.
            </>
          )}
        </p>
      </div>
      {mode === 'medium' && (mobile || useBlocks) && (
        <div className="editor-toggle" role="group" aria-label="풀이 입력 방식">
          {([true, false] as const).map((value) => (
            <button
              key={String(value)}
              type="button"
              aria-pressed={useBlocks === value}
              disabled={busy}
              onClick={() => {
                setUseBlocks(value);
                setMessage('');
              }}
            >
              {value ? '블록으로 풀기' : '코드로 풀기'}
            </button>
          ))}
        </div>
      )}
      <div className="language-row">
        <label htmlFor="code-language">프로그래밍 언어</label>
        <select
          id="code-language"
          disabled={busy}
          value={language}
          onChange={(event) => {
            setLanguage(event.target.value as Language);
            setMessage('');
          }}
        >
          {languages.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <span>
          {blockTask
            ? '블록을 연결하면 선택 언어의 명령을 보여줍니다.'
            : '언어를 바꿔도 작성 중인 코드는 보관됩니다.'}
        </span>
      </div>
      <p className="runtime-note">튜토리얼 문법을 브라우저에서 실행합니다.</p>
      <div
        className={blockTask ? 'editor editor--blocks' : 'editor editor--text'}
        ref={host}
      />
      {!blockTask && mobile && (
        <div
          className="symbol-keys"
          role="group"
          aria-label="코드 입력 보조 키"
        >
          {tokens.map((token) => (
            <button
              key={token}
              type="button"
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => insertCode(token)}
            >
              {token.trim()}
            </button>
          ))}
          <button
            type="button"
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => insertCode('    ')}
          >
            들여쓰기
          </button>
          <button
            type="button"
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => insertCode('\n')}
          >
            줄바꿈
          </button>
        </div>
      )}
      {blockTask && (
        <pre className="block-preview" aria-label="블록의 코드 표현">
          {preview || '블록을 연결하면 코드가 표시됩니다.'}
        </pre>
      )}
      <div className="panel-bottom">
        <p className="feedback" role="status">
          {message || '실행하면 작성한 명령이 장치에 전달됩니다.'}
        </p>
        <button className="primary" disabled={busy} onClick={run}>
          {busy ? '실행 중…' : '실행하기 ↗'}
        </button>
      </div>
    </section>
  );
}
