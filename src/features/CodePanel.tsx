import { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { python } from '@codemirror/lang-python';
import * as Blockly from 'blockly';
import { chapter } from '../content/chapter';
import type { Mode } from '../content/chapter';
import { languages, starterCode } from '../content/languages';
import type { Language } from '../content/languages';

export default function CodePanel({
  mode,
  onClose,
  onSolved,
}: {
  mode: Mode;
  onClose: () => void;
  onSolved: () => void;
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
  const drafts = useRef<Partial<Record<Language, string>>>({});
  const [preview, setPreview] = useState('');
  const task = chapter.tasks[mode];
  useEffect(() => {
    if (!host.current) return;
    if (mode === 'easy') {
      if (!Blockly.Blocks['power_gate'])
        Blockly.Blocks['power_gate'] = {
          init(this: Blockly.Block) {
            this.appendDummyInput()
              .appendField('관문에 동력')
              .appendField(new Blockly.FieldNumber(0, 0, 100), 'POWER')
              .appendField('보내기');
            this.setColour(175);
            this.setPreviousStatement(true);
            this.setNextStatement(true);
          },
        };
      const view = Blockly.inject(host.current, {
        toolbox: {
          kind: 'flyoutToolbox',
          contents: [{ kind: 'block', type: 'power_gate' }],
        },
        trashcan: true,
        scrollbars: true,
      });
      workspace.current = view;
      if (blocks.current)
        Blockly.serialization.workspaces.load(blocks.current, view);
      const change = () => {
        const blocks = view.getAllBlocks(false);
        const power =
          blocks.length === 1 ? Number(blocks[0].getFieldValue('POWER')) : 0;
        setPreview(`activate(${power})${language === 'python' ? '' : ';'}`);
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
      doc: drafts.current[language] ?? starterCode(language, mode === 'hard'),
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
        EditorView.theme({
          '&': { height: '260px', fontSize: '14px' },
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
  }, [mode, language]);
  useEffect(
    () => () => {
      worker.current?.terminate();
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function run() {
    if (busy) return;
    let source = editor.current?.state.doc.toString() ?? '';
    if (mode === 'easy') {
      const blocks = workspace.current?.getAllBlocks(false) ?? [];
      if (blocks.length !== 1) {
        setMessage('동력 블록 하나를 작업 공간에 놓아 주세요.');
        return;
      }
      source = `activate(${Number(blocks[0].getFieldValue('POWER'))});`;
    }
    setBusy(true);
    setMessage('에너지를 확인하고 있어요…');
    const instance = new Worker(
      new URL('../runner/code.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker.current = instance;
    const finish = () => {
      instance.terminate();
      worker.current = null;
      if (timer.current) clearTimeout(timer.current);
      setBusy(false);
    };
    instance.onmessage = (
      event: MessageEvent<{ ok: boolean; value?: number; message?: string }>,
    ) => {
      finish();
      if (!event.data.ok) setMessage(event.data.message ?? '실행 오류');
      else if (event.data.value !== 12)
        setMessage(
          `보낸 에너지: ${event.data.value}. 관문에는 12가 필요해요. 코드를 고쳐 다시 시도하세요.`,
        );
      else onSolved();
    };
    instance.onerror = () => {
      finish();
      setMessage('실행기를 시작하지 못했어요. 다시 시도하세요.');
    };
    timer.current = setTimeout(() => {
      finish();
      setMessage('실행 시간이 초과됐어요. 반복 조건을 확인하세요.');
    }, 1500);
    instance.postMessage({
      source,
      language: mode === 'easy' ? 'javascript' : language,
    });
  }
  return (
    <section
      className="modal code-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-title"
    >
      <div className="panel-top">
        <span className="eyebrow">ANCIENT TERMINAL / 01</span>
        <button onClick={onClose} aria-label="코딩창 닫기">
          닫기 · ESC
        </button>
      </div>
      <h2 id="task-title">{task.title}</h2>
      <p>
        {mode === 'easy'
          ? task.description
          : mode === 'hard'
            ? '배열 [3, -2, 5, -7, 4]에서 양수만 합산해 activate(합계)를 호출하세요.'
            : '배열 [2, 4, 6]의 합을 구해 activate(합계)를 호출하세요.'}
      </p>
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
          {mode === 'easy'
            ? '블록을 연결하면 선택 언어의 명령을 보여줍니다.'
            : '언어를 바꿔도 작성 중인 코드는 보관됩니다.'}
        </span>
      </div>
      <p className="runtime-note">
        현재 튜토리얼은 정수 변수·배열·for·if·activate 문법만 로컬에서
        지원합니다. 정식 컴파일러는 이후 연결됩니다.
      </p>
      <div className="editor" ref={host} />
      {mode === 'easy' && (
        <pre className="block-preview" aria-label="블록의 코드 표현">
          {preview}
        </pre>
      )}
      <div className="panel-bottom">
        <p className="feedback" role="status">
          {message || '실행하면 작성한 명령이 관문에 전달됩니다.'}
        </p>
        <button className="primary" disabled={busy} onClick={run}>
          {busy ? '실행 중…' : '실행하기 ↗'}
        </button>
      </div>
    </section>
  );
}
