import test from 'node:test';
import assert from 'node:assert/strict';
import * as Blockly from 'blockly';
import { normalizeSource } from '../src/runner/languageAdapter.ts';
import { grade, interpret } from '../src/runner/interpreter.ts';
import { starterCode, languages } from '../src/content/languages.ts';
import { stages } from '../src/content/chapter.ts';
import { initialProgress, progression } from '../src/game/progression.ts';
import type { StageId } from '../src/content/chapter.ts';
import {
  blockCode,
  inputBlockTypes,
  registerCommandBlocks,
  sendBlock,
} from '../src/features/commandBlocks.ts';
const solutions = {
  javascript:
    'const energy=[3,-2,5,-7,4];let total=0;for(const x of energy){if(x>0){total+=x;}}activate(total);',
  c: 'int main(){int energy[]={3,-2,5,-7,4};int total=0;for(int i=0;i<5;i++){if(energy[i]>0){total+=energy[i];}}activate(total);return 0;}',
  cpp: 'int main(){int energy[]={3,-2,5,-7,4};int total=0;for(int x : energy){if(x>0){total+=x;}}activate(total);return 0;}',
  java: 'public class Main {public static void main(String[] args){int[] energy={3,-2,5,-7,4};int total=0;for(int x : energy){if(x>0){total+=x;}}activate(total);}}',
  python:
    'energy = [3,-2,5,-7,4]\ntotal = 0\nfor x in energy:\n    if x > 0:\n        total += x\nactivate(total)',
};
for (const language of languages) {
  test(`${language.label}: starter parses, solution runs and host access is blocked`, () => {
    assert.equal(
      interpret(normalizeSource(starterCode(language.id, []), language.id)),
      0,
    );
    assert.equal(
      interpret(
        normalizeSource(
          starterCode(language.id, ['longest', 'streak']),
          language.id,
        ),
      ),
      0,
    );
    assert.equal(
      interpret(normalizeSource(solutions[language.id], language.id)),
      12,
    );
    assert.throws(() => interpret(normalizeSource('fetch(1);', language.id)));
    assert.throws(() => normalizeSource(' '.repeat(6001), language.id));
  });
}
test('Python indentation, ranges and else are bounded and validated', () => {
  assert.equal(
    interpret(
      normalizeSource(
        'energy=[2,4,6]\ntotal=0\nfor i in range(len(energy)):\n    total += energy[i]\nactivate(total)',
        'python',
      ),
    ),
    12,
  );
  assert.equal(
    interpret(
      normalizeSource(
        'x=1\nif x>0:\n    activate(12)\nelse:\n    activate(0)',
        'python',
      ),
    ),
    12,
  );
  assert.throws(
    () =>
      interpret(
        normalizeSource(
          'for i in range(100000):\n    pass\nactivate(12)',
          'python',
        ),
      ),
    /한도/,
  );
  assert.throws(() => normalizeSource('for x in [1]:\nactivate(x)', 'python'));
  assert.equal(
    interpret(
      normalizeSource('signal = 0\nsignal = 2\nactivate(signal)', 'python'),
    ),
    2,
  );
});
test('difficulty is required before opening and selected mode is preserved', () => {
  assert.equal(initialProgress.mode, null);
  assert.equal(
    progression(initialProgress, { type: 'start' }).phase,
    'difficulty',
  );
  const selected = progression(initialProgress, { type: 'mode', mode: 'hard' });
  assert.equal(selected.phase, 'opening');
  assert.equal(progression(selected, { type: 'start' }).mode, 'hard');
});
test('five stages keep the difficulty and require the result animation before each exit', () => {
  const selected = progression(initialProgress, { type: 'mode', mode: 'hard' });
  let progress = progression(selected, { type: 'start' });
  const journey: StageId[] = [
    'valley',
    'ravine',
    'sluice',
    'mirrors',
    'beacon',
  ];
  for (const stage of journey) {
    const otherStage = stage === 'valley' ? 'ravine' : 'valley';
    assert.equal(progress.stage, stage);
    assert.equal(progress.phase, 'explore');
    assert.equal(progress.mode, 'hard');
    assert.equal(progress.obstacleCleared, false);
    assert.equal(progression(progress, { type: 'exit' }), progress);
    const coding = progression(progress, { type: 'code' });
    const source =
      '// The player enters a simple expression\n  activate(7 + 5);  ';
    assert.equal(
      progression(coding, { type: 'solved', stage: otherStage, source }),
      coding,
    );
    const resolving = progression(coding, { type: 'solved', stage, source });
    assert.equal(resolving.phase, 'resolving');
    assert.deepEqual(resolving.codeLines, ['activate(7 + 5);']);
    assert.equal(progression(resolving, { type: 'exit' }), resolving);
    assert.equal(
      progression(resolving, { type: 'resolved', stage: otherStage }),
      resolving,
    );
    const restored = progression(resolving, { type: 'resolved', stage });
    assert.equal(restored.obstacleCleared, true);
    assert.deepEqual(restored.codeLines, []);
    progress = progression(restored, { type: 'exit' });
  }
  assert.equal(progress.phase, 'complete');
});
test('array inputs appear in stage five in every mode', () => {
  for (const [id, stage] of Object.entries(stages)) {
    for (const task of Object.values(stage.tasks)) {
      for (const input of task.tests) {
        assert.equal(
          Object.values(input.inputs ?? {}).some(Array.isArray),
          id === 'beacon',
        );
      }
    }
  }
});
test('scalar and array challenges can be solved with all five tutorial adapters', () => {
  for (const { id } of languages) {
    const python = id === 'python';
    const int = id === 'javascript' ? 'let' : 'int';
    const direct = [
      [stages.valley.tasks.medium, '7 + 5'],
      [stages.valley.tasks.hard, '5 + 3 * 4'],
      [stages.ravine.tasks.medium, 'left >= 5 && right >= 5'],
      [
        stages.ravine.tasks.hard,
        '(left >= 8 || right >= 8) && left + right >= 14',
      ],
      [stages.sluice.tasks.medium, 'teeth % group'],
      [stages.sluice.tasks.hard, 'pressure >= 8 && teeth % group == 0'],
    ] as const;
    for (const [task, answer] of direct) {
      const expression = python
        ? answer.replaceAll('&&', 'and').replaceAll('||', 'or')
        : answer;
      const source = starterCode(id, []).replace(
        'activate(0)',
        `activate(${expression})`,
      );
      grade(normalizeSource(source, id), task.tests);
    }
    const statements = [
      [
        stages.mirrors.tasks.medium,
        'signal',
        python
          ? 'if light >= 8:\n    signal = 2\nelse:\n    signal = 1'
          : 'if (light >= 8) { signal = 2; } else { signal = 1; }',
      ],
      [
        stages.mirrors.tasks.hard,
        'signal',
        python
          ? 'if light >= 12:\n    signal = 3\nelif light >= 6:\n    signal = 2\nelse:\n    signal = 1'
          : 'if (light >= 12) { signal = 3; } else if (light >= 6) { signal = 2; } else { signal = 1; }',
      ],
      [
        stages.beacon.tasks.medium,
        'count',
        python
          ? 'for value in energy:\n    if value >= 5:\n        count += 1'
          : `for (${int} i = 0; i < energyCount; i++) { if (energy[i] >= 5) { count += 1; } }`,
      ],
      [
        stages.beacon.tasks.hard,
        'longest',
        python
          ? 'for value in energy:\n    if value >= 5:\n        streak += 1\n        if streak > longest:\n            longest = streak\n    else:\n        streak = 0'
          : `for (${int} i = 0; i < energyCount; i++) { if (energy[i] >= 5) { streak += 1; if (streak > longest) { longest = streak; } } else { streak = 0; } }`,
      ],
    ] as const;
    for (const [task, variable, body] of statements) {
      const activate = `activate(${variable})`;
      const source = starterCode(id, task.starter).replace(
        activate,
        `${body}\n${activate}`,
      );
      grade(normalizeSource(source, id), task.tests);
    }
  }
  assert.throws(
    () => grade('activate(true);', stages.ravine.tasks.medium.tests),
    /입력 2/,
  );
  assert.throws(
    () => grade('activate(3);', stages.beacon.tasks.hard.tests),
    /입력 3/,
  );
  assert.equal(interpret('activate(false && missing);'), false);
});

test('mobile block editors generate a valid solution in all five languages and stages', () => {
  registerCommandBlocks();
  const [left, right, teeth, group, light] = inputBlockTypes([
    'left',
    'right',
    'teeth',
    'group',
    'light',
  ]);
  const number = (value: number) => ({
    block: { type: 'light_number', fields: { NUMBER: value } },
  });
  const input = (type: string) => ({ block: { type } });
  const comparison = (type: string, threshold: number) => ({
    block: {
      type: 'light_comparison',
      inputs: { LEFT: input(type), RIGHT: number(threshold) },
    },
  });
  const mobileCommands = {
    valley: {
      type: 'light_calculation',
      inputs: { LEFT: number(7), RIGHT: number(5) },
    },
    ravine: {
      type: 'light_logic',
      inputs: { LEFT: comparison(left, 5), RIGHT: comparison(right, 5) },
    },
    sluice: {
      type: 'light_remainder',
      inputs: { LEFT: input(teeth), RIGHT: input(group) },
    },
    mirrors: {
      type: 'light_choose',
      inputs: {
        CONDITION: comparison(light, 8),
        MATCH: number(2),
        OTHER: number(1),
      },
    },
    beacon: { type: 'light_array_threshold', inputs: { THRESHOLD: number(5) } },
  };
  for (const id of Object.keys(mobileCommands) as StageId[]) {
    const workspace = new Blockly.Workspace();
    try {
      Blockly.serialization.blocks.append(
        {
          type: sendBlock,
          inputs: { VALUE: { block: mobileCommands[id] } },
        },
        workspace,
      );
      for (const language of languages) {
        const source = blockCode(workspace, language.id);
        assert.ok(source, `${id} / ${language.label}`);
        grade(
          normalizeSource(source, language.id),
          stages[id].tasks.medium.tests,
        );
      }
    } finally {
      workspace.dispose();
    }
  }
});
