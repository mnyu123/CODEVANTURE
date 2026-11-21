import type { Mode } from '../content/chapter';
const options: {
  id: Mode;
  number: string;
  title: string;
  subtitle: string;
  description: string;
}[] = [
  {
    id: 'easy',
    number: '01',
    title: '쉬움',
    subtitle: '블록으로 시작하는 모험',
    description: '명령 블록을 연결해 이야기 속 장치를 움직여 보세요.',
  },
  {
    id: 'medium',
    number: '02',
    title: '중간',
    subtitle: '계산부터 반복문까지',
    description:
      '짧은 식과 조건부터 시작해요. 모바일에서는 블록으로 시작할 수 있어요.',
  },
  {
    id: 'hard',
    number: '03',
    title: '어려움',
    subtitle: '더 깊이 생각하는 모험',
    description:
      '복잡한 조건과 알고리즘에 도전하세요. 첫 지역은 준비 운동입니다.',
  },
];
export default function Difficulty({
  onSelect,
}: {
  onSelect: (mode: Mode) => void;
}) {
  return (
    <main className="difficulty-page">
      <div className="difficulty-content">
        <span className="eyebrow">A WORLD WRITTEN BY YOU</span>
        <h1>CODEVANTURE</h1>
        <p className="difficulty-intro">어떤 방식으로 모험을 시작할까요?</p>
        <div className="difficulty-grid">
          {options.map((option) => (
            <button
              className="difficulty-card"
              key={option.id}
              onClick={() => onSelect(option.id)}
            >
              <span className="difficulty-number">{option.number}</span>
              <h2>{option.title}</h2>
              <strong>{option.subtitle}</strong>
              <p>{option.description}</p>
              <span className="difficulty-enter">이 난이도로 시작 →</span>
            </button>
          ))}
          <div
            className="difficulty-card unavailable"
            aria-label="AI 모드 준비 중"
          >
            <span className="difficulty-number">04</span>
            <h2>AI</h2>
            <strong>전략은 당신이, 코드는 AI가</strong>
            <p>
              AI가 코드를 작성하며 함께 모험합니다. 실제 AI 연동 후 이용할 수
              있어요.
            </p>
            <span className="difficulty-enter">준비 중</span>
          </div>
        </div>
      </div>
    </main>
  );
}
