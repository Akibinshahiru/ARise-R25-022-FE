import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import GameWrapper from '@/components/IT21838248/GameWrapper';
import {
  GameScoring,
  generatePositiveReinforcementText,
} from '@/utils/IT21838248/gameUtils';
import { GAME_WEIGHTS } from '@/config/IT21838248/gameConfig';

const rounds = [
  {
    id: 1,
    title: 'Find the Correct "b"',
    instruction:
      'Look carefully! Find the correct letter "b" among these options.',
    targetLetter: 'b',
    options: [
      { letter: 'b', isCorrect: true, rotation: 0 },
      { letter: 'd', isCorrect: false, rotation: 0 },
      { letter: 'p', isCorrect: false, rotation: 0 },
      { letter: 'q', isCorrect: false, rotation: 0 },
    ],
    questions: 1,
  },
  {
    id: 2,
    title: 'Find the Correct "F"',
    instruction:
      'Look carefully! Find the correct letter "F" among these options.',
    targetLetter: 'F',
    options: [
      { letter: 'F', isCorrect: true, rotation: 0 },
      { letter: 'F', isCorrect: false, rotation: 180 },
      { letter: 'Ⅎ', isCorrect: false, rotation: 0, scaleX: -1 },
      { letter: 'F', isCorrect: false, rotation: 0, scaleX: -1 },
    ],
    questions: 1,
  },
];

export default function SameDifferentGame() {
  const { sequential, nextGameIndex } = useLocalSearchParams();
  const [currentRound, setCurrentRound] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(180);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [shuffledOptions, setShuffledOptions] = useState<any[]>([]);
  const [showEndAnimation, setShowEndAnimation] = useState(false);
  const [showStartAnimation, setShowStartAnimation] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const answersAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<any>(null);

  useEffect(() => {
    setShowStartAnimation(true);
    startTimer();
    setStartTime(Date.now());
    shuffleOptions();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sequential]);

  useEffect(() => {
    startTimer();
    setStartTime(Date.now());
    shuffleOptions();
    startFadeInAnimation();
  }, [currentRound, currentQuestion]);

  const startFadeInAnimation = () => {
    fadeAnim.setValue(0);
    answersAnim.setValue(0);

    Animated.stagger(350, [
      Animated.spring(fadeAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(answersAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startFadeOutAnimation = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(answersAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };
  const handleStartAnimationComplete = () => {
    setShowStartAnimation(false);
    // Start the game after animation completes
    startTimer();
    setStartTime(Date.now());
    shuffleOptions();
  };

  const shuffleOptions = () => {
    const round = rounds[currentRound];
    const shuffled = [...round.options].sort(() => Math.random() - 0.5);
    setShuffledOptions(shuffled);
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setTimeLeft(180);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (isTimerPaused) return prev;
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);
  };

  const handleTimeout = () => {
    completeRound();
  };

  const selectAnswer = (index: number) => {
    setSelectedAnswer(index);

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const submitAnswer = () => {
    if (selectedAnswer === null) return;

    startFadeOutAnimation(() => {
      const round = rounds[currentRound];
      const selectedOption = shuffledOptions[selectedAnswer];
      const isCorrect = selectedOption.isCorrect;
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      const response = {
        gameId: 3,
        roundId: currentRound + 1,
        questionId: currentQuestion + 1,
        userAnswer: selectedAnswer,
        correctAnswer: shuffledOptions.findIndex((opt) => opt.isCorrect),
        isCorrect,
        timeSpent,
        skipped: false,
        timestamp: new Date().toISOString(),
      };

      setResponses((prev) => [...prev, response]);

      if (isCorrect) {
        Speech.speak(generatePositiveReinforcementText());
      } else {
        Speech.speak('Good try! Keep looking carefully!');
      }

      // Move to next question or round
      if (currentQuestion < round.questions - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setSelectedAnswer(null);
        setStartTime(Date.now());
        shuffleOptions();
        startFadeInAnimation();
      } else {
        completeRound();
      }
    });
  };

  const completeRound = () => {
    if (currentRound < rounds.length - 1) {
      setCurrentRound((prev) => prev + 1);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setStartTime(Date.now());
      startTimer();
    } else {
      finishGame();
    }
  };

  const handleSkip = () => {
    const round = rounds[currentRound];
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    const response = {
      gameId: 3,
      roundId: currentRound + 1,
      questionId: currentQuestion + 1,
      userAnswer: null,
      correctAnswer: shuffledOptions.findIndex((opt) => opt.isCorrect),
      isCorrect: false,
      timeSpent,
      skipped: true,
      timestamp: new Date().toISOString(),
    };

    setResponses((prev) => [...prev, response]);

    if (currentQuestion < round.questions - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setStartTime(Date.now());
      shuffleOptions();
    } else {
      completeRound();
    }
  };

  const finishGame = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setShowEndAnimation(true);
  };

  const handleEndAnimationComplete = async () => {
    setShowEndAnimation(false);

    try {
      await GameScoring.saveGameProgress(3, 'Same or Different', responses);

      if (sequential === 'true') {
        // Continue to next game in sequence
        router.replace({
          pathname: '/hiruni/games/sequential-play',
          params: {
            sequence: JSON.stringify(
              GAME_WEIGHTS.slice()
                .sort((a:any, b:any) => a.weight - b.weight)
                .map((g:any) => g.gameId)
            ),
            currentIndex: nextGameIndex || '3',
          },
        });
        return;
      }

      Speech.speak('Fantastic job!');

      setTimeout(() => {
        router.push({
          pathname: '/hiruni/games/sequential-play',
          params: {
            gameName: 'Same or Different',
            totalRounds: rounds.length,
            responses: JSON.stringify(responses),
          },
        });
      }, 2000);
    } catch (error) {
      console.error('Error saving game progress:', error);
      router.back();
    }
  };

  const round = rounds[currentRound];

  return (
    <GameWrapper
      title={round.title}
      instruction={round.instruction}
      currentRound={currentRound + 1}
      totalRounds={rounds.length}
      currentQuestion={currentQuestion + 1}
      totalQuestions={round.questions}
      timeLeft={timeLeft}
      setTimeLeft={setTimeLeft}
      isTimerPaused={isTimerPaused}
      setIsTimerPaused={setIsTimerPaused}
      onSkip={handleSkip}
      onTimeout={handleTimeout}
      showStartAnimation={showStartAnimation}
      onStartAnimationComplete={handleStartAnimationComplete}
      startAnimationTitle="Let's Match Same Letter!"
      sequential={sequential === 'true'}
      showEndAnimation={showEndAnimation}
      onEndAnimationComplete={handleEndAnimationComplete}
      endAnimationSuccess={true}
    >
      <View style={styles.gameContent}>
        {/* Target Letter Display */}
        <Animated.View style={[styles.targetContainer, { opacity: fadeAnim }]}>
          <Text style={styles.targetTitle}>Find this letter:</Text>
          <View style={styles.targetLetterContainer}>
            <Text style={styles.targetLetter}>{round.targetLetter}</Text>
          </View>
        </Animated.View>

        {/* Options Grid */}
        <Animated.View
          style={[
            styles.optionsContainer,
            {
              opacity: answersAnim,
              transform: [
                {
                  scale: answersAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.optionsTitle}>Which one is correct?</Text>

          <View style={styles.optionsGrid}>
            {shuffledOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedAnswer === index && styles.optionButtonSelected,
                ]}
                onPress={() => selectAnswer(index)}
              >
                <Text
                  style={[
                    styles.optionLetter,
                    selectedAnswer === index && styles.optionLetterSelected,
                    {
                      transform: [
                        { rotate: `${option.rotation}deg` },
                        { scaleX: option.scaleX || 1 },
                      ],
                    },
                  ]}
                >
                  {option.letter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Submit Button */}
        {selectedAnswer !== null && (
          <Animated.View
            style={{
              opacity: answersAnim,
              transform: [
                { scale: scaleAnim },
                {
                  translateY: answersAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [25, 0],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitAnswer}
            >
              <Text style={styles.submitButtonText}>
                {currentQuestion < round.questions - 1
                  ? 'Next Question'
                  : 'Complete Round'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </GameWrapper>
  );
}

const styles = StyleSheet.create({
  gameContent: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingBottom: 30,
  },
  targetContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  targetTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8B5A2B',
    marginBottom: 15,
  },
  targetLetterContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#A3C4F3',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  targetLetter: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#fff',
  },
  optionsContainer: {
    flex: 1,
  },
  optionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B5A2B',
    textAlign: 'center',
    marginBottom: 25,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  optionButton: {
    backgroundColor: '#fff',
    width: '20%',
    aspectRatio: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    borderWidth: 4,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: '#B7E4C7',
    borderColor: '#8B5A2B',
    elevation: 6,
    transform: [{ scale: 1.05 }],
  },
  optionLetter: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#8B5A2B',
  },
  optionLetterSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#FFD6A5',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
