export interface GameResponse {
  gameId: number;
  roundId: number;
  questionId: number;
  userAnswer: any;
  correctAnswer: any;
  isCorrect: boolean;
  timeSpent: number;
  skipped: boolean;
  timestamp: string;
}

export interface GameResult {
  gameId: number;
  gameName: string;
  totalQuestions: number;
  correctAnswers: number;
  skippedQuestions: number;
  averageTime: number;
  score: number;
}

export class GameScoring {
  static calculateGameScore(responses: GameResponse[]): number {
    if (responses.length === 0) return 0;

    const totalQuestions = responses.length;
    const correctAnswers = responses.filter((r) => r.isCorrect).length;
    const skippedQuestions = responses.filter((r) => r.skipped).length;
    const averageTime =
      responses.reduce((sum, r) => sum + r.timeSpent, 0) / totalQuestions;

    // Weighted scoring algorithm
    const accuracyScore = (correctAnswers / totalQuestions) * 60; // 60% weight
    const speedScore = Math.max(0, ((180 - averageTime) / 180) * 20); // 20% weight
    const completionScore =
      ((totalQuestions - skippedQuestions) / totalQuestions) * 20; // 20% weight

    return Math.round(accuracyScore + speedScore + completionScore);
  }

  static calculateOverallDiagnosis(gameResults: GameResult[]): {
    overallScore: number;
    riskLevel: 'Low' | 'Moderate' | 'High';
    recommendations: string[];
  } {
    if (gameResults.length === 0) {
      return {
        overallScore: 0,
        riskLevel: 'High',
        recommendations: ['Please complete some games to get recommendations.'],
      };
    }

    // Calculate weighted average score using game weights
    let weightedScore = 0;
    let totalWeight = 0;

    gameResults.forEach((result) => {
      const gameWeight = GAME_WEIGHTS.find((w) => w.gameId === result.gameId);
      if (gameWeight) {
        weightedScore += (result.score * gameWeight.weight) / 100;
        totalWeight += gameWeight.weight;
      }
    });

    const finalScore = totalWeight > 0 ? weightedScore : 0;
    const category = getScoreCategory(Math.round(finalScore));

    // Map risk level to the expected format
    let riskLevel: 'Low' | 'Moderate' | 'High';
    if (category.riskLevel === 'No Dyslexia') {
      riskLevel = 'Low';
    } else if (category.riskLevel === 'Early Warning') {
      riskLevel = 'Moderate';
    } else {
      riskLevel = 'High';
    }

    return {
      overallScore: Math.round(finalScore),
      riskLevel,
      recommendations: [category.suggestedAction],
    };
  }

  static saveGameProgress = async (
    gameId: number,
    gameName: string,
    responses: GameResponse[]
  ) => {
    try {
      const { default: AsyncStorage } = await import(
        '@react-native-async-storage/async-storage'
      );

      const score = GameScoring.calculateGameScore(responses);

      const gameResult: GameResult = {
        gameId,
        gameName,
        totalQuestions: responses.length,
        correctAnswers:
          gameId === 1
            ? responses.length
            : responses.filter((r) => r.isCorrect).length,
        skippedQuestions: responses.filter((r) => r.skipped).length,
        averageTime:
          responses.reduce((sum, r) => sum + r.timeSpent, 0) / responses.length,
        score: gameId === 1 ? 100 : score,
      };

      // Get existing progress
      const existingProgress = await AsyncStorage.getItem('gameProgress');
      const progress = existingProgress ? JSON.parse(existingProgress) : [];

      // Update or add game result
      const existingIndex = progress.findIndex((p: any) => p.gameId === gameId);
      if (existingIndex >= 0) {
        progress[existingIndex] = {
          ...progress[existingIndex],
          ...gameResult,
          lastPlayed: new Date().toLocaleDateString(),
          completedRounds: responses.length,
        };
      } else {
        progress.push({
          ...gameResult,
          lastPlayed: new Date().toLocaleDateString(),
          completedRounds: responses.length,
          totalRounds: Math.ceil(responses.length / 5), // Estimate total rounds
        });
      }

      await AsyncStorage.setItem('gameProgress', JSON.stringify(progress));
      return gameResult;
    } catch (error) {
      console.error('Error saving game progress:', error);
      throw error;
    }
  };
}

export const generatePositiveReinforcement = (): string => {
  const messages = [
    'Fantastic job! 🌟',
    "You're doing amazing! 🎉",
    'Keep up the great work! ⭐',
    'Wonderful effort! 🎊',
    "You're a star! 🌟",
    'Excellent! 👏',
    'Super job! 🏆',
    "You're incredible! 💫",
    'Amazing work! 🎯',
    'Outstanding! 🌈',
  ];

  return messages[Math.floor(Math.random() * messages.length)];
};

export const generatePositiveReinforcementText = (): string => {
  const messages = [
    'Fantastic job!',
    "You're doing amazing!",
    'Keep up the great work!',
    'Wonderful effort!',
    "You're a star!",
    'Excellent!',
    'Super job!',
    "You're incredible!",
    'Amazing work!',
    'Outstanding!',
  ];

  return messages[Math.floor(Math.random() * messages.length)];
};

export const generateSkipEncouragement = (): string => {
  const messages = [
    "No worries! You're doing great! 😊",
    "That's okay! Let's try the next one! 🌟",
    "Don't worry! You're awesome! 💪",
    "It's alright! Keep going! 🚀",
    "No problem! You're fantastic! ✨",
    "That's fine! You're amazing! 🌈",
    "Don't worry! You've got this! 🎉",
  ];

  return messages[Math.floor(Math.random() * messages.length)];
};
import { GAME_WEIGHTS, getScoreCategory } from '@/config/IT21838248/gameConfig';
