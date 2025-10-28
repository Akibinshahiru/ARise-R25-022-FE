import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Alert,
} from 'react-native';
import LottieView from 'lottie-react-native';
import {
  Trophy,
  Star,
  Chrome as Home,
  Award,
  TrendingUp,
  Download,
} from 'lucide-react-native';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameScoring } from '@/utils/IT21838248/gameUtils';
import { getScoreCategory, GAME_WEIGHTS } from '@/config/IT21838248/gameConfig';
import { DatabaseService } from '@/utils/IT21838248/databaseUtils';
import { FinalCelebrationAnimation } from '@/components/IT21838248/GameAnimations';
import { PDFReportGenerator } from '@/utils/IT21838248/pdfGenerator';
import { Platform } from 'react-native';

export default function FinalResultsScreen() {
  const [gameResults, setGameResults] = useState<any[]>([]);
  const [overallDiagnosis, setOverallDiagnosis] = useState<any>(null);
  const [scoreCategory, setScoreCategory] = useState<any>(null);
  const [userName, setUserName] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadResults();
    saveToDatabase();

    // Show celebration after a brief delay to ensure data is loaded
    setTimeout(() => {
      setShowCelebration(true);
    }, 500);
  }, []);

  const loadResults = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      const progressData = await AsyncStorage.getItem('gameProgress');

      setUserName(name || 'Amazing Kid');

      if (progressData) {
        const results = JSON.parse(progressData);
        setGameResults(results);

        // Calculate weighted final score
        let weightedScore = 0;
        results.forEach((result: any) => {
          const gameWeight = GAME_WEIGHTS.find(
            (w) => w.gameId === result.gameId
          );
          if (gameWeight) {
            weightedScore += (result.score * gameWeight.weight) / 100;
          }
        });

        const finalScore = Math.round(weightedScore);
        const category = getScoreCategory(finalScore);
        const diagnosis = GameScoring.calculateOverallDiagnosis(results);

        setOverallDiagnosis({ ...diagnosis, overallScore: finalScore });
        setScoreCategory(category);
      }
    } catch (error) {
      console.error('Error loading results:', error);
    }
  };

  const saveToDatabase = async () => {
    try {
      const assessmentData = await DatabaseService.prepareAssessmentData();
      if (assessmentData) {
        await DatabaseService.saveAssessmentData(assessmentData);
      }
    } catch (error) {
      console.error('Error saving to database:', error);
    }
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);

    // Start the main content animations after celebration
    setTimeout(() => {
      startCelebrationAnimation();
      if (overallDiagnosis) {
        speakFinalResults(overallDiagnosis);
      }
    }, 100);
  };

  const startCelebrationAnimation = () => {
    // Scale animation for main content
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Rotation animation for stars
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();

    // Bounce animation for trophy
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const speakFinalResults = (diagnosis: any) => {
    const message = `Congratulations ${userName}! You completed all the games! You're doing fantastic and learning so much!`;

    Speech.speak(message, {
      language: 'en-US',
      pitch: 1.3,
      rate: 0.8,
    });
  };

  const getRiskLevelColor = (riskLevel: string) => {
    if (!scoreCategory) return '#9E9E9E';

    switch (scoreCategory.category) {
      case 'Normal':
        return '#4CAF50';
      case 'Mild Risk':
        return '#FFC107';
      case 'At Risk':
        return '#FF9800';
      case 'High Risk':
        return '#FF6B6B';
      default:
        return '#9E9E9E';
    }
  };

  const getRiskLevelMessage = () => {
    if (!scoreCategory) return 'Keep Going! 🚀';

    switch (scoreCategory.category) {
      case 'Normal':
        return 'Excellent Progress! 🌟';
      case 'Mild Risk':
        return 'Good Work! Keep Practicing! 💪';
      case 'At Risk':
        return 'Great Effort! More Practice Needed! 📚';
      case 'High Risk':
        return "Keep Trying! We're Here to Help! 🌈";
      default:
        return 'Keep Going! 🚀';
    }
  };

  const handleDownloadReport = async () => {
    setIsGeneratingReport(true);

    try {
      const reportPath = await PDFReportGenerator.generateReport();

      if (reportPath) {
        Alert.alert(
          'Report Downloaded! 📄',
          'Your assessment report has been downloaded successfully as an HTML file!',
          [{ text: 'OK', style: 'default' }]
        );

        Speech.speak('Your assessment report has been generated successfully!');
      } else {
        Alert.alert(
          'Error',
          'Failed to generate the report. Please try again.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert(
        'Error',
        'An error occurred while generating the report. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const bounce = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  if (!overallDiagnosis) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading your amazing results...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FinalCelebrationAnimation
        visible={showCelebration}
        onComplete={handleCelebrationComplete}
      />

      {/* Confetti Animation Overlay */}
      <View style={styles.confettiContainer}>
        <LottieView
          source={require('../../../assets/animations/confetti.json')}
          autoPlay
          loop
          style={styles.confettiAnimation}
        />
      </View>

      {/* Decorative Stars */}
      <Animated.View
        style={[
          styles.decorativeStar,
          styles.topLeft,
          { transform: [{ rotate: spin }] },
        ]}
      >
        <Star size={35} color="#FFD700" />
      </Animated.View>

      <Animated.View
        style={[
          styles.decorativeStar,
          styles.topRight,
          { transform: [{ rotate: spin }] },
        ]}
      >
        <Star size={28} color="#FFC107" />
      </Animated.View>

      <Animated.View
        style={[
          styles.decorativeStar,
          styles.bottomLeft,
          { transform: [{ rotate: spin }] },
        ]}
      >
        <Star size={40} color="#FF9800" />
      </Animated.View>

      <Animated.View
        style={[
          styles.decorativeStar,
          styles.bottomRight,
          { transform: [{ rotate: spin }] },
        ]}
      >
        <Star size={32} color="#4CAF50" />
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
            <Trophy size={100} color="#FFD700" />
          </Animated.View>

          {/* Congratulations Message */}
          <Text style={styles.congratsTitle}>🎉 Congratulations! 🎉</Text>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.completionMessage}>
            You completed all the learning games!
          </Text>

          {/* Overall Score */}
          <View
            style={[
              styles.overallScoreContainer,
              { backgroundColor: getRiskLevelColor(scoreCategory?.category) },
            ]}
          >
            <Award size={40} color="#fff" />
            <Text style={styles.overallScoreLabel}>Overall Progress</Text>
            <Text style={styles.overallScoreValue}>
              {overallDiagnosis.overallScore}%
            </Text>
            <Text style={styles.riskLevelMessage}>{getRiskLevelMessage()}</Text>
          </View>

          {/* Diagnosis Information */}
          {scoreCategory && (
            <View style={styles.diagnosisContainer}>
              <Text style={styles.diagnosisTitle}>Assessment Results</Text>
              <View style={styles.diagnosisItem}>
                <Text style={styles.diagnosisLabel}>Category:</Text>
                <Text style={styles.diagnosisValue}>
                  {scoreCategory.category}
                </Text>
              </View>
              <View style={styles.diagnosisItem}>
                <Text style={styles.diagnosisLabel}>Risk Level:</Text>
                <Text style={styles.diagnosisValue}>
                  {scoreCategory.riskLevel}
                </Text>
              </View>
              <View style={styles.diagnosisAction}>
                <Text style={styles.diagnosisActionTitle}>
                  Suggested Action:
                </Text>
                <Text style={styles.diagnosisActionText}>
                  {scoreCategory.suggestedAction}
                </Text>
              </View>
            </View>
          )}

          {/* Game Results Summary */}
          <View style={styles.gameResultsContainer}>
            <Text style={styles.gameResultsTitle}>Your Game Scores:</Text>

            {gameResults.map((result, index) => (
              <View key={result.gameId} style={styles.gameResultItem}>
                <View style={styles.gameResultInfo}>
                  <Text style={styles.gameResultName}>{result.gameName}</Text>
                  <Text style={styles.gameResultDetails}>
                    {result.correctAnswers}/{result.totalQuestions} correct
                  </Text>
                </View>

                <View style={styles.gameResultScore}>
                  <Text style={styles.gameResultScoreText}>
                    {result.score}%
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Encouragement Section */}
          <View style={styles.encouragementContainer}>
            <TrendingUp size={30} color="#4CAF50" />
            <Text style={styles.encouragementTitle}>Keep Learning!</Text>
            <Text style={styles.encouragementText}>
              Every game you play helps you learn and grow. You're doing an
              amazing job!
            </Text>
          </View>

          {/* Recommendations */}
          {overallDiagnosis.recommendations &&
            overallDiagnosis.recommendations.length > 0 && (
              <View style={styles.recommendationsContainer}>
                <Text style={styles.recommendationsTitle}>
                  For Parents & Teachers:
                </Text>
                {overallDiagnosis.recommendations.map(
                  (recommendation: string, index: number) => (
                    <Text key={index} style={styles.recommendationText}>
                      • {recommendation}
                    </Text>
                  )
                )}
              </View>
            )}

          {/* Action Button */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.downloadButton,
                isGeneratingReport && styles.downloadButtonDisabled,
              ]}
              onPress={handleDownloadReport}
              disabled={isGeneratingReport}
            >
              <Download size={24} color="#fff" />
              <Text style={styles.downloadButtonText}>
                {isGeneratingReport ? 'Generating...' : 'Download Report'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => router.push('/hiruni/(tabs)')}
            >
              <Home size={24} color="#fff" />
              <Text style={styles.homeButtonText}>Back to Home</Text>
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
    top: 60,
    left: 20,
  },
  topRight: {
    top: 100,
    right: 30,
  },
  bottomLeft: {
    bottom: 200,
    left: 30,
  },
  bottomRight: {
    bottom: 250,
    right: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 50,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  trophyContainer: {
    marginBottom: 30,
  },
  congratsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5A2B',
    textAlign: 'center',
    marginBottom: 10,
  },
  userName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 10,
  },
  completionMessage: {
    fontSize: 20,
    color: '#A67B5B',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '600',
  },
  overallScoreContainer: {
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
    minWidth: 250,
  },
  overallScoreLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.9,
    marginTop: 10,
    marginBottom: 5,
  },
  overallScoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  riskLevelMessage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  diagnosisContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    width: '100%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  diagnosisTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B5A2B',
    marginBottom: 15,
    textAlign: 'center',
  },
  diagnosisItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8D5B7',
  },
  diagnosisLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5A2B',
  },
  diagnosisValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  diagnosisAction: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
  },
  diagnosisActionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B5A2B',
    marginBottom: 8,
  },
  diagnosisActionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  gameResultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    width: '100%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gameResultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B5A2B',
    marginBottom: 20,
    textAlign: 'center',
  },
  gameResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E8D5B7',
  },
  gameResultInfo: {
    flex: 1,
  },
  gameResultName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B5A2B',
    marginBottom: 3,
  },
  gameResultDetails: {
    fontSize: 14,
    color: '#A67B5B',
  },
  gameResultScore: {
    backgroundColor: '#A3C4F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  gameResultScoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  encouragementContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    alignItems: 'center',
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  encouragementTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8B5A2B',
    marginTop: 10,
    marginBottom: 15,
  },
  encouragementText: {
    fontSize: 16,
    color: '#A67B5B',
    textAlign: 'center',
    lineHeight: 24,
  },
  recommendationsContainer: {
    backgroundColor: '#F0F8FF',
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    width: '100%',
    elevation: 2,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5A2B',
    marginBottom: 15,
    textAlign: 'center',
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
    gap: 15,
  },
  downloadButton: {
    backgroundColor: '#1e3a8a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 25,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    flex: 1,
    justifyContent: 'center',
  },
  downloadButtonDisabled: {
    backgroundColor: '#9ca3af',
    elevation: 2,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  homeButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 25,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    flex: 1,
    justifyContent: 'center',
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  loadingText: {
    fontSize: 20,
    color: '#8B5A2B',
    textAlign: 'center',
    marginTop: 100,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    pointerEvents: 'none',
  },
  confettiAnimation: {
    width: '100%',
    height: '100%',
  },
});
