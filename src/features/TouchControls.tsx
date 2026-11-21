import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

export const mobileQuery = '(pointer: coarse), (max-width: 700px)';
export interface TouchInput {
  left: boolean;
  right: boolean;
  jump: boolean;
  interact: boolean;
}

const buttons = [
  { control: 'left', label: '왼쪽으로 이동', text: '←' },
  { control: 'right', label: '오른쪽으로 이동', text: '→' },
  { control: 'jump', label: '점프', text: '점프' },
  { control: 'interact', label: '가까운 대상 조사', text: '조사' },
] as const;

export default function TouchControls({
  input,
  locked,
}: {
  input: RefObject<TouchInput>;
  locked: boolean;
}) {
  const timers = useRef<
    Partial<Record<'left' | 'right', ReturnType<typeof setTimeout>>>
  >({});
  useEffect(() => {
    const held = timers.current;
    const controls = input.current;
    return () => {
      clearTimeout(held.left);
      clearTimeout(held.right);
      Object.assign(controls, {
        left: false,
        right: false,
        jump: false,
        interact: false,
      });
    };
  }, [input, locked]);
  return (
    <div className="touch-controls" role="group" aria-label="화면 조작">
      {buttons.map(({ control, label, text }) => {
        const movement = control === 'left' || control === 'right';
        const release = () => {
          if (movement) input.current[control] = false;
        };
        return (
          <button
            key={control}
            type="button"
            aria-label={label}
            disabled={locked}
            onContextMenu={(event) => event.preventDefault()}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              if (movement) clearTimeout(timers.current[control]);
              event.currentTarget.setPointerCapture(event.pointerId);
              event.currentTarget.focus({ preventScroll: true });
              input.current[control] = true;
            }}
            onPointerUp={release}
            onPointerCancel={release}
            onLostPointerCapture={release}
            onClick={(event) => {
              if (event.detail !== 0) return;
              input.current[control] = true;
              if (movement) {
                clearTimeout(timers.current[control]);
                timers.current[control] = setTimeout(release, 180);
              }
            }}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}
