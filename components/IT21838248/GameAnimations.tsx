import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Star, Trophy, Sparkles, Heart } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface GameStartAnimationProps {
  visible: boolean;
  onComplete: () => void;
  title?: string;
}

export function GameStartAnimation({
  visible,
  onComplete,
  title = "Let's Play!",
}: GameStartAnimationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      rotateAnim.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.delay(500), // Brief pause to show the animation
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
      ]).start((finished) => {
        if (finished) {
          onComplete();
        }
      });
    } else {
      // Reset animations when not visible
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      rotateAnim.setValue(0);
    }
  }, [visible]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <View style={styles.animationOverlay}>
      <Animated.View
        style={[
          styles.animationContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Star size={80} color="#FFD700" />
        </Animated.View>
        <Text style={styles.animationTitle}>{title}</Text>
        <Text style={styles.animationSubtitle}>Get Ready! 🎮</Text>
      </Animated.View>
    </View>
  );
}

interface GameEndAnimationProps {
  visible: boolean;
  onComplete: () => void;
  success?: boolean;
}

export function GameEndAnimation({
  visible,
  onComplete,
  success = true,
}: GameEndAnimationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      bounceAnim.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 1 }
        ),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
      ]).start((finished) => {
        if (finished) {
          onComplete();
        }
      });
    } else {
      // Reset animations when not visible
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      bounceAnim.setValue(0);
    }
  }, [visible, onComplete]);

  const bounce = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  if (!visible) return null;

  return (
    <View style={styles.animationOverlay}>
      <Animated.View
        style={[
          styles.animationContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ translateY: bounce }] }}>
          {success ? (
            <Trophy size={80} color="#FFD700" />
          ) : (
            <Heart size={80} color="#FF6B6B" />
          )}
        </Animated.View>
        <Text style={styles.animationTitle}>
          {success ? 'Great Job!' : 'Good Try!'}
        </Text>
        <Text style={styles.animationSubtitle}>
          {success ? 'You did amazing! 🌟' : 'Keep practicing! 💪'}
        </Text>
      </Animated.View>
    </View>
  );
}

interface FinalCelebrationProps {
  visible: boolean;
  onComplete: () => void;
}

export function FinalCelebrationAnimation({
  visible,
  onComplete,
}: FinalCelebrationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      sparkleAnim.setValue(0);
      rotateAnim.setValue(0);

      // Start animation sequence
      Animated.sequence([
        // Entry animation
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 30,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        // Celebration effects
        Animated.parallel([
          Animated.sequence([
            Animated.timing(sparkleAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(sparkleAnim, {
              toValue: 0.5,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(sparkleAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        // Exit animation
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start((finished) => {
        if (finished) {
          onComplete();
        }
      });
    } else {
      // Reset animations when not visible
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      sparkleAnim.setValue(0);
      rotateAnim.setValue(0);
    }
  }, [visible, onComplete]);

  const sparkle = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.3, 0.8],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <View style={styles.celebrationOverlay}>
      <Animated.View
        style={[
          styles.celebrationContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Sparkle effects */}
        <Animated.View
          style={[
            styles.sparkleTopLeft,
            { transform: [{ scale: sparkle }, { rotate }] },
          ]}
        >
          <Sparkles size={30} color="#FFD700" />
        </Animated.View>

        <Animated.View
          style={[
            styles.sparkleTopRight,
            { transform: [{ scale: sparkle }, { rotate }] },
          ]}
        >
          <Sparkles size={25} color="#FF6B6B" />
        </Animated.View>

        <Animated.View
          style={[
            styles.sparkleBottomLeft,
            { transform: [{ scale: sparkle }, { rotate }] },
          ]}
        >
          <Sparkles size={35} color="#4CAF50" />
        </Animated.View>

        <Animated.View
          style={[
            styles.sparkleBottomRight,
            { transform: [{ scale: sparkle }, { rotate }] },
          ]}
        >
          <Sparkles size={28} color="#A3C4F3" />
        </Animated.View>

        {/* Main content */}
        <Trophy size={100} color="#FFD700" />
        <Text style={styles.celebrationTitle}>🎉 AMAZING! 🎉</Text>
        <Text style={styles.celebrationSubtitle}>
          You completed all the games!
        </Text>
        <Text style={styles.celebrationMessage}>
          Let's see your fantastic results! ⭐
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  animationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(250, 243, 221, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  lottieContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  lottieAnimation: {
    width: 300,
    height: 300,
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  animationTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B5A2B',
    marginTop: 20,
    textAlign: 'center',
  },
  animationSubtitle: {
    fontSize: 20,
    color: '#A67B5B',
    marginTop: 10,
    textAlign: 'center',
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(250, 243, 221, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  celebrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  sparkleTopLeft: {
    position: 'absolute',
    top: -100,
    left: -80,
  },
  sparkleTopRight: {
    position: 'absolute',
    top: -80,
    right: -60,
  },
  sparkleBottomLeft: {
    position: 'absolute',
    bottom: -120,
    left: -70,
  },
  sparkleBottomRight: {
    position: 'absolute',
    bottom: -90,
    right: -80,
  },
  celebrationTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#8B5A2B',
    marginTop: 30,
    textAlign: 'center',
  },
  celebrationSubtitle: {
    fontSize: 24,
    color: '#A67B5B',
    marginTop: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  celebrationMessage: {
    fontSize: 18,
    color: '#8B5A2B',
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
