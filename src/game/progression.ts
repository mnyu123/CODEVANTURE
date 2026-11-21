import { stages } from '../content/chapter.ts';
import type { Mode, StageId } from '../content/chapter.ts';
export type Phase =
  | 'difficulty'
  | 'opening'
  | 'explore'
  | 'dialogue'
  | 'coding'
  | 'resolving'
  | 'complete';
export interface Progress {
  phase: Phase;
  mode: Mode | null;
  stage: StageId;
  obstacleCleared: boolean;
  metGuide: boolean;
  codeLines: readonly string[];
}
export type Action =
  | { type: 'start' | 'talk' | 'close' | 'code' | 'exit' }
  | { type: 'solved'; stage: StageId; source: string }
  | { type: 'resolved'; stage: StageId }
  | { type: 'mode'; mode: Mode };
export const initialProgress: Progress = {
  phase: 'difficulty',
  mode: null,
  stage: 'valley',
  obstacleCleared: false,
  metGuide: false,
  codeLines: [],
};

function resolutionLines(source: string): string[] {
  const lines = source
    .slice(0, 6000)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^(?:\/\/|#|[{}]+$)/.test(line))
    .map((line) => (line.length > 54 ? line.slice(0, 53) + '…' : line));
  return lines.length > 6
    ? [...lines.slice(0, 5), lines[lines.length - 1]]
    : lines;
}

export function progression(state: Progress, action: Action): Progress {
  switch (action.type) {
    case 'start':
      return state.phase === 'opening' && state.mode
        ? { ...state, phase: 'explore' }
        : state;
    case 'talk':
      return state.phase === 'explore'
        ? { ...state, phase: 'dialogue', metGuide: true }
        : state;
    case 'code':
      return state.phase === 'explore' && !state.obstacleCleared
        ? { ...state, phase: 'coding' }
        : state;
    case 'close':
      return state.phase === 'dialogue' || state.phase === 'coding'
        ? { ...state, phase: 'explore' }
        : state;
    case 'mode':
      return state.phase === 'difficulty' ||
        state.phase === 'opening' ||
        state.phase === 'explore'
        ? {
            ...state,
            mode: action.mode,
            phase: state.phase === 'difficulty' ? 'opening' : state.phase,
          }
        : state;
    case 'solved':
      return state.phase === 'coding' && state.stage === action.stage
        ? {
            ...state,
            phase: 'resolving',
            codeLines: resolutionLines(action.source),
          }
        : state;
    case 'resolved':
      return state.phase === 'resolving' && state.stage === action.stage
        ? { ...state, phase: 'explore', obstacleCleared: true, codeLines: [] }
        : state;
    case 'exit': {
      if (state.phase !== 'explore' || !state.obstacleCleared) return state;
      const next = stages[state.stage].next;
      return next
        ? { ...state, stage: next, obstacleCleared: false, metGuide: false }
        : { ...state, phase: 'complete' };
    }
  }
}
