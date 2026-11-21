export type Mode = 'easy' | 'medium' | 'hard';
export type StageId = 'valley' | 'ravine' | 'sluice' | 'mirrors' | 'beacon';
export type Signal = number | boolean;
export type Inputs = Readonly<Record<string, Signal | readonly number[]>>;
export interface TestCase {
  expected: Signal;
  inputs?: Inputs;
}
export interface Task {
  title: string;
  rule: string;
  hint: string;
  blockHint?: string;
  tests: readonly TestCase[];
  starter?: readonly string[];
  blocks?:
    'arithmetic' | 'remainder' | 'logic' | 'choice' | 'array' | 'arrayFilter';
}
interface Stage {
  title: string;
  place: string;
  subtitle: string;
  guide: string;
  story: string;
  terminal: string;
  obstacle: 'gate' | 'bridge' | 'sluice' | 'mirror';
  palette: readonly [sky: number, stone: number, light: number];
  guideObjective: string;
  terminalObjective: string;
  exitObjective: string;
  exit: string;
  next?: StageId;
  tasks: Record<Mode, Task>;
}

export const stages: Record<StageId, Stage> = {
  valley: {
    title: '01 / 잠든 관문',
    place: '잊힌 계곡',
    subtitle: 'THE FORGOTTEN VALLEY',
    guide: '기록의 수호자',
    story:
      '이름 없는 여행자여, 네가 세계를 깨웠구나. 동쪽 관문의 동력이 사라졌다. 푸른 단말기에서 남은 빛을 모아 주겠니?',
    terminal: '동력 단말기',
    obstacle: 'gate',
    palette: [0x101c30, 0x355951, 0x88e1ca],
    guideObjective: '동쪽으로 걸어가 기록의 수호자를 만나세요.',
    terminalObjective: '동쪽의 푸른 단말기를 조사해 관문을 복구하세요.',
    exitObjective: '열린 관문을 지나 동쪽 빛으로 이동하세요.',
    exit: '메아리 협곡으로',
    next: 'ravine',
    tasks: {
      easy: {
        title: '두 불빛 모으기',
        rule: '빛 7과 빛 5를 더해 관문에 보내세요.',
        hint: '숫자 두 개를 더하기 블록에 끼우고 결과를 activate에 연결하세요.',
        tests: [{ expected: 12 }],
        blocks: 'arithmetic',
      },
      medium: {
        title: '두 불빛 모으기',
        rule: '빛 7과 빛 5를 더해 관문에 보내세요.',
        hint: 'activate의 괄호 안에 덧셈식을 넣으세요.',
        blockHint:
          '숫자 두 개를 더하기 블록에 끼우고 장치에 보내기에 연결하세요.',
        tests: [{ expected: 12 }],
        blocks: 'arithmetic',
      },
      hard: {
        title: '배율 맞추기',
        rule: '기본 빛 5에 빛 3의 네 배를 더하세요.',
        hint: '곱셈과 덧셈을 한 식에 써서 activate에 전달하세요.',
        tests: [{ expected: 17 }],
      },
    },
  },
  ravine: {
    title: '02 / 끊어진 빛의 다리',
    place: '메아리 협곡',
    subtitle: 'THE ECHO RAVINE',
    guide: '다리의 파수꾼',
    story:
      '바람에 다리의 발판이 가라앉았어. 이곳 중계기가 두 받침의 상태를 살피고 있어. 알맞은 명령을 보내면 발판이 차례로 떠오를 거야.',
    terminal: '다리 중계기',
    obstacle: 'bridge',
    palette: [0x242039, 0x634554, 0xf6bf69],
    guideObjective: '협곡을 살피고 동쪽의 파수꾼에게 말을 거세요.',
    terminalObjective: '황금빛 중계기에서 다리를 복구하세요.',
    exitObjective: '복구된 다리를 건너 동쪽으로 이동하세요.',
    exit: '물결 수로로',
    next: 'sluice',
    tasks: {
      easy: {
        title: '남은 동력 보내기',
        rule: '동력 9에서 이미 쓴 동력 3을 빼고 남은 값을 보내세요.',
        hint: '빼기 블록에 숫자를 넣고 결과를 activate에 연결하세요.',
        tests: [{ expected: 6 }],
        blocks: 'arithmetic',
      },
      medium: {
        title: '두 받침 확인하기',
        rule: '왼쪽 left와 오른쪽 right가 둘 다 5 이상일 때만 참을 보내세요.',
        hint: '각 값을 5와 비교하고 논리 AND로 두 비교식을 연결하세요.',
        blockHint:
          '왼쪽과 오른쪽을 각각 5와 비교하고, 결과를 그리고 블록으로 연결하세요.',
        blocks: 'logic',
        tests: [
          { inputs: { left: 7, right: 5 }, expected: true },
          { inputs: { left: 8, right: 3 }, expected: false },
          { inputs: { left: 4, right: 9 }, expected: false },
        ],
      },
      hard: {
        title: '받침의 하중 나누기',
        rule: '두 받침 중 하나 이상이 8 이상이고, 두 값의 합도 14 이상일 때만 참을 보내세요.',
        hint: 'left와 right를 사용하세요. 두 조건을 괄호로 묶은 다음 AND로 연결할 수 있어요.',
        tests: [
          { inputs: { left: 8, right: 6 }, expected: true },
          { inputs: { left: 7, right: 9 }, expected: true },
          { inputs: { left: 7, right: 7 }, expected: false },
          { inputs: { left: 10, right: 3 }, expected: false },
        ],
      },
    },
  },
  sluice: {
    title: '03 / 물결 수문',
    place: '청람 수로',
    subtitle: 'THE TIDAL WORKS',
    guide: '수로 기술자',
    story:
      '수문 기어는 같은 크기의 톱니 묶음으로 돌아가. 마지막 묶음에 남는 칸을 알려 주면 물길을 열 수 있어.',
    terminal: '기어 조절기',
    obstacle: 'sluice',
    palette: [0x102b3e, 0x28586b, 0x77dfff],
    guideObjective: '수로 기술자에게 기어가 멈춘 이유를 물어보세요.',
    terminalObjective: '기어 조절기에서 수문을 열어 주세요.',
    exitObjective: '열린 수문을 지나 온실로 이동하세요.',
    exit: '거울 온실로',
    next: 'mirrors',
    tasks: {
      easy: {
        title: '마지막 톱니',
        rule: '톱니 17개를 5개씩 나눴을 때 남는 개수를 보내세요.',
        hint: '나머지 블록에서 17을 5로 나눈 결과를 activate에 연결하세요.',
        tests: [{ expected: 2 }],
        blocks: 'remainder',
      },
      medium: {
        title: '기어 맞물리기',
        rule: '톱니 수 teeth를 묶음 크기 group으로 나눈 나머지를 보내세요.',
        hint: '% 연산자로 어떤 값이 들어와도 나머지를 계산할 수 있어요.',
        blockHint: '나머지 블록에 teeth와 group을 순서대로 넣어 보세요.',
        blocks: 'remainder',
        tests: [
          { inputs: { teeth: 17, group: 5 }, expected: 2 },
          { inputs: { teeth: 24, group: 6 }, expected: 0 },
          { inputs: { teeth: 7, group: 4 }, expected: 3 },
        ],
      },
      hard: {
        title: '수문의 안전 신호',
        rule: '수압 pressure가 8 이상이고, teeth가 group의 배수일 때만 참을 보내세요.',
        hint: '나머지가 0인지 비교하면 배수를 확인할 수 있어요.',
        tests: [
          { inputs: { pressure: 8, teeth: 24, group: 6 }, expected: true },
          { inputs: { pressure: 7, teeth: 24, group: 6 }, expected: false },
          { inputs: { pressure: 9, teeth: 25, group: 6 }, expected: false },
          { inputs: { pressure: 11, teeth: 15, group: 5 }, expected: true },
        ],
      },
    },
  },
  mirrors: {
    title: '04 / 방향을 잃은 거울',
    place: '거울 온실',
    subtitle: 'THE MIRROR GARDEN',
    guide: '온실 정원사',
    story:
      '거울이 빛을 제대로 받으면 셔터가 양쪽으로 열려. 지금 들어오는 빛에 맞춰 신호를 보내 줘.',
    terminal: '거울 제어기',
    obstacle: 'mirror',
    palette: [0x272440, 0x50566f, 0xd8adff],
    guideObjective: '거울 온실을 살피고 정원사를 찾아가세요.',
    terminalObjective: '거울 제어기에 알맞은 신호를 보내세요.',
    exitObjective: '빛이 비치는 통로로 들어가세요.',
    exit: '별빛 관측소로',
    next: 'beacon',
    tasks: {
      easy: {
        title: '빛이 충분할까?',
        rule: '지금 빛은 11이에요. 빛이 8 이상인지 비교해 결과를 보내세요.',
        hint: '비교 블록을 ≥로 바꾼 뒤 숫자 두 개를 넣어 보세요.',
        tests: [{ expected: true }],
        blocks: 'logic',
      },
      medium: {
        title: '두 방향 중 고르기',
        rule: '빛 light가 8 이상이면 2, 그보다 작으면 1을 보내세요.',
        hint: 'if와 else로 signal 값을 정한 뒤 activate를 한 번 호출하세요.',
        blockHint:
          '비교 결과를 이면·아니면 블록에 넣고, 두 경우에 보낼 값을 정하세요.',
        starter: ['signal'],
        blocks: 'choice',
        tests: [
          { inputs: { light: 8 }, expected: 2 },
          { inputs: { light: 3 }, expected: 1 },
          { inputs: { light: 14 }, expected: 2 },
        ],
      },
      hard: {
        title: '세 단계로 조절하기',
        rule: '빛 light가 12 이상이면 3, 6 이상 12 미만이면 2, 그보다 작으면 1을 보내세요.',
        hint: '높은 기준을 먼저 확인하세요. else 안에서 if로 남은 기준을 검사할 수 있어요.',
        starter: ['signal'],
        tests: [
          { inputs: { light: 12 }, expected: 3 },
          { inputs: { light: 6 }, expected: 2 },
          { inputs: { light: 5 }, expected: 1 },
          { inputs: { light: 11 }, expected: 2 },
        ],
      },
    },
  },
  beacon: {
    title: '05 / 별빛의 징검다리',
    place: '별빛 관측소',
    subtitle: 'THE STAR OBSERVATORY',
    guide: '별의 관측자',
    story:
      '마지막 불빛은 하나의 숫자로 오지 않아. 관측기가 여러 별의 밝기를 순서대로 담아 보냈어. 기록을 읽고 빛의 길을 만들어 줘.',
    terminal: '별빛 관측기',
    obstacle: 'bridge',
    palette: [0x101439, 0x384b79, 0xffd58f],
    guideObjective: '별의 관측자에게 관측 기록을 받으세요.',
    terminalObjective: '관측기에 담긴 별빛을 읽어 마지막 다리를 복구하세요.',
    exitObjective: '빛의 징검다리를 건너 관측소 봉화를 켜세요.',
    exit: '봉화 밝히기',
    tasks: {
      easy: {
        title: '한 묶음의 별빛',
        rule: 'energy에 들어 있는 별빛을 모두 더한 값을 보내세요.',
        hint: '배열 블록에서 합계를 선택하고 activate에 연결하세요.',
        tests: [
          { inputs: { energy: [3, 0, 7, 4] }, expected: 14 },
          { inputs: { energy: [4, 9] }, expected: 13 },
          { inputs: { energy: [] }, expected: 0 },
        ],
        blocks: 'array',
      },
      medium: {
        title: '밝은 별 세기',
        rule: '배열 energy에서 밝기가 5 이상인 별의 개수를 보내세요.',
        hint: 'energyCount는 배열 길이예요. 반복하며 각 값을 비교하고 기준에 맞을 때 count를 1 늘리세요.',
        blockHint:
          '배열에서 기준 이상인 값을 세는 블록에 기준 숫자 5를 넣으세요.',
        starter: ['count'],
        blocks: 'arrayFilter',
        tests: [
          { inputs: { energy: [4, 8, 5, 1, 9] }, expected: 3 },
          { inputs: { energy: [5, 3] }, expected: 1 },
          { inputs: { energy: [0, 2, 4] }, expected: 0 },
          { inputs: { energy: [7, 9, 5, 8] }, expected: 4 },
        ],
      },
      hard: {
        title: '가장 길게 이어진 별빛',
        rule: '배열 energy에서 밝기가 5 이상인 별이 연속으로 나타나는 가장 긴 길이를 보내세요.',
        hint: 'energyCount는 배열 길이예요. 기준보다 어두우면 streak를 0으로 돌리고, 가장 큰 streak를 longest에 기록하세요.',
        starter: ['longest', 'streak'],
        tests: [
          { inputs: { energy: [7, 1, 5, 8, 2, 9, 7, 6] }, expected: 3 },
          { inputs: { energy: [5, 8, 9, 2, 6] }, expected: 3 },
          { inputs: { energy: [6, 4, 5, 3, 9, 1] }, expected: 1 },
          { inputs: { energy: [4, 0, 1] }, expected: 0 },
          { inputs: { energy: [] }, expected: 0 },
        ],
      },
    },
  },
};
