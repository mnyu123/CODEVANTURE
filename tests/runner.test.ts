import test from 'node:test';
import assert from 'node:assert/strict';
import { interpret } from '../src/runner/interpreter.ts';
test('supports both chapter solutions and indexed loops', () => {
  assert.equal(
    interpret(
      'const a=[2,4,6]; let sum=0; for (const x of a) {sum+=x;} activate(sum);',
    ),
    12,
  );
  assert.equal(
    interpret(
      'const a=[3,-2,5,-7,4]; let sum=0; for (let i=0;i<a.length;i++){if(a[i]>0){sum+=a[i];}} activate(sum);',
    ),
    12,
  );
});
test('blocks host access, property escape, functions and executable strings', () => {
  for (const source of [
    'fetch(1);',
    'activate.constructor(1);',
    'const x=[1]; x["constructor"];',
    'new Worker(1);',
    'eval(1);',
    'function f(){activate(12);} f();',
  ])
    assert.throws(() => interpret(source));
});
test('bounds loops, source size, arithmetic and duplicate outputs', () => {
  assert.throws(() => interpret('for(;;){}'), /한도/);
  assert.throws(() => interpret(' '.repeat(6001)), /6,000/);
  assert.throws(() => interpret('activate(1/0);'));
  assert.throws(() => interpret('activate(12);activate(12);'));
});
