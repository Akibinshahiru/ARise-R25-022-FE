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

const colors = {
  blue: '#A3C4F3',
  green: '#B7E4C7',
  yellow: '#FFF3B0',
  lavender: '#CDB4DB',
  orange: '#FFD6A5',
  gray: '#D8D8D8',
};

const colorNames = Object.keys(colors);

const rounds = [
  {
    id: 1,
    title: 'Color Memory - Easy',
    instruction: 'Watch the colors, then pick the matching sequence!',
    sequenceLength: 2,
    optionsCount: 2,
    questions: 2,
  },
  {
    id: 2,
    title: 'Color Memory - Medium',
    instruction: 'Remember the colors and pick the right sequence!',
    sequenceLength: 2,
    optionsCount: 3,
    questions: 2,
  },
  {
    id: 3,
    title: 'Color Memory - Hard',
    instruction: 'Watch carefully! Remember all three colors!',
    sequenceLength: 3,
    optionsCount: 3,
    questions: 2,
  },
];

export default function ColorMatchingGame() {
  const { sequential, nextGameIndex } = useLocalSearchParams();
  const [currentRound, setCurrentRound] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [gamePhase, setGamePhase] = useState<'showing' | 'selecting'>(
    'showing'
  );
  const [targetSequence, setTargetSequence] = useState<string[]>([]);
  const [options, setOptions] = useState<string[][]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [showingIndex, setShowingIndex] = useState(0);
  const [countdownSeconds, setCountdownSeconds] = useState(5);
  const [showEndAnimation, setShowEndAnimation] = useState(false);
  const [showStartAnimation, setShowStartAnimation] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const answersAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null|any>(null);
  const countdownRef = useRef<NodeJS.Timeout | null|any>(null);

  useEffect(() => {
    setShowStartAnimation(true);
    startTimer();
    setStartTime(Date.now());
    generateQuestion();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [sequential]);

  useEffect(() => {
    startTimer();
    setStartTime(Date.now());
    generateQuestion();
  }, [currentRound]);

  const handleStartAnimationComplete = () => {
    setShowStartAnimation(false);
    // Start the game after animation completes
    startTimer();
    setStartTime(Date.now());
    generateQuestion();
  };

  useEffect(() => {
    if (currentQuestion > 0) {
      generateQuestion();
      setStartTime(Date.now());
      startFadeInAnimation();
    }
  }, [currentQuestion]);

  const startFadeInAnimation = () => {
    fadeAnim.setValue(0);
    answersAnim.setValue(0);

    Animated.stagger(400, [
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
    const round = rounds[currentRound];

    const sequence: any = [];
    const availableColors = [...colorNames];

    for (let i = 0; i < round.sequenceLength; i++) {
      const randomIndex = Math.floor(Math.random() * availableColors.length);
      sequence.push(availableColors[randomIndex]);
      availableColors.splice(randomIndex, 1);

      if (availableColors.length === 0) {
        availableColors.push(...colorNames);
      }
    }
    setTargetSequence(sequence);

    let optionsList = [];
    optionsList.push([...sequence]);

    if (currentRound === 0) {
      let wrongSequence;
      do {
        wrongSequence = [];
        const tempAvailable = [...colorNames];

        for (let j = 0; j < round.sequenceLength; j++) {
          const randomIndex = Math.floor(Math.random() * tempAvailable.length);
          wrongSequence.push(tempAvailable[randomIndex]);
          tempAvailable.splice(randomIndex, 1);

          if (tempAvailable.length === 0) {
            tempAvailable.push(...colorNames);
          }
        }
      } while (JSON.stringify(wrongSequence) === JSON.stringify(sequence));

      optionsList.push(wrongSequence);
    } else if (currentRound === 1) {
      const wrongOrder = [...sequence];
      [wrongOrder[0], wrongOrder[1]] = [wrongOrder[1], wrongOrder[0]];
      optionsList.push(wrongOrder);

      let differentColors;
      do {
        differentColors = [];
        const tempAvailable = [...colorNames];

        for (let j = 0; j < round.sequenceLength; j++) {
          const randomIndex = Math.floor(Math.random() * tempAvailable.length);
          differentColors.push(tempAvailable[randomIndex]);
          tempAvailable.splice(randomIndex, 1);

          if (tempAvailable.length === 0) {
            tempAvailable.push(...colorNames);
          }
        }
      } while (
        JSON.stringify(differentColors) === JSON.stringify(sequence) ||
        JSON.stringify(differentColors) === JSON.stringify(wrongOrder)
      );

      optionsList.push(differentColors);
    } else if (currentRound === 2) {
      const permutations = getAllPermutations(sequence).filter(
        (perm:any) => JSON.stringify(perm) !== JSON.stringify(sequence)
      );

      const selectedPerms = permutations
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);

      optionsList = optionsList.concat(selectedPerms);
    }

    const shuffledOptions = optionsList.sort(() => Math.random() - 0.5);
    setOptions(shuffledOptions);

    setSelectedOption(null);
    setGamePhase('showing');
    setShowingIndex(0);

    setCountdownSeconds(10);
    startCountdown();
  };

  const getAllPermutations = (arr: any): any => {
    if (arr.length <= 1) return [arr];

    const result = [];
    for (let i = 0; i < arr.length; i++) {
      const current = arr[i];
      const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
      const remainingPerms = getAllPermutations(remaining);

      for (let perm of remainingPerms) {
        result.push([current, ...perm]);
      }
    }

    return result;
  };

  const startCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    setCountdownSeconds(10);
    countdownRef.current = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          showSequence();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const showSequence = () => {
    const round = rounds[currentRound];

    const showNext = (index: number) => {
      if (index < targetSequence.length) {
        setShowingIndex(index);

        Animated.sequence([
          Animated.timing(flashAnim, {
            toValue: 1.3,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(flashAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();

        setTimeout(() => showNext(index + 1), 800);
      } else {
        setTimeout(() => {
          setGamePhase('selecting');
          Speech.speak('Now pick the matching sequence!');
        }, 500);
      }
    };

    showNext(0);
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setTimeLeft(60);
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

  const selectOption = (index: number) => {
    setSelectedOption(index);

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
    if (selectedOption === null) return;

    startFadeOutAnimation(() => {
      const correctIndex = options.findIndex(
        (option) => JSON.stringify(option) === JSON.stringify(targetSequence)
      );
      const isCorrect = selectedOption === correctIndex;
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      const response = {
        gameId: 5,
        roundId: currentRound + 1,
        questionId: currentQuestion + 1,
        userAnswer: selectedOption,
        correctAnswer: correctIndex,
        targetSequence,
        isCorrect,
        timeSpent,
        skipped: false,
        timestamp: new Date().toISOString(),
      };

      setResponses((prev) => [...prev, response]);

      if (isCorrect) {
        Speech.speak(generatePositiveReinforcementText());
      } else {
        Speech.speak('Good try! Keep practicing your memory!');
      }

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
      startTimer();
    } else {
      finishGame();
    }
  };

  const handleSkip = () => {
    const correctIndex = options.findIndex(
      (option) => JSON.stringify(option) === JSON.stringify(targetSequence)
    );
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    const response = {
      gameId: 5,
      roundId: currentRound + 1,
      questionId: currentQuestion + 1,
      userAnswer: null,
      correctAnswer: correctIndex,
      targetSequence,
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

    setShowEndAnimation(true);
  };

  const handleEndAnimationComplete = async () => {
    setShowEndAnimation(false);

    try {
      await GameScoring.saveGameProgress(5, 'Color Matching', responses);

      if (sequential === 'true') {
        router.replace({
          pathname: '/hiruni/games/sequential-play',
          params: {
            sequence: JSON.stringify(
              GAME_WEIGHTS.slice()
                .sort((a:any, b:any) => a.weight - b.weight)
                .map((g:any) => g.gameId)
            ),
            currentIndex: nextGameIndex || '2',
          },
        });
        return;
      }
      Speech.speak('Fantastic job! You completed the color matching game!');

      setTimeout(() => {
        router.push({
          pathname: '/hiruni/games/sequential-play',
          params: {
            gameName: 'Color Matching',
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
      startAnimationTitle="Let's Match Colors!"
      sequential={sequential === 'true'}
      showEndAnimation={showEndAnimation}
      onEndAnimationComplete={handleEndAnimationComplete}
      endAnimationSuccess={true}
    >
      <View style={styles.gameContent}>
        {gamePhase === 'showing' ? (
          <View style={[styles.sequenceContainer]}>
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>⏰ {countdownSeconds}s</Text>
            </View>

            <Text style={styles.sequenceTitle}>Watch the colors:</Text>

            <View style={styles.sequenceDisplay}>
              {targetSequence.map((colorName, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.colorCircle,
                    {
                      backgroundColor: colors[colorName as keyof typeof colors],
                    },
                    index === showingIndex && {
                      transform: [{ scale: flashAnim }],
                      elevation: 8,
                    },
                  ]}
                />
              ))}
            </View>

            <Text style={styles.memoryHint}>Remember this sequence!</Text>
          </View>
        ) : (
          <View style={[styles.selectionContainer]}>
            <Text style={styles.selectionTitle}>
              Which sequence did you see?
            </Text>

            <View style={styles.optionsContainer}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionContainer,
                    selectedOption === index && styles.optionContainerSelected,
                  ]}
                  onPress={() => selectOption(index)}
                >
                  <View style={styles.optionSequence}>
                    {option.map((colorName, colorIndex) => (
                      <View
                        key={colorIndex}
                        style={[
                          styles.optionColorCircle,
                          {
                            backgroundColor:
                              colors[colorName as keyof typeof colors],
                          },
                        ]}
                      />
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Submit Button */}
            {selectedOption !== null && (
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
            )}
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
    paddingBottom: 30,
  },
  sequenceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  sequenceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5A2B',
    marginBottom: 40,
  },
  sequenceDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  colorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginHorizontal: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  countdownText: {
    marginLeft: 8,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5A2B',
  },
  memoryHint: {
    fontSize: 18,
    color: '#A67B5B',
    textAlign: 'center',
  },
  selectionContainer: {
    flex: 1,
  },
  selectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8B5A2B',
    textAlign: 'center',
    marginBottom: 30,
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  optionContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  optionContainerSelected: {
    backgroundColor: '#F0F8FF',
    borderColor: '#8B5A2B',
    elevation: 6,
  },
  optionSequence: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionColorCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginHorizontal: 8,
    elevation: 2,
  },
  submitButton: {
    backgroundColor: '#CDB4DB',
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
