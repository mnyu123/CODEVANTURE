/// <reference lib="webworker" />
import { grade } from './interpreter';
import { normalizeSource } from './languageAdapter';
import type { TestCase } from '../content/chapter';
import type { Language } from '../content/languages';
self.onmessage = (
  event: MessageEvent<{
    source: string;
    language: Language;
    tests: TestCase[];
  }>,
) => {
  try {
    const { source, language, tests } = event.data;
    grade(normalizeSource(source, language), tests);
    self.postMessage({ ok: true });
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
