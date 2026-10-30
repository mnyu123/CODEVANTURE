/// <reference lib="webworker" />
import { interpret } from './interpreter';
self.onmessage = (event: MessageEvent<string>) => {
  try {
    self.postMessage({ ok: true, value: interpret(event.data) });
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
