export interface GameWeight {
  gameId: number;
  gameName: string;
  weight: number;
}

export interface ScoreCategory {
  minScore: number;
  maxScore: number;
  category: string;
  riskLevel: string;
  suggestedAction: string;
}

export const GAME_WEIGHTS: GameWeight[] = [
  { gameId: 1, gameName: 'Letter Tracing', weight: 25 },
  { gameId: 2, gameName: 'Sound & Letters', weight: 25 },
  { gameId: 3, gameName: 'Same or Different', weight: 15 },
  { gameId: 4, gameName: 'Letter Hunt', weight: 20 },
  { gameId: 5, gameName: 'Color Matching', weight: 15 },
];

export const SCORE_CATEGORIES: ScoreCategory[] = [
  {
    minScore: 80,
    maxScore: 100,
    category: 'Normal',
    riskLevel: 'No Dyslexia',
    suggestedAction: 'Continue regular learning; re-screen later',
  },
  {
    minScore: 60,
    maxScore: 79,
    category: 'Mild Risk',
    riskLevel: 'Early Warning',
    suggestedAction: 'Monitor; home/class support',
  },
  {
    minScore: 40,
    maxScore: 59,
    category: 'At Risk',
    riskLevel: 'Moderate Dyslexia',
    suggestedAction: 'Structured intervention needed',
  },
  {
    minScore: 0,
    maxScore: 39,
    category: 'High Risk',
    riskLevel: 'Strong Dyslexia Indicators',
    suggestedAction: 'Formal diagnosis & professional therapy',
  },
];

export const getScoreCategory = (score: number): ScoreCategory => {
  return (
    SCORE_CATEGORIES.find(
      (category) => score >= category.minScore && score <= category.maxScore
    ) || SCORE_CATEGORIES[SCORE_CATEGORIES.length - 1]
  );
};
