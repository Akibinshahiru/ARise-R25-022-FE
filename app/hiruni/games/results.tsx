import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { Trophy, Star, Chrome as Home, RotateCcw } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { GameScoring } from '@/utils/IT21838248/gameUtils';

export default function GameResultsScreen() {
  const { gameName, totalRounds, responses } = useLocalSearchParams();
  const [gameResponses, setGameResponses] = useState<any[]>([]);
  const [score, setScore] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const spoken = useRef(false);

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (responses && !spoken.current) {
      const parsedResponses = JSON.parse(responses as string);
      setGameResponses(parsedResponses);

      const calculatedScore = GameScoring.calculateGameScore(parsedResponses);
      setScore(calculatedScore);

      startCelebrationAnimation();
      speakResults(calculatedScore);
      spoken.current = true;
    }
  }, [responses]);

  const startCelebrationAnimation = () => {
    setShowCelebration(true);

    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const speakResults = (finalScore: number) => {
    let message = '';

    if (finalScore >= 80) {
      message = "Fantastic job! You did amazing! You're a superstar!";
    } else if (finalScore >= 60) {
      message = "Great work! You're doing really well! Keep it up!";
    } else if (finalScore >= 40) {
      message = "Good effort! You're learning and improving!";
    } else {
      message = "You tried your best! That's what matters most!";
    }

    Speech.speak(message, {
      language: 'en-US',
      pitch: 1.3,
      rate: 0.8,
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFC107';
    if (score >= 40) return '#FF9800';
    return '#FF6B6B';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 80) return 'Outstanding! 🌟';
    if (score >= 60) return 'Great Job! 👏';
    if (score >= 40) return 'Good Work! 💪';
    return 'Keep Trying! 🌈';
  };

  const getEncouragementMessage = (score: number) => {
    if (score >= 80)
      return "You're a learning superstar! Keep up the amazing work!";
    if (score >= 60) return "You're doing really well! Practice makes perfect!";
    if (score >= 40) return "You're improving! Every try makes you better!";
    return "Remember, every expert was once a beginner! You're doing great!";
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const bounce = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const correctAnswers = gameResponses.filter((r) => r.isCorrect).length;
  const totalQuestions = gameResponses.length;
  const skippedQuestions = gameResponses.filter((r) => r.skipped).length;

  return (
    <View style={styles.container}>
      {/* Decorative Stars */}
      <Animated.View
        style={[
          styles.decorativeStar,
          styles.topLeft,
          { transform: [{ rotate: spin }] },
        ]}
      >
        <Star size={30} color="#FFD700" />
      </Animated.View>

      <Animated.View
        style={[
          styles.decorativeStar,
          styles.topRight,
          { transform: [{ rotate: spin }] },
        ]}
      >
        <Star size={25} color="#FFC107" />
      </Animated.View>

      <Animated.View
        style={[
          styles.decorativeStar,
          styles.bottomLeft,
          { transform: [{ rotate: spin }] },
        ]}
      >
        <Star size={35} color="#FF9800" />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Animated.View
          style={[styles.content, { transform: [{ scale: scaleAnim }] }]}
        >
          {/* Trophy Section */}
          <Animated.View
            style={[
              styles.trophyContainer,
              { transform: [{ translateY: bounce }] },
            ]}
          >
            <Trophy size={80} color="#FFD700" />
          </Animated.View>

          <Text style={styles.completedTitle}>Game Complete!</Text>
          <Text style={styles.gameName}>{gameName}</Text>

          {/* Score Display */}
          <View
            style={[
              styles.scoreContainer,
              { backgroundColor: getScoreColor(score) },
            ]}
          >
            <Text style={styles.scoreLabel}>Your Score</Text>
            <Text style={styles.scoreValue}>{score}%</Text>
            <Text style={styles.scoreMessage}>{getScoreMessage(score)}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{correctAnswers}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalQuestions}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{skippedQuestions}</Text>
              <Text style={styles.statLabel}>Skipped</Text>
            </View>
          </View>

          {/* Encouragement Message */}
          <View style={styles.encouragementContainer}>
            <Text style={styles.encouragementText}>
              {getEncouragementMessage(score)}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => router.push('/hiruni/(tabs)')}
            >
              <Home size={24} color="#fff" />
              <Text style={styles.homeButtonText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={() => router.replace('/hiruni/games/letter-hunt')}
            >
              <RotateCcw size={24} color="#fff" />
              <Text style={styles.playAgainButtonText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3DD',
  },
  decorativeStar: {
    position: 'absolute',
    zIndex: 1,
  },
  topLeft: {
    top: 80,
    left: 30,
  },
  topRight: {
    top: 120,
    right: 40,
  },
  bottomLeft: {
    bottom: 150,
    left: 40,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 50,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  trophyContainer: {
    marginBottom: 30,
  },
  completedTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B5A2B',
    textAlign: 'center',
    marginBottom: 10,
  },
  gameName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#A67B5B',
    textAlign: 'center',
    marginBottom: 40,
  },
  scoreContainer: {
    borderRadius: 25,
    paddingVertical: 30,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    minWidth: 200,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.9,
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  scoreMessage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 25,
    paddingHorizontal: 30,
    marginBottom: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5A2B',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 16,
    color: '#A67B5B',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E8D5B7',
    marginHorizontal: 20,
  },
  encouragementContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginBottom: 40,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  encouragementText: {
    fontSize: 18,
    color: '#8B5A2B',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  homeButton: {
    backgroundColor: '#A3C4F3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  playAgainButton: {
    backgroundColor: '#B7E4C7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  playAgainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
