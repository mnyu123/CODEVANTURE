export type Language = 'c' | 'cpp' | 'java' | 'python' | 'javascript';
export const languages: { id: Language; label: string }[] = [
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
  { id: 'java', label: 'Java' },
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
];
export function starterCode(
  language: Language,
  variables: readonly string[],
): string {
  const answer = variables[0] ?? '0';
  if (language === 'python') {
    return [
      ...variables.map((variable) => `${variable} = 0`),
      `activate(${answer})`,
    ].join('\n');
  }
  const type = language === 'javascript' ? 'let' : 'int';
  const body = [
    ...variables.map((variable) => `${type} ${variable} = 0;`),
    `activate(${answer});`,
  ];
  if (language === 'javascript') return body.join('\n');
  if (language === 'java')
    return `public class Main {\n    public static void main(String[] args) {\n${body.map((line) => '        ' + line).join('\n')}\n    }\n}`;
  return `int main() {\n${body.map((line) => '    ' + line).join('\n')}\n    return 0;\n}`;
}
