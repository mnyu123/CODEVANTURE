/// <reference lib="webworker" />
import { interpret } from './interpreter';
import { normalizeSource } from './languageAdapter';
import type { Language } from '../content/languages';
self.onmessage = (
  event: MessageEvent<{ source: string; language: Language }>,
) => {
  try {
    self.postMessage({
      ok: true,
      value: interpret(normalizeSource(event.data.source, event.data.language)),
    });
  } catch (error) {
    self.postMessage({
      ok: false,
      message:
        error instanceof Error
          ? error.message.slice(0, 300)
          : '실행에 실패했어요.',
    });
  }
};
