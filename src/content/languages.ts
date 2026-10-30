export type Language = 'c' | 'cpp' | 'java' | 'python' | 'javascript';
export const languages: { id: Language; label: string }[] = [
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
  { id: 'java', label: 'Java' },
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
];
export function starterCode(language: Language, hard: boolean): string {
  const values = hard ? '3, -2, 5, -7, 4' : '2, 4, 6';
  const comment = hard ? '양수 에너지만 합산하세요.' : '에너지를 합산하세요.';
  if (language === 'python')
    return `energy = [${values}]\ntotal = 0\n\n# ${comment}\n\nactivate(total)`;
  if (language === 'javascript')
    return `const energy = [${values}];\nlet total = 0;\n\n// ${comment}\n\nactivate(total);`;
  if (language === 'java')
    return `public class Main {\n    public static void main(String[] args) {\n        int[] energy = {${values}};\n        int total = 0;\n\n        // ${comment}\n\n        activate(total);\n    }\n}`;
  return `int main() {\n    int energy[] = {${values}};\n    int total = 0;\n\n    // ${comment}\n\n    activate(total);\n    return 0;\n}`;
}
