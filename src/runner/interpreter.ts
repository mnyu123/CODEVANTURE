import { parse } from 'acorn';
import type { Node } from 'acorn';
import type { Inputs, Signal, TestCase } from '../content/chapter';
type Value = number | boolean | Value[];
interface Ast {
  type: string;
  [key: string]: unknown;
}
const ast = (value: unknown): Ast => value as Ast;
export function interpret(source: string, inputs?: Inputs): Signal {
  if (source.length > 6000)
    throw new Error('코드는 6,000자까지 입력할 수 있어요.');
  const tree: Node = parse(source, { ecmaVersion: 2022 });
  const variables = new Map<string, Value>();
  for (const [name, value] of Object.entries(inputs ?? {})) {
    if (typeof value === 'number' || typeof value === 'boolean') {
      variables.set(name, value);
    } else {
      if (value.length > 100) throw new Error('배열이 너무 커요.');
      variables.set(name, [...value]);
      variables.set(`${name}Count`, value.length);
    }
  }
  let budget = 10000;
  let result: Signal | undefined;
  function visit(input: unknown): Value {
    if (--budget < 0)
      throw new Error('실행 한도를 넘었어요. 반복 조건을 확인하세요.');
    const node = ast(input);
    const run = (field: string) => visit(node[field]);
    const number = (value: Value): number => {
      if (
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        Math.abs(value) > 1e12
      )
        throw new Error('사용할 수 없는 숫자예요.');
      return value;
    };
    const nodes = (field: string) => node[field] as Ast[];
    switch (node.type) {
      case 'Program':
      case 'BlockStatement':
        for (const child of nodes('body')) visit(child);
        return 0;
      case 'EmptyStatement':
        return 0;
      case 'ExpressionStatement':
        return run('expression');
      case 'Literal':
        if (typeof node.value !== 'number' && typeof node.value !== 'boolean')
          throw new Error('숫자와 불리언만 사용할 수 있어요.');
        return node.value;
      case 'Identifier': {
        const value = variables.get(String(node.name));
        if (value === undefined)
          throw new Error(`알 수 없는 변수: ${String(node.name)}`);
        return value;
      }
      case 'ArrayExpression':
        if (nodes('elements').length > 100)
          throw new Error('배열이 너무 커요.');
        return nodes('elements').map(visit);
      case 'VariableDeclaration':
        for (const item of nodes('declarations')) {
          if (ast(item.id).type !== 'Identifier')
            throw new Error('단순 변수만 선언할 수 있어요.');
          const name = String(ast(item.id).name);
          if (item.init) variables.set(name, visit(item.init));
          else if (node.kind !== 'var' || !variables.has(name))
            variables.set(name, 0);
        }
        return 0;
      case 'BinaryExpression': {
        const left = run('left');
        const right = run('right');
        switch (node.operator) {
          case '+':
            return number(number(left) + number(right));
          case '-':
            return number(number(left) - number(right));
          case '*':
            return number(number(left) * number(right));
          case '/':
            return number(number(left) / number(right));
          case '%':
            return number(number(left) % number(right));
          case '<':
            return number(left) < number(right);
          case '<=':
            return number(left) <= number(right);
          case '>':
            return number(left) > number(right);
          case '>=':
            return number(left) >= number(right);
          case '===':
          case '==':
            return left === right;
          case '!==':
          case '!=':
            return left !== right;
        }
        break;
      }
      case 'LogicalExpression': {
        const left = run('left');
        if (node.operator === '&&') return left ? run('right') : left;
        if (node.operator === '||') return left ? left : run('right');
        break;
      }
      case 'UnaryExpression':
        if (node.operator === '-') return -number(run('argument'));
        if (node.operator === '!') return !run('argument');
        break;
      case 'MemberExpression': {
        const array = run('object');
        if (!Array.isArray(array)) break;
        if (!node.computed && ast(node.property).name === 'length')
          return array.length;
        const index = node.computed ? number(run('property')) : -1;
        if (!Number.isInteger(index) || index < 0 || index >= array.length)
          throw new Error('배열 범위를 벗어났어요.');
        return array[index];
      }
      case 'AssignmentExpression': {
        const left = ast(node.left);
        if (left.type !== 'Identifier' || !variables.has(String(left.name)))
          break;
        const name = String(left.name);
        const value = run('right');
        if (node.operator === '=') variables.set(name, value);
        else if (node.operator === '+=')
          variables.set(
            name,
            number(number(variables.get(name)!) + number(value)),
          );
        else break;
        return variables.get(name)!;
      }
      case 'UpdateExpression': {
        const arg = ast(node.argument);
        const name = String(arg.name);
        if (
          arg.type !== 'Identifier' ||
          !variables.has(name) ||
          !['++', '--'].includes(String(node.operator))
        )
          break;
        const old = number(variables.get(name)!);
        const value = number(old + (node.operator === '++' ? 1 : -1));
        variables.set(name, value);
        return node.prefix ? value : old;
      }
      case 'ForOfStatement': {
        const values = run('right');
        const left = ast(node.left);
        if (!Array.isArray(values) || left.type !== 'VariableDeclaration')
          break;
        const declarations = left.declarations as Ast[];
        if (
          declarations.length !== 1 ||
          ast(declarations[0].id).type !== 'Identifier'
        )
          break;
        for (const value of values) {
          variables.set(String(ast(declarations[0].id).name), value);
          visit(node.body);
        }
        return 0;
      }
      case 'ForStatement':
        if (node.init) run('init');
        while (!node.test || run('test')) {
          if (--budget < 0)
            throw new Error('실행 한도를 넘었어요. 반복 조건을 확인하세요.');
          run('body');
          if (node.update) run('update');
        }
        return 0;
      case 'IfStatement':
        if (run('test')) return run('consequent');
        return node.alternate ? run('alternate') : 0;
      case 'CallExpression':
        if (
          ast(node.callee).type === 'Identifier' &&
          ast(node.callee).name === 'activate' &&
          nodes('arguments').length === 1
        ) {
          if (result !== undefined)
            throw new Error('activate는 한 번만 호출하세요.');
          const output = visit(nodes('arguments')[0]);
          result = typeof output === 'boolean' ? output : number(output);
          return 0;
        }
        break;
    }
    throw new Error(`이 장면에서 지원하지 않는 문법: ${node.type}`);
  }
  visit(tree);
  if (result === undefined)
    throw new Error('activate(에너지 합계)를 호출해 주세요.');
  return result;
}

export function grade(source: string, tests: readonly TestCase[]): void {
  if (!tests.length) throw new Error('이 문제의 판정 데이터를 찾을 수 없어요.');
  for (const [index, test] of tests.entries()) {
    const value = interpret(source, test.inputs);
    if (value !== test.expected) {
      const name = tests.length === 1 ? '보낸 값' : `입력 ${index + 1}의 결과`;
      throw new Error(
        index === 0
          ? `${name}: ${value}. 필요한 값은 ${test.expected}이에요.`
          : `${name}가 예상과 달라요. 다른 값이 들어와도 같은 규칙으로 동작하는지 확인하세요.`,
      );
    }
  }
}
