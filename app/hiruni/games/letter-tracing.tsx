import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { RotateCcw, ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { GameScoring } from '@/utils/IT21838248/gameUtils';
import GameWrapper, { getRandomQuestions } from '@/components/IT21838248/GameWrapper';
import { GAME_WEIGHTS } from '@/config/IT21838248/gameConfig';

export default function LetterTracingGame() {
  const { sequential, nextGameIndex } = useLocalSearchParams();
  const [currentRound, setCurrentRound] = useState(0);
  const [currentLetter, setCurrentLetter] = useState(0);
  const [responses, setResponses] = useState<any>([]);
  const [timeLeft, setTimeLeft] = useState(60); // 3 minutes
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [isTracing, setIsTracing] = useState(false);
  const [paths, setPaths] = useState<any>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [showEndAnimation, setShowEndAnimation] = useState(false);
  const [showStartAnimation, setShowStartAnimation] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const letterContainerRef = useRef<any>(null);
  const letterContainerLayout = useRef({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  }).current;
  const animatedValue = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const answersAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<any>(null);

  const rounds = useMemo(
    () => [
      {
        id: 1,
        title: 'Trace the Strokes',
        letters: getRandomQuestions(['A', 'E', 'F', 'M', 'Z']),
        instruction: 'Trace these letters with your finger. Follow the lines!',
      },
      {
        id: 2,
        title: 'Trace the Curves',
        letters: getRandomQuestions(['B', 'C', 'D', 'P', 'G']),
        instruction: 'These letters have curves. Trace them gently!',
      },
      {
        id: 3,
        title: 'Be Careful with These',
        letters: getRandomQuestions(['b', 'd', 'p', 'q']),
        instruction: 'These letters can be tricky! Take your time.',
      },
    ],
    []
  );

  useEffect(() => {
    setShowStartAnimation(true);
    setGameStarted(true);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sequential]);

  const handleStartAnimationComplete = () => {
    setShowStartAnimation(false);
    setGameStarted(true);
  };

  useEffect(() => {
    if (gameStarted) {
      startTimer();
      startPulseAnimation();
      startFadeInAnimation();
    }
  }, [gameStarted, currentRound]);

  useEffect(() => {
    if (gameStarted) {
      startFadeInAnimation();
    }
  }, [currentLetter]);
  useEffect(() => {
    // Measure letter container position for accurate drawing coordinates
    if (letterContainerRef.current) {
      letterContainerRef.current.measure(
        (x:any, y:any, width:any, height:any, pageX:any, pageY:any) => {
          letterContainerLayout.x = pageX;
          letterContainerLayout.y = pageY;
          letterContainerLayout.width = width;
          letterContainerLayout.height = height;
        }
      );
    }
  }, [currentLetter, currentRound]);

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

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

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
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt, gestureState) => {
      // Start a new path
      const { locationX, locationY } = evt.nativeEvent;
      setIsTracing(true);
      setCurrentPath(`M ${locationX} ${locationY}`);
    },
    onPanResponderMove: (evt, gestureState) => {
      if (isTracing) {
        // Add to the current path
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath((prev) => `${prev} L ${locationX} ${locationY}`);
      }
    },
    onPanResponderRelease: () => {
      // Finish the path
      setIsTracing(false);
      setPaths((prev:any) => [...prev, currentPath]);
      recordTrace();
    },
  });

  const recordTrace = () => {
    const round = rounds[currentRound];
    const letter = round.letters[currentLetter];

    const traceData = {
      roundId: currentRound + 1,
      letterId: currentLetter,
      letter: letter,
      paths: [...paths, currentPath],
      timeSpent: 180 - timeLeft,
      timestamp: new Date().toISOString(),
    };

    setResponses((prev:any) => [...prev, traceData]);
  };

  const handleCompleteTracing = () => {
    startFadeOutAnimation(() => {
      const round = rounds[currentRound];

      if (currentLetter < round.letters.length - 1) {
        setCurrentLetter((prev) => prev + 1);
        setPaths([]);
        setCurrentPath('');
        playEncouragement();
      } else {
        completeRound();
      }
    });
  };

  const playEncouragement = () => {
    const encouragements = [
      'Great job! Keep going!',
      'Wonderful tracing!',
      "You're doing amazing!",
      'Perfect! Next letter!',
    ];
    const message =
      encouragements[Math.floor(Math.random() * encouragements.length)];
    Speech.speak(message);
  };

  const completeRound = () => {
    if (currentRound < rounds.length - 1) {
      setCurrentRound((prev) => prev + 1);
      setCurrentLetter(0);
      setPaths([]);
      setCurrentPath('');
    } else {
      finishGame();
    }
  };

  const handleTimeout = () => {
    completeRound();
  };

  const handleSkip = () => {
    startFadeOutAnimation(() => {
      Speech.speak("No worries! You're doing great! Let's try the next one!");

      // Record skip
      const round = rounds[currentRound];
      const letter = round.letters[currentLetter];

      const skipData = {
        roundId: currentRound + 1,
        letterId: currentLetter,
        letter: letter,
        skipped: true,
        timestamp: new Date().toISOString(),
      };

      setResponses((prev:any) => [...prev, skipData]);

      if (currentLetter < round.letters.length - 1) {
        setCurrentLetter((prev) => prev + 1);
        setPaths([]);
        setCurrentPath('');
      } else {
        completeRound();
      }
    });
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
      await GameScoring.saveGameProgress(1, 'Letter Tracing', responses);

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
            currentIndex: nextGameIndex || '1',
          },
        });
        return;
      }

      Speech.speak('Fantastic job! You completed the letter tracing game!');

      setTimeout(() => {
        router.push({
          pathname: '/hiruni/games/sequential-play',
          params: {
            gameName: 'Letter Tracing',
            totalRounds: rounds.length,
            responses: JSON.stringify(responses),
          },
        });
      }, 2000);
    } catch (error) {
      console.error('Error saving responses:', error);
      router.back();
    }
  };

  const handleReset = () => {
    setPaths([]);
    setCurrentPath('');
  };

  const round = rounds[currentRound];
  const letter = round.letters[currentLetter];

  return (
    <GameWrapper
      title={round.title}
      instruction={round.instruction}
      currentRound={currentRound + 1}
      totalRounds={rounds.length}
      currentQuestion={currentLetter + 1}
      totalQuestions={round.letters.length}
      timeLeft={timeLeft}
      setTimeLeft={setTimeLeft}
      isTimerPaused={isTimerPaused}
      setIsTimerPaused={setIsTimerPaused}
      onSkip={handleSkip}
      onTimeout={handleTimeout}
      showStartAnimation={showStartAnimation}
      onStartAnimationComplete={handleStartAnimationComplete}
      startAnimationTitle="Let's Trace Letters!"
      sequential={sequential === 'true'}
      showEndAnimation={showEndAnimation}
      onEndAnimationComplete={handleEndAnimationComplete}
      endAnimationSuccess={true}
    >
      <View style={styles.gameContent}>
        <Animated.View
          ref={letterContainerRef}
          style={[
            styles.letterContainer,
            {
              // transform: [{ scale: animatedValue }],
              opacity: fadeAnim,
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Text style={styles.letter}>{letter}</Text>

          {/* Trace overlay with SVG for smooth drawing */}
          <Svg style={styles.traceOverlay}>
            {paths.map((path:any, index:any) => (
              <Path
                key={index}
                d={path}
                stroke="#FF6B6B"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
            {isTracing && (
              <Path
                d={currentPath}
                stroke="#FF6B6B"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
          </Svg>
        </Animated.View>

        <Text style={styles.traceHint}>
          Trace the letter "{letter}" with your finger
        </Text>

        <Animated.View
          style={[
            styles.actionButtons,
            {
              opacity: answersAnim,
              transform: [
                {
                  translateY: answersAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <RotateCcw size={20} color="#8B5A2B" />
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>

          {(paths.length > 0 || currentPath.length > 0) && (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleCompleteTracing}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <ArrowRight size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </GameWrapper>
  );
}

const styles = StyleSheet.create({
  gameContent: {
    flex: 1,
  },
  letterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    height: 300,
    borderRadius: 20,
    marginBottom: 20,
    position: 'relative',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  letter: {
    fontSize: 250,
    fontWeight: '900',
    color: '#E8D5B7',
    textAlign: 'center',
  },
  traceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  traceHint: {
    fontSize: 20,
    color: '#A67B5B',
    textAlign: 'center',
    marginBottom: 30,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    marginBottom: 30,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#E8D5B7',
  },
  resetButtonText: {
    color: '#8B5A2B',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B7E4C7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});
