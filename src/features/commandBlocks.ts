import * as Blockly from 'blockly';
import type { Task } from '../content/chapter';
import type { Language } from '../content/languages';

export const sendBlock = 'send_light';
export const palettes: Record<NonNullable<Task['blocks']>, string[]> = {
  arithmetic: ['light_number', 'light_calculation'],
  remainder: ['light_number', 'light_remainder'],
  logic: ['light_number', 'light_comparison', 'light_logic'],
  choice: ['light_number', 'light_comparison', 'light_choose'],
  array: ['light_array'],
  arrayFilter: ['light_number', 'light_array_threshold'],
};

export function registerCommandBlocks() {
  if (Blockly.Blocks[sendBlock]) return;
  Blockly.defineBlocksWithJsonArray([
    {
      type: sendBlock,
      message0: '장치에 보내기 %1',
      args0: [{ type: 'input_value', name: 'VALUE' }],
      colour: 174,
    },
    {
      type: 'light_number',
      message0: '%1',
      args0: [{ type: 'field_number', name: 'NUMBER', value: 0, precision: 1 }],
      output: 'Number',
      colour: 222,
    },
    {
      type: 'light_calculation',
      message0: '%1 %2 %3',
      args0: [
        { type: 'input_value', name: 'LEFT', check: 'Number' },
        {
          type: 'field_dropdown',
          name: 'SIGN',
          options: [
            ['+', '+'],
            ['−', '-'],
            ['×', '*'],
          ],
        },
        { type: 'input_value', name: 'RIGHT', check: 'Number' },
      ],
      inputsInline: true,
      output: 'Number',
      colour: 222,
    },
    {
      type: 'light_remainder',
      message0: '%1 나누기 %2 의 나머지',
      args0: [
        { type: 'input_value', name: 'LEFT', check: 'Number' },
        { type: 'input_value', name: 'RIGHT', check: 'Number' },
      ],
      inputsInline: true,
      output: 'Number',
      colour: 222,
    },
    {
      type: 'light_comparison',
      message0: '%1 %2 %3',
      args0: [
        { type: 'input_value', name: 'LEFT', check: 'Number' },
        {
          type: 'field_dropdown',
          name: 'SIGN',
          options: [
            ['≥', '>='],
            ['≤', '<='],
            ['=', '=='],
            ['>', '>'],
            ['<', '<'],
          ],
        },
        { type: 'input_value', name: 'RIGHT', check: 'Number' },
      ],
      inputsInline: true,
      output: 'Boolean',
      colour: 270,
    },
    {
      type: 'light_logic',
      message0: '%1 %2 %3',
      args0: [
        { type: 'input_value', name: 'LEFT', check: 'Boolean' },
        {
          type: 'field_dropdown',
          name: 'SIGN',
          options: [
            ['그리고', '&&'],
            ['또는', '||'],
          ],
        },
        { type: 'input_value', name: 'RIGHT', check: 'Boolean' },
      ],
      inputsInline: false,
      output: 'Boolean',
      colour: 270,
    },
    {
      type: 'light_choose',
      message0: '%1 이면 %2 아니면 %3',
      args0: [
        { type: 'input_value', name: 'CONDITION', check: 'Boolean' },
        { type: 'input_value', name: 'MATCH', check: 'Number' },
        { type: 'input_value', name: 'OTHER', check: 'Number' },
      ],
      output: 'Number',
      colour: 270,
    },
    {
      type: 'light_array',
      message0: 'energy의 %1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'METRIC',
          options: [
            ['개수', 'count'],
            ['합계', 'sum'],
          ],
        },
      ],
      output: 'Number',
      colour: 45,
    },
    {
      type: 'light_array_threshold',
      message0: 'energy에서 %1 이상인 값의 개수',
      args0: [{ type: 'input_value', name: 'THRESHOLD', check: 'Number' }],
      output: 'Number',
      colour: 45,
    },
  ]);
}

const inputPrefix = 'light_input_';
export function inputBlockTypes(names: readonly string[]): string[] {
  return names.map((name) => {
    const type = inputPrefix + name;
    if (!Blockly.Blocks[type])
      Blockly.defineBlocksWithJsonArray([
        { type, message0: name, output: 'Number', colour: 196 },
      ]);
    return type;
  });
}

function expression(
  block: Blockly.Block | null,
  language: Language,
): string | null {
  if (!block) return null;
  if (block.type === 'light_number')
    return String(block.getFieldValue('NUMBER'));
  if (block.type.startsWith(inputPrefix))
    return block.type.slice(inputPrefix.length);
  if (
    ![
      'light_calculation',
      'light_remainder',
      'light_comparison',
      'light_logic',
    ].includes(block.type)
  )
    return null;
  const left = expression(block.getInputTargetBlock('LEFT'), language);
  const right = expression(block.getInputTargetBlock('RIGHT'), language);
  let sign =
    block.type === 'light_remainder' ? '%' : block.getFieldValue('SIGN');
  if (language === 'python' && block.type === 'light_logic')
    sign = sign === '&&' ? 'and' : 'or';
  return left && right ? `(${left} ${sign} ${right})` : null;
}

export function blockCode(
  view: Blockly.Workspace,
  language: Language,
): string | null {
  const roots = view.getTopBlocks(false);
  if (roots.length !== 1 || roots[0].type !== sendBlock) return null;
  const block = roots[0].getInputTargetBlock('VALUE');
  const suffix = language === 'python' ? '' : ';';
  if (block?.type === 'light_choose') {
    const condition = expression(
      block.getInputTargetBlock('CONDITION'),
      language,
    );
    const match = expression(block.getInputTargetBlock('MATCH'), language);
    const other = expression(block.getInputTargetBlock('OTHER'), language);
    if (!condition || !match || !other) return null;
    return language === 'python'
      ? `if ${condition}:\n    activate(${match})\nelse:\n    activate(${other})`
      : `if (${condition}) {\n    activate(${match});\n} else {\n    activate(${other});\n}`;
  }
  if (block?.type === 'light_array_threshold') {
    const threshold = expression(
      block.getInputTargetBlock('THRESHOLD'),
      language,
    );
    if (!threshold) return null;
    if (language === 'python')
      return `count = 0\nfor value in energy:\n    if value >= ${threshold}:\n        count += 1\nactivate(count)`;
    const type = language === 'javascript' ? 'let' : 'int';
    return `${type} count = 0;\nfor (${type} i = 0; i < energyCount; i++) {\n    if (energy[i] >= ${threshold}) {\n        count += 1;\n    }\n}\nactivate(count);`;
  }
  if (block?.type === 'light_array') {
    if (block.getFieldValue('METRIC') === 'count')
      return `activate(energyCount)${suffix}`;
    if (language === 'python')
      return 'total = 0\nfor value in energy:\n    total += value\nactivate(total)';
    const type = language === 'javascript' ? 'let' : 'int';
    return [
      `${type} total = 0;`,
      `for (${type} i = 0; i < energyCount; i++) {`,
      '    total += energy[i];',
      '}',
      'activate(total);',
    ].join('\n');
  }
  const value = expression(block, language);
  return value ? `activate(${value})${suffix}` : null;
}
