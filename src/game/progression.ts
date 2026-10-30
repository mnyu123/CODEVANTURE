import type { Mode } from '../content/chapter';
export type Phase = 'opening' | 'explore' | 'dialogue' | 'coding' | 'complete';
export interface Progress {
  phase: Phase;
  mode: Mode;
  gateOpen: boolean;
}
export type Action =
  | { type: 'start' | 'talk' | 'close' | 'code' | 'solved' | 'complete' }
  | { type: 'mode'; mode: Mode };
export const initialProgress: Progress = {
  phase: 'opening',
  mode: 'medium',
  gateOpen: false,
};
export function progression(state: Progress, action: Action): Progress {
  switch (action.type) {
    case 'start':
      return state.phase === 'opening' ? { ...state, phase: 'explore' } : state;
    case 'talk':
      return state.phase === 'explore'
        ? { ...state, phase: 'dialogue' }
        : state;
    case 'code':
      return state.phase === 'explore' && !state.gateOpen
        ? { ...state, phase: 'coding' }
        : state;
    case 'close':
      return state.phase === 'dialogue' || state.phase === 'coding'
        ? { ...state, phase: 'explore' }
        : state;
    case 'mode':
      return state.phase !== 'complete'
        ? { ...state, mode: action.mode }
        : state;
    case 'solved':
      return state.phase === 'coding'
        ? { ...state, gateOpen: true, phase: 'explore' }
        : state;
    case 'complete':
      return state.phase === 'explore' && state.gateOpen
        ? { ...state, phase: 'complete' }
        : state;
  }
}
