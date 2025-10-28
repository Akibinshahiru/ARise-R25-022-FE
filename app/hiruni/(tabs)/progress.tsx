import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import {
  ChartBar as BarChart3,
  Trophy,
  Calendar,
  TrendingUp,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GAME_WEIGHTS } from '@/config/IT21838248/gameConfig';

interface GameProgress {
  gameId: number;
  gameName: string;
  completedRounds: number;
  correctAnswers: number;
  totalRounds: number;
  totalQuestions: number;
  lastPlayed: string;
  score: number;
}

export default function ProgressPage() {
  const [gameProgress, setGameProgress] = useState<GameProgress[]>([]);
  const [totalScore, setTotalScore] = useState(0);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      const progressData = await AsyncStorage.getItem('gameProgress');
      if (progressData) {
        const progress = JSON.parse(progressData);

        setGameProgress(progress);

        let weightedScore = 0;
        progress.forEach((result: any) => {
          const gameWeight = GAME_WEIGHTS.find(
            (w) => w.gameId === result.gameId
          );
          if (gameWeight) {
            weightedScore += (result.score * gameWeight.weight) / 100;
          }
        });
        const total = Math.round(weightedScore);
        setTotalScore(total);
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  const ProgressCard = ({ game }: { game: GameProgress }) => (
    <View style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <Text style={styles.gameName}>{game.gameName}</Text>
        <View style={styles.scoreContainer}>
          <Trophy size={20} color="#FFD700" />
          <Text style={styles.scoreText}>{game.score}%</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${game.score}%`,
              backgroundColor: getProgressColor(game.score),
            },
          ]}
        />
      </View>

      <View style={styles.progressInfo}>
        <Text style={styles.roundsText}>
          {game.correctAnswers}/{game.totalQuestions} rounds completed
        </Text>
        <Text style={styles.lastPlayedText}>
          Last played: {game.lastPlayed}
        </Text>
      </View>
    </View>
  );
  const getProgressColor = (score: number) => {
    if (score >= 80) return '#B7E4C7';
    if (score >= 60) return '#FFF3B0';
    return '#FFB3BA';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BarChart3 size={40} color="#8B5A2B" />
        <Text style={styles.headerTitle}>Your Progress</Text>
      </View>

      <View style={styles.overallScore}>
        <Text style={styles.overallScoreTitle}>Overall Progress</Text>
        <View style={styles.scoreDisplay}>
          <TrendingUp size={30} color="#4CAF50" />
          <Text style={styles.overallScoreText}>{totalScore}%</Text>
        </View>
      </View>

      <ScrollView style={styles.progressContainer}>
        {gameProgress.length > 0 ? (
          gameProgress.map((game) => (
            <ProgressCard key={game.gameId} game={game} />
          ))
        ) : (
          <View style={styles.noProgressContainer}>
            <Calendar size={50} color="#A67B5B" />
            <Text style={styles.noProgressTitle}>No Games Played Yet!</Text>
            <Text style={styles.noProgressText}>
              Start playing games to see your progress here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3DD',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5A2B',
    marginLeft: 15,
  },
  overallScore: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  overallScoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B5A2B',
    marginBottom: 15,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overallScoreText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 10,
  },
  progressContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  gameName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5A2B',
    flex: 1,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5A2B',
    marginLeft: 5,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E8D5B7',
    borderRadius: 4,
    marginBottom: 10,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roundsText: {
    fontSize: 14,
    color: '#8B5A2B',
  },
  lastPlayedText: {
    fontSize: 12,
    color: '#A67B5B',
  },
  noProgressContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  noProgressTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5A2B',
    marginTop: 20,
    marginBottom: 10,
  },
  noProgressText: {
    fontSize: 16,
    color: '#A67B5B',
    textAlign: 'center',
  },
});
