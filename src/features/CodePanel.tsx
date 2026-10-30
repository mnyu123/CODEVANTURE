import { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import * as Blockly from 'blockly';
import { chapter } from '../content/chapter';
import type { Mode } from '../content/chapter';

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
  const worker = useRef<Worker | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
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
      const resize = new ResizeObserver(() => Blockly.svgResize(view));
      resize.observe(host.current);
      return () => {
        resize.disconnect();
        view.dispose();
        workspace.current = null;
      };
    }
    const view = new EditorView({
      doc: task.starter,
      extensions: [
        basicSetup,
        javascript(),
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
  }, [mode, task.starter]);
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
    instance.postMessage(source);
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
      <p>{task.description}</p>
      <div className="editor" ref={host} />
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
