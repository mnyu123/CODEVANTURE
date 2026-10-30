import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSource } from '../src/runner/languageAdapter.ts';
import { interpret } from '../src/runner/interpreter.ts';
import { starterCode, languages } from '../src/content/languages.ts';
import { initialProgress, progression } from '../src/game/progression.ts';
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
      interpret(normalizeSource(starterCode(language.id, false), language.id)),
      0,
    );
    assert.equal(
      interpret(normalizeSource(starterCode(language.id, true), language.id)),
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
