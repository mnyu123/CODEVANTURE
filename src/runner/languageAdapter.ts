// This is a tutorial syntax adapter, not a compiler or a complete language runtime.
import type { Language } from '../content/languages';

function pythonSource(source: string): string {
  const output: string[] = [];
  const indents = [0];
  const assigned = new Set<string>();
  let expectsBody = false;
  const expression = (text: string): string =>
    text
      .replace(/\blen\(\s*([A-Za-z_]\w*)\s*\)/g, '$1.length')
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\band\b/g, '&&')
      .replace(/\bor\b/g, '||');
  for (const original of source.split(/\r?\n/)) {
    const line = original.replace(/#.*$/, '').trimEnd();
    if (!line.trim()) continue;
    if (line.includes('\t'))
      throw new Error('들여쓰기는 탭 대신 공백을 사용하세요.');
    const indent = line.length - line.trimStart().length;
    if (expectsBody) {
      if (indent <= indents[indents.length - 1])
        throw new Error('반복문·조건문 안을 들여쓰기 하세요.');
      indents.push(indent);
    } else if (indent > indents[indents.length - 1])
      throw new Error('예상하지 않은 들여쓰기예요.');
    while (indent < indents[indents.length - 1]) {
      indents.pop();
      output.push('}');
    }
    if (indent !== indents[indents.length - 1])
      throw new Error('들여쓰기 깊이를 맞춰 주세요.');
    expectsBody = false;
    const text = line.trim();
    let match: RegExpMatchArray | null;
    if (
      (match = text.match(/^for\s+([A-Za-z_]\w*)\s+in\s+range\((.*)\)\s*:\s*$/))
    ) {
      const args = match[2].split(',').map((part) => expression(part.trim()));
      if (args.length < 1 || args.length > 2 || args.some((arg) => !arg))
        throw new Error('range는 끝값 또는 시작값·끝값만 지원해요.');
      const [start, end] = args.length === 1 ? ['0', args[0]] : args;
      output.push(
        `for(let ${match[1]}=${start};${match[1]}<${end};${match[1]}++){`,
      );
      expectsBody = true;
    } else if ((match = text.match(/^for\s+([A-Za-z_]\w*)\s+in\s+(.+):\s*$/))) {
      output.push(`for(const ${match[1]} of ${expression(match[2])}){`);
      expectsBody = true;
    } else if ((match = text.match(/^if\s+(.+):\s*$/))) {
      output.push(`if(${expression(match[1])}){`);
      expectsBody = true;
    } else if ((match = text.match(/^elif\s+(.+):\s*$/))) {
      output.push(`else if(${expression(match[1])}){`);
      expectsBody = true;
    } else if (text === 'else:') {
      output.push('else{');
      expectsBody = true;
    } else if (text === 'pass') output.push(';');
    else if ((match = text.match(/^([A-Za-z_]\w*)\s*=([^=].*)$/))) {
      assigned.add(match[1]);
      output.push(`${match[1]}=${expression(match[2])};`);
    } else if (
      /^[A-Za-z_]\w*\s*\+=/.test(text) ||
      /^activate\(.*\)$/.test(text)
    )
      output.push(`${expression(text)};`);
    else
      throw new Error(
        '현재 Python 튜토리얼은 변수·배열·for·range·if·activate만 지원해요.',
      );
  }
  if (expectsBody) throw new Error('반복문·조건문의 본문이 필요해요.');
  while (indents.length > 1) {
    indents.pop();
    output.push('}');
  }
  return [...Array.from(assigned, (name) => `var ${name};`), ...output].join(
    '\n',
  );
}
export function normalizeSource(source: string, language: Language): string {
  if (source.length > 6000)
    throw new Error('코드는 6,000자까지 입력할 수 있어요.');
  if (language === 'javascript') return source;
  if (language === 'python') return pythonSource(source);
  let text = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\r\n]*/g, '')
    .trim();
  if (language === 'java') {
    const wrapped = text.match(
      /^public\s+class\s+Main\s*\{\s*public\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s+args\s*\)\s*\{([\s\S]*)\}\s*\}$/,
    );
    if (wrapped) text = wrapped[1];
  } else {
    const wrapped = text.match(
      /^int\s+main\s*\(\s*(?:void)?\s*\)\s*\{([\s\S]*)\}$/,
    );
    if (wrapped) text = wrapped[1].replace(/return\s+0\s*;\s*$/, '');
  }
  // Validate the input alphabet before transforming the supported declarations.
  if (!/^[\w\s[\]{}();,.+*/%<>=!&|:-]*$/.test(text))
    throw new Error('현재 튜토리얼에서 지원하지 않는 문자예요.');
  text = text.replace(
    /\bint\s*\[\s*\]\s*(\w+)\s*=\s*\{([^{}]*)\}/g,
    'let $1 = [$2]',
  );
  text = text.replace(
    /\bint\s+(\w+)\s*\[\s*\d*\s*\]\s*=\s*\{([^{}]*)\}/g,
    'let $1 = [$2]',
  );
  text = text.replace(
    /\bfor\s*\(\s*int\s+(\w+)\s*:\s*(\w+)\s*\)/g,
    'for (const $1 of $2)',
  );
  text = text.replace(/\b(?:int|bool|boolean|_Bool)\s+(\w+)/g, 'let $1');
  // The AST interpreter still rejects functions, calls to host APIs and object access.
  return text;
}
