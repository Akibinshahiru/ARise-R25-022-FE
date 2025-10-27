import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
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

const allLetters = [
  'a',
  'b',
  'd',
  'f',
  'g',
  'h',
  'M',
  'p',
  'q',
  't',
  'W',
  'B',
  'D',
  's',
  'z',
];

const rounds = [
  {
    id: 1,
    title: 'Letter Hunt - Round 1',
    instruction: 'Find the target letter in the grid! Look carefully.',
    questions: 2,
  },
  {
    id: 2,
    title: 'Letter Hunt - Round 2',
    instruction: 'Find the target letter in the grid! Take your time.',
    questions: 2,
  },
];

export default function LetterHuntGame() {
  const { sequential, nextGameIndex } = useLocalSearchParams();
  const [currentRound, setCurrentRound] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [targetLetter, setTargetLetter] = useState('');
  const [grid, setGrid] = useState<string[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(180);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [usedLetters, setUsedLetters] = useState<string[]>([]);
  const [showEndAnimation, setShowEndAnimation] = useState(false);
  const [showStartAnimation, setShowStartAnimation] = useState(false);
  const [showTargetLetter, setShowTargetLetter] = useState(true);
  const [memorizeTimeLeft, setMemorizeTimeLeft] = useState(10);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const answersAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null | any>(null);
  const memorizeTimerRef = useRef<NodeJS.Timeout | null | any>(null);

  useEffect(() => {
    setShowStartAnimation(true);
    startTimer();
    startMemorizeTimer();
    setStartTime(Date.now());
    generateQuestion();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (memorizeTimerRef.current) {
        clearInterval(memorizeTimerRef.current);
      }
    };
  }, [sequential]);

  useEffect(() => {
    startTimer();
    startMemorizeTimer();
    setStartTime(Date.now());
    generateQuestion();
  }, [currentRound]);

  const handleStartAnimationComplete = () => {
    setShowStartAnimation(false);
    // Start the game after animation completes
    startTimer();
    startMemorizeTimer();
    setStartTime(Date.now());
    generateQuestion();
  };

  useEffect(() => {
    if (currentQuestion > 0) {
      generateQuestion();
      setStartTime(Date.now());
      setShowTargetLetter(true);
      setMemorizeTimeLeft(10);
      startMemorizeTimer();
      startFadeInAnimation();
    }
  }, [currentQuestion]);

  const startFadeInAnimation = () => {
    fadeAnim.setValue(0);
    answersAnim.setValue(0);

    Animated.stagger(300, [
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
  const generateQuestion = () => {
    // Select target letter (avoid previously used letters in this round)
    const availableLetters = allLetters.filter(
      (letter) => !usedLetters.includes(letter)
    );
    const target =
      availableLetters[Math.floor(Math.random() * availableLetters.length)];
    setTargetLetter(target);
    setUsedLetters((prev) => [...prev, target]);

    // Generate 3x3 grid
    const newGrid = Array(9).fill('');

    // Place target letter in random position
    const targetPosition = Math.floor(Math.random() * 9);
    newGrid[targetPosition] = target;

    // Fill remaining positions with random letters (excluding target)
    const otherLetters = allLetters.filter((letter) => letter !== target);
    for (let i = 0; i < 9; i++) {
      if (i !== targetPosition) {
        newGrid[i] =
          otherLetters[Math.floor(Math.random() * otherLetters.length)];
      }
    }

    setGrid(newGrid);
    setSelectedPosition(null);
  };

  const startMemorizeTimer = () => {
    if (memorizeTimerRef.current) {
      clearInterval(memorizeTimerRef.current);
    }

    setMemorizeTimeLeft(10);
    setShowTargetLetter(true);

    memorizeTimerRef.current= setInterval(() => {
      setMemorizeTimeLeft((prev) => {
        if (prev <= 1) {
          if (memorizeTimerRef.current) {
            clearInterval(memorizeTimerRef.current);
          }
          setShowTargetLetter(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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

  const selectPosition = (position: number) => {
    setSelectedPosition(position);

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
    if (selectedPosition === null) return;

    startFadeOutAnimation(() => {
      const correctPosition = grid.findIndex(
        (letter) => letter === targetLetter
      );
      const isCorrect = selectedPosition === correctPosition;
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      const response = {
        gameId: 4,
        roundId: currentRound + 1,
        questionId: currentQuestion + 1,
        userAnswer: selectedPosition,
        correctAnswer: correctPosition,
        targetLetter,
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
      const round = rounds[currentRound];
      if (currentQuestion < round.questions - 1) {
        setCurrentQuestion((prev) => prev + 1);
      } else {
        completeRound();
      }
    });
  };

  const completeRound = () => {
    if (currentRound < rounds.length - 1) {
      setCurrentRound((prev) => prev + 1);
      setCurrentQuestion(0);
      setUsedLetters([]);
      startTimer();
      startMemorizeTimer();
    } else {
      finishGame();
    }
  };

  const handleSkip = () => {
    const correctPosition = grid.findIndex((letter) => letter === targetLetter);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    const response = {
      gameId: 4,
      roundId: currentRound + 1,
      questionId: currentQuestion + 1,
      userAnswer: null,
      correctAnswer: correctPosition,
      targetLetter,
      isCorrect: false,
      timeSpent,
      skipped: true,
      timestamp: new Date().toISOString(),
    };

    setResponses((prev) => [...prev, response]);

    const round = rounds[currentRound];
    if (currentQuestion < round.questions - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      completeRound();
    }
  };

  const finishGame = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (memorizeTimerRef.current) {
      clearInterval(memorizeTimerRef.current);
    }

    setShowEndAnimation(true);
  };

  const handleEndAnimationComplete = async () => {
    setShowEndAnimation(false);

    try {
      await GameScoring.saveGameProgress(4, 'Letter Hunt', responses);

      if (sequential === 'true') {
        // Continue to next game in sequence
        router.replace({
          pathname: '/hiruni/games/sequential-play',
          params: {
            sequence: JSON.stringify(
              GAME_WEIGHTS.slice()
                .sort((a: any, b: any) => a.weight - b.weight)
                .map((g: any) => g.gameId)
            ),
            currentIndex: nextGameIndex || '4',
          },
        });
        return;
      }

      Speech.speak('Fantastic job! You completed the letter hunt game!');

      setTimeout(() => {
        router.push({
          pathname: '/hiruni/games/results',
          params: {
            gameName: 'Letter Hunt',
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
      startAnimationTitle="Let's Hunt Letters!"
      sequential={sequential === 'true'}
      showEndAnimation={showEndAnimation}
      onEndAnimationComplete={handleEndAnimationComplete}
      endAnimationSuccess={true}
    >
      <View style={styles.gameContent}>
        {/* Target Letter Display - Only visible during memorize phase */}
        {showTargetLetter && (
          <View style={[styles.targetContainer]}>
            <Text style={styles.targetTitle}>Memorize this letter:</Text>
            <View style={styles.targetLetterContainer}>
              <Text style={styles.targetLetter}>{targetLetter}</Text>
            </View>
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>⏰ {memorizeTimeLeft}s</Text>
            </View>
          </View>
        )}

        {/* Letter Grid - Only visible after memorize phase */}
        {!showTargetLetter && (
          <View style={[styles.gridContainer]}>
            <Text style={styles.gridTitle}>Find the letter you memorized:</Text>

            <View style={styles.letterGrid}>
              {grid.map((letter, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.gridCell,
                    selectedPosition === index && styles.gridCellSelected,
                  ]}
                  onPress={() => selectPosition(index)}
                >
                  <Text
                    style={[
                      styles.gridLetter,
                      selectedPosition === index && styles.gridLetterSelected,
                    ]}
                  >
                    {letter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Submit Button - Only visible after selecting a position and memorize phase is over */}
        {selectedPosition !== null && !showTargetLetter && (
          <View>
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
          </View>
        )}
      </View>
    </GameWrapper>
  );
}

const styles = StyleSheet.create({
  gameContent: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  countdownText: {
    marginLeft: 8,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5A2B',
  },
  countdownContainer: {
    marginVertical: 10,
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
    backgroundColor: '#CDB4DB',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  targetLetter: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#fff',
  },
  memorizeCountdown: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5A2B',
    marginTop: 15,
  },
  gridContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gridTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B5A2B',
    textAlign: 'center',
    marginBottom: 10,
  },
  letterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 300,
    height: 250,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gridCell: {
    width: '30%',
    aspectRatio: 1,
    margin: '1.5%',
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  gridCellSelected: {
    backgroundColor: '#A3C4F3',
    borderColor: '#8B5A2B',
    elevation: 3,
  },
  gridLetter: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B5A2B',
  },
  gridLetterSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#B7E4C7',
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
