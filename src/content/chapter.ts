export type Mode = 'easy' | 'medium' | 'hard';
export const chapter = {
  title: '01 / 잠든 관문',
  story:
    '이름 없는 여행자여, 네가 세계를 깨웠구나. 동쪽 관문의 동력이 사라졌다. 푸른 단말기에 남은 빛을 연결해 주겠니?',
  tasks: {
    easy: {
      title: '빛을 연결하기',
      description:
        '동력 블록을 연결하고 실행하세요. 관문에는 12의 에너지가 필요합니다.',
      starter: '',
    },
    medium: {
      title: '흩어진 에너지',
      description:
        '에너지 배열 [2, 4, 6]의 합을 구해 activate(합계)를 호출하세요. 변수, 배열, for, for…of, 사칙연산을 사용할 수 있습니다.',
      starter:
        'const energy = [2, 4, 6];\nlet total = 0;\n\n// 에너지를 모으세요.\n\nactivate(total);',
    },
    hard: {
      title: '불안정한 에너지',
      description:
        '배열 [3, -2, 5, -7, 4]에서 양수만 합산해 activate(합계)를 호출하세요. for와 if를 사용할 수 있습니다.',
      starter:
        'const energy = [3, -2, 5, -7, 4];\nlet total = 0;\n\n// 안정된 에너지만 모으세요.\n\nactivate(total);',
    },
  },
};
