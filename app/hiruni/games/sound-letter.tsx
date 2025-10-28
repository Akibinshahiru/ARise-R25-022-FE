import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  ScrollView,
} from 'react-native';
import { Volume2, Play } from 'lucide-react-native';
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import GameWrapper, { getRandomQuestions } from '@/components/IT21838248/GameWrapper';
import {
  GameScoring,
  generatePositiveReinforcementText,
} from '@/utils/IT21838248/gameUtils';
import { GAME_WEIGHTS } from '@/config/IT21838248/gameConfig';

export default function SoundLetterGame() {
  const { sequential, nextGameIndex } = useLocalSearchParams();
  const [currentRound, setCurrentRound] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(180);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [showEndAnimation, setShowEndAnimation] = useState(false);
  const [showStartAnimation, setShowStartAnimation] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const answersAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null | any>(null);

  useEffect(() => {
    setShowStartAnimation(true);
    startTimer();
    setStartTime(Date.now());

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sequential]);

  useEffect(() => {
    startTimer();
    setStartTime(Date.now());
    startFadeInAnimation();
  }, [currentRound]);

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
  const handleStartAnimationComplete = () => {
    setShowStartAnimation(false);
    // Start the game after animation completes
    startTimer();
    setStartTime(Date.now());
  };

  const rounds = useMemo(
    () => [
      {
        id: 1,
        title: 'Sound to Letter',
        instruction: 'Listen to the sound and pick the correct letter!',
        questions: getRandomQuestions([
          { sound: 'A', options: ['E', 'A', 'I', 'O'], correct: 'A' },
          { sound: 'B', options: ['B', 'D', 'P', 'M'], correct: 'B' },
          { sound: 'C', options: ['S', 'K', 'C', 'G'], correct: 'C' },
          { sound: 'F', options: ['F', 'V', 'P', 'T'], correct: 'F' },
          { sound: 'M', options: ['W', 'N', 'M', 'R'], correct: 'M' },
        ]),
      },
      {
        id: 2,
        title: 'Letter to Sound',
        instruction: 'Look at the letter and pick the sound it makes!',
        questions: getRandomQuestions([
          { letter: 'D', options: ['D', 'B', 'P', 'T'], correct: 'D' },
          { letter: 'G', options: ['C', 'G', 'J', 'K'], correct: 'G' },
          { letter: 'H', options: ['H', 'F', 'K', 'L'], correct: 'H' },
          { letter: 'L', options: ['R', 'L', 'I', 'N'], correct: 'L' },
          { letter: 'T', options: ['K', 'D', 'T', 'P'], correct: 'T' },
        ]),
      },
    ],
    []
  );

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

  const playSound = (letter: string) => {
    Speech.speak(letter, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.7,
    });
  };

  const selectAnswer = (answer: string) => {
    setSelectedAnswer(answer);

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
    if (!selectedAnswer) return;

    startFadeOutAnimation(() => {
      const round = rounds[currentRound];
      const question = round.questions[currentQuestion];
      const isCorrect = selectedAnswer === question.correct;
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      const response = {
        gameId: 2,
        roundId: currentRound + 1,
        questionId: currentQuestion + 1,
        userAnswer: selectedAnswer,
        correctAnswer: question.correct,
        isCorrect,
        timeSpent,
        skipped: false,
        timestamp: new Date().toISOString(),
      };

      setResponses((prev) => [...prev, response]);

      if (isCorrect) {
        Speech.speak(generatePositiveReinforcementText());
      } else {
        Speech.speak('Good try! Keep going!');
      }

      // Move to next question or round
      if (currentQuestion < round.questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setSelectedAnswer(null);
        setStartTime(Date.now());
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
    const question = round.questions[currentQuestion];
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    const response = {
      gameId: 2,
      roundId: currentRound + 1,
      questionId: currentQuestion + 1,
      userAnswer: null,
      correctAnswer: question.correct,
      isCorrect: false,
      timeSpent,
      skipped: true,
      timestamp: new Date().toISOString(),
    };

    setResponses((prev) => [...prev, response]);

    if (currentQuestion < round.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setStartTime(Date.now());
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
      await GameScoring.saveGameProgress(2, 'Sound & Letters', responses);

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
            currentIndex: nextGameIndex || '2',
          },
        });
        return;
      }

      Speech.speak('Fantastic job! You completed the sound and letters game!');

      setTimeout(() => {
        router.push({
          pathname: '/hiruni/games/sequential-play',
          params: {
            gameName: 'Sound & Letters',
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
  const question = round.questions[currentQuestion];

  return (
    <ScrollView>
      <GameWrapper
        title={round.title}
        instruction={round.instruction}
        currentRound={currentRound + 1}
        totalRounds={rounds.length}
        currentQuestion={currentQuestion + 1}
        totalQuestions={round.questions.length}
        timeLeft={timeLeft}
        setTimeLeft={setTimeLeft}
        isTimerPaused={isTimerPaused}
        setIsTimerPaused={setIsTimerPaused}
        onSkip={handleSkip}
        onTimeout={handleTimeout}
        showStartAnimation={showStartAnimation}
        onStartAnimationComplete={handleStartAnimationComplete}
        startAnimationTitle="Let's Match Letters to Sound!"
        sequential={sequential === 'true'}
        showEndAnimation={showEndAnimation}
        onEndAnimationComplete={handleEndAnimationComplete}
        endAnimationSuccess={true}
      >
        <View style={styles.gameContent}>
          {/* Question Display */}
          <Animated.View
            style={[styles.questionContainer, { opacity: fadeAnim }]}
          >
            {round.id === 1 ? (
              // Sound to Letter
              <View style={styles.soundContainer}>
                <Text style={styles.questionText}>Listen to the sound:</Text>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => playSound(question.sound)}
                >
                  <Volume2 size={40} color="#fff" />
                  <Text style={styles.playButtonText}>Play Sound</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Letter to Sound
              <View style={styles.letterContainer}>
                <Text style={styles.questionText}>
                  What sound does this letter make?
                </Text>
                <View style={styles.letterSoundContainer}>
                  <TouchableOpacity
                    style={styles.letterDisplay}
                    onPress={() => playSound(question.letter)}
                  >
                    <Text style={styles.displayLetter}>{question.letter}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.soundButton}
                    onPress={() => playSound(question.letter)}
                  >
                    <Play size={24} color="#8B5A2B" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>

          {/* Options */}
          <Animated.View
            style={[
              styles.optionsContainer,
              {
                opacity: answersAnim,
                transform: [
                  {
                    scale: answersAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.optionsTitle}>
              {round.id === 1 ? 'Pick the letter:' : 'Pick the sound:'}
            </Text>

            <View style={styles.optionsGrid}>
              {question.options.map((option:any, index:any) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    round.id === 1 ? styles.optionButton : styles.optionButton2,
                    selectedAnswer === option && styles.optionButtonSelected,
                  ]}
                  onPress={() => selectAnswer(option)}
                >
                  {round.id === 1 && (
                    <Text
                      style={[
                        styles.optionText,
                        selectedAnswer === option && styles.optionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={styles.soundButton}
                    onPress={() => playSound(option)}
                  >
                    <Play size={24} color="#8B5A2B" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Submit Button */}
          {selectedAnswer && (
            <Animated.View
              style={{
                opacity: answersAnim,
                transform: [
                  { scale: scaleAnim },
                  {
                    translateY: answersAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                style={styles.submitButton}
                onPress={submitAnswer}
              >
                <Text style={styles.submitButtonText}>Next Question</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </GameWrapper>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  gameContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  questionContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  soundContainer: {
    alignItems: 'center',
  },
  letterContainer: {
    alignItems: 'center',
  },
  questionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5A2B',
    textAlign: 'center',
    marginBottom: 20,
  },
  playButton: {
    backgroundColor: '#A3C4F3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 25,
    elevation: 3,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  letterDisplay: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#B7E4C7',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  displayLetter: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#fff',
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B5A2B',
    textAlign: 'center',
    marginBottom: 10,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  optionButton: {
    backgroundColor: '#fff',
    width: '45%',
    aspectRatio: 1.5,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  optionButton2: {
    backgroundColor: '#fff',
    width: '45%',
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: '#FFD6A5',
    borderColor: '#8B5A2B',
    elevation: 5,
  },
  optionText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#8B5A2B',
  },
  optionTextSelected: {
    color: '#fff',
  },
  soundButton: {
    marginTop: 10,
    backgroundColor: '#E8D5B7',
    borderRadius: 12,
    padding: 6,
  },
  submitButton: {
    backgroundColor: '#B7E4C7',
    paddingVertical: 18,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginBottom:30,
    marginTop:5
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  letterSoundContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
