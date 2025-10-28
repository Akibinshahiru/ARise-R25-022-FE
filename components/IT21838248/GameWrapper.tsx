import React, { useEffect, useRef, ReactNode, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  BackHandler,
  Modal,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { ArrowLeft, Volume2, SkipForward } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { GameStartAnimation, GameEndAnimation } from './GameAnimations';

export const getRandomQuestions = (letters: any[], count = 2) => {
  const shuffled = [...letters].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

interface GameWrapperProps {
  children: ReactNode;
  title: string;
  instruction: string;
  currentRound: number;
  totalRounds: number;
  currentQuestion?: number;
  totalQuestions?: number;
  timeLeft: number;
  setTimeLeft: (time: number | ((prev: number) => number)) => void;
  isTimerPaused: boolean;
  setIsTimerPaused: (paused: boolean) => void;
  onSkip: () => void;
  onTimeout?: () => void;
  onBack?: () => void;
  showProgress?: boolean;
  showStartAnimation?: boolean;
  onStartAnimationComplete?: () => void;
  startAnimationTitle?: string;
  sequential?: boolean;
  showEndAnimation?: boolean;
  onEndAnimationComplete?: () => void;
  endAnimationSuccess?: boolean;
}

export default function GameWrapper({
  children,
  title,
  instruction,
  currentRound,
  totalRounds,
  currentQuestion,
  totalQuestions,
  timeLeft,
  setTimeLeft,
  isTimerPaused,
  setIsTimerPaused,
  onSkip,
  onTimeout,
  onBack,
  showProgress = true,
  showStartAnimation = false,
  onStartAnimationComplete,
  startAnimationTitle = "Let's Play!",
  sequential = false,
  showEndAnimation = false,
  onEndAnimationComplete,
  endAnimationSuccess = true,
}: GameWrapperProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [timeoutHandled, setTimeoutHandled] = useState(false);

  // Show timeout modal when timeLeft reaches 0
  useEffect(() => {
    if (
      timeLeft === 0 &&
      !showTimeoutModal &&
      !timeoutHandled &&
      !isTimerPaused &&
      onTimeout
    ) {
      setShowTimeoutModal(true);
      setIsTimerPaused(true);
      setTimeoutHandled(true);
      setTimeLeft(180);
    }
  }, [
    timeLeft,
    showTimeoutModal,
    timeoutHandled,
    isTimerPaused,
    onTimeout,
    setTimeLeft,
    setIsTimerPaused,
  ]);

  useEffect(() => {
    // Handle Android back button
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (onBack) {
          onBack();
        } else {
          router.back();
        }
        return true;
      }
    );

    return () => backHandler.remove();
  }, [onBack]);

  useEffect(() => {
    startPulseAnimation();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const speakInstruction = () => {
    Speech.speak(instruction, {
      language: 'en-US',
      pitch: 1.2,
      rate: 0.9,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeoutContinue = () => {
    setShowTimeoutModal(false);
    Speech.speak("Time's up! Don't worry, you're doing great!");

    setTimeout(() => {
      if (onTimeout) {
        onTimeout();
      }
      // Reset timeout states and unpause timer after handling
      setIsTimerPaused(false);
      setTimeoutHandled(false);
    }, 1500);
  };

  const handleSkip = () => {
    Speech.speak("No worries! You're doing great! Let's try the next one!");

    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => onSkip(), 500);
  };

  return (
    <View style={styles.container}>
      <GameStartAnimation
        visible={showStartAnimation}
        onComplete={onStartAnimationComplete || (() => {})}
        title={startAnimationTitle}
      />

      <GameEndAnimation
        visible={showEndAnimation}
        onComplete={onEndAnimationComplete || (() => {})}
        success={endAnimationSuccess}
      />

      {/* Timeout Modal */}
      <Modal
        visible={showTimeoutModal}
        transparent
        animationType="fade"
        onRequestClose={handleTimeoutContinue}
      >
        <View style={styles.timeoutOverlay}>
          <View style={styles.timeoutContainer}>
            <LottieView
              source={require('../../assets/animations/bell.json')}
              autoPlay
              loop={false}
              style={styles.timeoutLottie}
            />
            <Text style={styles.timeoutTitle}>Time's Up! ⏰</Text>
            <Text style={styles.timeoutMessage}>
              Don't worry, you did great! Let's move to the next part.
            </Text>
            <TouchableOpacity
              style={styles.timeoutButton}
              onPress={handleTimeoutContinue}
            >
              <Text style={styles.timeoutButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack || (() => router.back())}
        >
          <ArrowLeft size={24} color="#8B5A2B" />
        </TouchableOpacity>

        {showProgress && (
          <View style={styles.progressContainer}>
            <Text style={styles.gameTitle}>{title}</Text>
            <Text style={styles.progressText}>
              Round {currentRound}/{totalRounds}
              {currentQuestion &&
                totalQuestions &&
                ` • Question ${currentQuestion}/${totalQuestions}`}
            </Text>
          </View>
        )}

        <Text
          style={[
            styles.timer,
            { color: timeLeft < 60 ? '#FF6B6B' : '#8B5A2B' },
          ]}
        >
          {formatTime(timeLeft)}
        </Text>
      </View>

      {/* Instructions */}
      <Animated.View
        style={[
          styles.instructionContainer,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <TouchableOpacity style={styles.speakButton} onPress={speakInstruction}>
          <Volume2 size={20} color="#fff" />
          <Text style={styles.speakButtonText}>Listen</Text>
        </TouchableOpacity>
        <Text style={styles.instruction}>{instruction}</Text>
      </Animated.View>

      {/* Game Content */}
      <View style={styles.gameContent}>{children}</View>

      {/* Skip Button */}
      <View style={styles.skipContainer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <SkipForward size={20} color="#fff" />
          <Text style={styles.skipButtonText}>Skip This One</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3DD',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5A2B',
    textAlign: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#A67B5B',
    textAlign: 'center',
  },
  timer: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 60,
    textAlign: 'center',
  },
  instructionContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A3C4F3',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  speakButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  instruction: {
    fontSize: 16,
    color: '#8B5A2B',
    lineHeight: 24,
  },
  gameContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  skipContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD6A5',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  timeoutOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  timeoutContainer: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  timeoutLottie: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  timeoutTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5A2B',
    marginBottom: 15,
    textAlign: 'center',
  },
  timeoutMessage: {
    fontSize: 18,
    color: '#A67B5B',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 25,
  },
  timeoutButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  timeoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
